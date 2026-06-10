import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { order_id, customer_email, customer_name, shop_name, status, total, summary, platform_resend_key, custom_resend_key } = await req.json()

    if (!customer_email) {
      throw new Error("No customer email provided")
    }

    // Determine which API key to use (Pro users can provide their own, otherwise use platform key)
    const RESEND_API_KEY = custom_resend_key || platform_resend_key || Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      throw new Error("Missing Resend API key")
    }

    // Determine email details based on status
    let subject = ""
    let htmlContent = ""

    if (status === "pending" || status === "received") {
      subject = `Order Received - ${shop_name}`
      htmlContent = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4c1d95;">Order Received</h2>
          <p>Hi ${customer_name || 'Customer'},</p>
          <p>We've received your order from <strong>${shop_name}</strong> and are reviewing it now.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Order ID:</strong> #${String(order_id).split('-')[0].toUpperCase()}</p>
            <p style="margin: 10px 0 0 0;"><strong>Summary:</strong><br/>${summary.replace(/\\n/g, '<br/>')}</p>
            <p style="margin: 10px 0 0 0; font-size: 18px;"><strong>Total:</strong> KSh ${total}</p>
          </div>
          <p>You will receive another update as soon as the shop accepts the order.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Powered by Modern Savannah</p>
        </div>
      `
    } else if (status === "accepted" || status === "pending_payment") {
       subject = `Order Accepted - ${shop_name}`
       htmlContent = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #10b981;">Order Accepted!</h2>
          <p>Great news! <strong>${shop_name}</strong> has accepted your order.</p>
          <p>If you haven't paid yet, please complete your payment to finalize the order.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;"><strong>Amount Due:</strong> KSh ${total}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Powered by Modern Savannah</p>
        </div>
      `
    } else {
       subject = `Order Update: ${status.toUpperCase()} - ${shop_name}`
       htmlContent = `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #4c1d95;">Order Status Update</h2>
          <p>Your order from <strong>${shop_name}</strong> has been updated.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
            <span style="display: inline-block; padding: 8px 16px; background-color: #4c1d95; color: white; border-radius: 20px; font-weight: bold; text-transform: uppercase; font-size: 14px;">${status.replace('_', ' ')}</span>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Powered by Modern Savannah</p>
        </div>
      `
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Modern Savannah Orders <orders@modernsavannah.com>',
        to: [customer_email],
        subject: subject,
        html: htmlContent,
      })
    })

    if (!res.ok) {
      const errorData = await res.text()
      console.error("Resend API Error:", errorData)
      throw new Error(`Failed to send email via Resend: ${errorData}`)
    }

    const data = await res.json()

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Email Dispatch Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
