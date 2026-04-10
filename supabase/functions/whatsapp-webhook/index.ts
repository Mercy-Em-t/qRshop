import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // 1. Meta Webhook Verification (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    const verifyToken = Deno.env.get('WA_VERIFY_TOKEN')
    if (!verifyToken) {
      return new Response('Webhook token not configured', { status: 500 })
    }

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified!')
      return new Response(challenge, { status: 200 })
    } else {
      return new Response('Forbidden', { status: 403 })
    }
  }

  // 2. Incoming Messages (POST)
  if (req.method === 'POST') {
    try {
      const body = await req.json()
      console.log(JSON.stringify(body, null, 2))

      // Parse the Meta Webapp Payload
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0]
        const changes = entry?.changes?.[0]
        const value = changes?.value
        const message = value?.messages?.[0]
        const merchantPhone = value?.contacts?.[0]?.wa_id

        // Initialize Supabase Admin Client to bypass RLS updates
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)
        const waToken = Deno.env.get('WA_ACCESS_TOKEN')!
        const waPhoneId = Deno.env.get('WA_PHONE_NUMBER_ID')!

        const sendWaText = async (text: string) => {
             if (!merchantPhone || !waToken || !waPhoneId) return;
             await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
                 method: 'POST',
                 headers: { 'Authorization': `Bearer ${waToken}`, 'Content-Type': 'application/json' },
                 body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: merchantPhone, type: "text", text: { body: text } })
             });
        }

        // 1. Handle Free-Form Text Reasoning
        if (message?.type === 'text') {
            const bodyText = message.text.body.trim();
            if (bodyText.toUpperCase().startsWith('EDIT ')) {
                const parts = bodyText.split(' ');
                if (parts.length >= 3) {
                    const shortId = parts[1].toLowerCase();
                    const reason = parts.slice(2).join(' ');
                    
                    // Find the UUID that matches the short ID
                    const { data: orderData } = await supabase.from('orders').select('id').ilike('id', `${shortId}-%`).limit(1).single();
                    
                    if (orderData?.id) {
                         await supabase.from('orders').update({ edit_reason: reason, status: 'requires_edit' }).eq('id', orderData.id);
                         await sendWaText(`✅ Order #${shortId.toUpperCase()} flagged. The customer's tracking page now shows: "${reason}"`);
                    } else {
                         await sendWaText(`❌ Could not find an active order matching Receipt #${shortId.toUpperCase()}`);
                    }
                }
            }
        }

        // 2. Only act on Interactive Button Replies
        if (message?.type === 'interactive' && message.interactive?.type === 'button_reply') {
          const replyId = message.interactive.button_reply.id
          
          // replyId format: "accept_1234" or "reject_1234"
          const action = replyId.split('_')[0] // 'accept' or 'reject'
          const orderId = replyId.split('_').slice(1).join('_') // Handle UUIDs properly
          const shortId = orderId.split('-')[0].toUpperCase();
          
          let newStatus = 'pending'
          if (action === 'accept') newStatus = 'pending_payment' // Ready to pay STK
          if (action === 'reject') newStatus = 'rejected' // Inform customer

          // If standard accept/reject, update UI immediately
          if (action !== 'edit') {
             console.log(`Order ${orderId} marked as ${newStatus} by shop owner via WhatsApp.`);
             const { error } = await supabase
               .from('orders')
               .update({ status: newStatus })
               .eq('id', orderId)

             if (error) throw error
          }

          // If they tapped "Request Edit", trigger conversational capture
          if (action === 'edit') {
              console.log(`Order ${orderId} edit requested by shop owner. Triggering conversational flow...`);
              await sendWaText(`To tell the customer WHY this requires an edit, reply to me right here starting with *EDIT ${shortId}* and your reason.\n\nExample:\n*EDIT ${shortId} We sold out of Sprite.*`);
          }
        }
      }

      // Meta requires a crisp 200 OK or it resends
      return new Response('EVENT_RECEIVED', { status: 200 })

    } catch (error) {
      console.error('Webhook Error:', error)
      return new Response('Server Error', { status: 500 })
    }
  }

  return new Response('Method Not Allowed', { status: 405 })
})
