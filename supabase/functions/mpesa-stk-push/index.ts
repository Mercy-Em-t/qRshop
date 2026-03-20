import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, phone, amount, shop_id } = await req.json()

    if (!order_id || !phone || !amount || !shop_id) {
      throw new Error("Missing required parameters")
    }

    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Fetch Shop M-Pesa Credentials
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('mpesa_shortcode, mpesa_passkey')
      .eq('id', shop_id)
      .single()

    if (shopErr || !shop?.mpesa_shortcode || !shop?.mpesa_passkey) {
      throw new Error("Shop M-Pesa credentials not configured.")
    }

    const shortcode = shop.mpesa_shortcode
    const passkey = shop.mpesa_passkey

    // 3. Platform Credentials
    // We assume the Platform owner has registered an App on Safaricom Developer portal
    // and injected these keys into their Supabase Environment Secrets.
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')
    // Sandbox or Live URL toggle
    const envString = Deno.env.get('MPESA_ENVIRONMENT') || "sandbox"
    const baseUrl = envString === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke"

    if (!consumerKey || !consumerSecret) {
       throw new Error("Platform M-Pesa API Keys missing in Supabase secrets.")
    }

    // 4. Generate OAuth Token
    const authString = btoa(`${consumerKey}:${consumerSecret}`)
    const authRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authString}` },
    })
    
    if (!authRes.ok) {
       throw new Error(`Failed to generate M-Pesa token: ${await authRes.text()}`)
    }
    const authData = await authRes.json()
    const accessToken = authData.access_token

    // 5. Generate Password and Timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3) // Format: YYYYMMDDHHmmss
    const password = btoa(`${shortcode}${passkey}${timestamp}`)

    // Clean phone (must be 254...)
    let safePhone = phone.replace(/[^0-9]/g, '')
    if (safePhone.startsWith('0')) safePhone = '254' + safePhone.substring(1)

    // 6. Push to STK
    const webhookSecret = Deno.env.get('MPESA_WEBHOOK_SECRET')
    const callbackUrl = webhookSecret 
        ? `${supabaseUrl}/functions/v1/mpesa-webhook?secret=${webhookSecret}`
        : `${supabaseUrl}/functions/v1/mpesa-webhook`
    
    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline", // Or CustomerBuyGoodsOnline depending on till type
      Amount: Math.ceil(Number(amount)),
      PartyA: safePhone,
      PartyB: shortcode,
      PhoneNumber: safePhone,
      CallBackURL: callbackUrl,
      AccountReference: `Order ${order_id.split('-')[0].toUpperCase()}`,
      TransactionDesc: "ShopQR Payment"
    }

    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPayload)
    })

    const stkData = await stkRes.json()

    if (!stkRes.ok || stkData.errorCode) {
       throw new Error(`STK Push Failed: ${JSON.stringify(stkData)}`)
    }

    // 7. Log CheckoutRequestID so the Webhook can trace it back to the exact Order ID
    await supabase
      .from('orders')
      .update({ 
         status: 'stk_pushed',
         mpesa_checkout_request_id: stkData.CheckoutRequestID 
      })
      .eq('id', order_id)

    return new Response(JSON.stringify({ success: true, data: stkData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("STK Push error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
