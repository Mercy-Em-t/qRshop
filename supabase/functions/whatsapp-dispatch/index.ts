import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { order_id, shop_phone, customer_name, total, summary } = await req.json()

    // Environment variables
    const WA_PHONE_NUMBER_ID = Deno.env.get('WA_PHONE_NUMBER_ID')
    const WA_ACCESS_TOKEN = Deno.env.get('WA_ACCESS_TOKEN')

    if (!WA_PHONE_NUMBER_ID || !WA_ACCESS_TOKEN) {
      throw new Error("Missing WhatsApp API credentials in Supabase Vault")
    }

    if (!shop_phone) {
        throw new Error("No destination WhatsApp number provided")
    }

    // Clean phone number (Meta requires international format without the +)
    // E.g. 254700000000
    let cleanPhone = String(shop_phone).replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) cleanPhone = "254" + cleanPhone.substring(1);

    // Meta WhatsApp Cloud API Endpoint
    const url = `https://graph.facebook.com/v19.0/${WA_PHONE_NUMBER_ID}/messages`

    // We send an Interactive Message. 
    // IMPORTANT: If sending outside 24h, Meta requires an Approved Template with buttons.
    // For this demonstration, we assume a pre-approved utility template named 'new_order_alert'
    
    // In our payload, we pass the order_id within the payload of the buttons.
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "interactive",
      interactive: {
        type: "button",
        body: {
          text: `🚨 *NEW ORDER ARRIVED*\n\n*Client:* ${customer_name || 'Anonymous'}\n*Receipt:* #${String(order_id).split('-')[0].toUpperCase()}\n\n*Summary:*\n${summary}\n\n*Total:* KSh ${total}\n\nDo you accept this order?`
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: `accept_${order_id}`,
                title: "✅ Accept & Bill"
              }
            },
            {
              type: "reply",
              reply: {
                id: `reject_${order_id}`,
                title: "❌ Reject (Sold Out)"
              }
            },
            {
              type: "reply",
              reply: {
                id: `edit_${order_id}`,
                title: "📝 Request Edit"
              }
            }
          ]
        }
      }
    };

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
