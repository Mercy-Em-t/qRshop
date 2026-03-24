import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // 1. Meta Webhook Verification (GET)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Optional: Protect with a secret Verify Token
    const verifyToken = Deno.env.get('WA_VERIFY_TOKEN') || 'shopqr_webhook_secret'

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

        // Only act on Interactive Button Replies
        if (message?.type === 'interactive' && message.interactive?.type === 'button_reply') {
          const replyId = message.interactive.button_reply.id
          
          // replyId format: "accept_1234" or "reject_1234"
          const action = replyId.split('_')[0] // 'accept' or 'reject'
          const orderId = replyId.split('_').slice(1).join('_') // Handle UUIDs properly
          
          let newStatus = 'pending'
          if (action === 'accept') newStatus = 'pending_payment' // Ready to pay STK
          if (action === 'reject') newStatus = 'rejected' // Inform customer
          if (action === 'edit') newStatus = 'requires_edit' // Inform customer to modify order

          console.log(`Order ${orderId} marked as ${newStatus} by shop owner via WhatsApp.`)

          // Initialize Supabase Admin Client to bypass RLS updates
          const supabaseUrl = Deno.env.get('SUPABASE_URL')!
          const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          const supabase = createClient(supabaseUrl, supabaseKey)

          const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)

          if (error) throw error

          // Optionally: Dispatch a confirmation message back to the shop owner using WA Dispatch
          // Or dispatch an STK Push instantly to the customer if accepted.
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
