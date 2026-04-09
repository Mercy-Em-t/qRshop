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
    const { order_id, phone, amount, shop_id, is_b2b } = await req.json()

    if (!order_id || !phone || !amount || !shop_id) {
      throw new Error("Missing required parameters")
    }
    if (typeof order_id !== 'string' || typeof shop_id !== 'string') {
      throw new Error("Invalid parameter types")
    }

    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Fetch Credentials from the appropriate table
    const targetTable = is_b2b ? 'suppliers' : 'shops'
    const { data: recipient, error: recErr } = await supabase
      .from(targetTable)
      .select('mpesa_shortcode, mpesa_passkey')
      .eq('id', shop_id)
      .single()

    if (recErr || !recipient?.mpesa_shortcode || !recipient?.mpesa_passkey) {
      throw new Error(`${is_b2b ? 'Supplier' : 'Shop'} M-Pesa credentials not configured.`)
    }

    const shortcode = recipient.mpesa_shortcode
    const passkey = recipient.mpesa_passkey

    // 3. Platform Credentials for OAuth
    const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY')
    const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET')
    const envString = Deno.env.get('MPESA_ENVIRONMENT')
    const resolvedEnvironment = envString === 'production' ? 'production' : 'sandbox'
    const baseUrl = resolvedEnvironment === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke"

    if (!consumerKey || !consumerSecret) {
       throw new Error("Platform M-Pesa API Keys missing in Supabase secrets.")
    }

    // 4. Generate OAuth Token
    const authString = btoa(`${consumerKey}:${consumerSecret}`)
    const authRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authString}` },
    })
    
    if (!authRes.ok) throw new Error(`Failed to generate M-Pesa token`)
    const authData = await authRes.json()
    const accessToken = authData.access_token

    // 5. Generate Password and Timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3)
    const password = btoa(`${shortcode}${passkey}${timestamp}`)

    // Clean phone (must be 254...)
    let safePhone = String(phone).replace(/[^0-9]/g, '')
    if (safePhone.startsWith('0')) safePhone = '254' + safePhone.substring(1)
    if (!/^254\d{9}$/.test(safePhone)) throw new Error('Invalid phone number format. Expected format: 254XXXXXXXXX (Kenyan E.164)')

    // 6. Push to STK
    const webhookSecret = Deno.env.get('MPESA_WEBHOOK_SECRET')
    const callbackUrl = webhookSecret 
        ? `${supabaseUrl}/functions/v1/mpesa-webhook?secret=${webhookSecret}`
        : `${supabaseUrl}/functions/v1/mpesa-webhook`
    
    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline", 
      Amount: Math.ceil(Number(amount)),
      PartyA: safePhone,
      PartyB: shortcode,
      PhoneNumber: safePhone,
      CallBackURL: callbackUrl,
      AccountReference: `${is_b2b ? 'S' : 'O'}${order_id.split('-')[0].toUpperCase()}`,
      TransactionDesc: is_b2b ? "Wholesale Order" : "Retail Order"
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
    if (!stkRes.ok || stkData.errorCode) throw new Error(`STK Push Failed: ${JSON.stringify(stkData)}`)

    // 7. Log to payment_audit_log for the webhook to find
    await supabase
      .from('payment_audit_log')
      .insert({
         checkout_request_id: stkData.CheckoutRequestID,
         target_table: is_b2b ? 'supplier_orders' : 'orders',
         target_id: order_id,
         amount: amount,
         status: 'pending'
      });

    // 8. Update the original order status
    await supabase
      .from(is_b2b ? 'supplier_orders' : 'orders')
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
