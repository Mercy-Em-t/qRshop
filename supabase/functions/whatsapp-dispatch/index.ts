import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { order_id, target_phone, target_type, customer_name, shop_name, total, summary, status } = await req.json()

    // Environment variables
    const WA_PHONE_NUMBER_ID = Deno.env.get('WA_PHONE_NUMBER_ID')
    const WA_ACCESS_TOKEN = Deno.env.get('WA_ACCESS_TOKEN')

    if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
      throw new Error("Missing WhatsApp API credentials in Supabase Vault")
    }

    if (!target_phone) {
        throw new Error("No destination WhatsApp number provided")
    }

    // Clean phone number (Meta requires international format without the +)
    let cleanPhone = String(target_phone).replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "254" + cleanPhone.substring(1);

    // Meta WhatsApp Cloud API Endpoint
    const url = `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`

    let payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "text",
      text: { body: "System notification" }
    };

    if (target_type === 'shop') {
      // Interactive Message to Shop Owner
      payload.type = "interactive";
      payload.interactive = {
        type: "button",
        body: {
          text: `🚨 *NEW ORDER ARRIVED*\n\n*Client:* ${customer_name || 'Anonymous'}\n*Receipt:* #${String(order_id).split('-')[0].toUpperCase()}\n\n*Summary:*\n${summary}\n\n*Total:* KSh ${total}\n\nDo you accept this order?`
        },
        action: {
          buttons: [
            { type: "reply", reply: { id: `accept_${order_id}`, title: "✅ Accept & Bill" } },
            { type: "reply", reply: { id: `reject_${order_id}`, title: "❌ Reject (Sold Out)" } },
            { type: "reply", reply: { id: `edit_${order_id}`, title: "📝 Request Edit" } }
          ]
        }
      };
    } else if (target_type === 'customer') {
      // Simple Text/Template to Customer based on Status
      let bodyText = `Hi ${customer_name || 'there'},\n\nUpdate on your order from *${shop_name}* (Order #${String(order_id).split('-')[0].toUpperCase()}): `

      switch(status) {
        case 'received':
        case 'pending':
          bodyText += "Your order has been received and is pending shop confirmation. Please wait for an update."; break;
        case 'accepted':
          bodyText += "Your order has been ACCEPTED! The shop is preparing it now."; break;
        case 'pending_payment':
          bodyText += `Your order has been accepted. Amount due: KSh ${total}. Please proceed with payment.`; break;
        case 'ready':
          bodyText += "Your order is READY!"; break;
        case 'ready_for_pickup':
          bodyText += "Your order is READY FOR PICKUP! You can head to the shop now."; break;
        case 'dispatched':
        case 'dropped_off':
          bodyText += "Your order has been DISPATCHED and is on its way to you."; break;
        case 'rejected':
          bodyText += "Unfortunately, the shop cannot fulfill your order right now and has rejected it."; break;
        default:
          bodyText += `Status changed to: ${status}`;
      }

      payload.type = "text";
      payload.text = { body: bodyText };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const result = await response.json()

    if (!response.ok) {
        console.error("Meta API error:", result)
        throw new Error(result.error?.message || "Failed to dispatch WhatsApp message")
    }

    return new Response(JSON.stringify({ success: true, messageId: result.messages?.[0]?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("WhatsApp Dispatch Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
