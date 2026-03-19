import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // Always acknowledge receipt for webhooks
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    const payload = await req.json()
    console.log("M-Pesa Webhook Payload:", JSON.stringify(payload, null, 2))

    const stkCallback = payload?.Body?.stkCallback
    if (!stkCallback) {
      throw new Error("Invalid Daraja Webhook Payload")
    }

    const checkoutRequestId = stkCallback.CheckoutRequestID
    const resultCode = stkCallback.ResultCode
    const resultDesc = stkCallback.ResultDesc

    // Extract receipt if success
    let receiptNumber = null
    if (resultCode === 0 && stkCallback.CallbackMetadata?.Item) {
        const receiptItem = stkCallback.CallbackMetadata.Item.find((i: any) => i.Name === 'MpesaReceiptNumber')
        if (receiptItem) {
            receiptNumber = receiptItem.Value
        }
    }

    // 1. Initialize Supabase Admin Client to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Determine Order Status
    // ResultCode 0 is success, anything else is a failure (e.g. 1032 user cancelled)
    const orderStatus = resultCode === 0 ? 'paid' : 'cancelled'

    // 3. Update the matching Order
    const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
             status: orderStatus,
             payment_receipt: receiptNumber || resultDesc
        })
        .eq('mpesa_checkout_request_id', checkoutRequestId)
        .select()

    if (error) {
       console.error("Failed to map Webhook to Order:", error)
       throw error
    }

    if (updatedOrder && updatedOrder.length > 0) {
        console.log(`Successfully mapped STK webhook to Order ID: ${updatedOrder[0].id}. Set status: ${orderStatus}`)

        // Could also insert into `events` table (telemetry) here if desired:
        await supabase.from('events').insert([{
           event_type: orderStatus === 'paid' ? 'payment_success' : 'payment_failed',
           shop_id: updatedOrder[0].shop_id,
           device_info: { provider: 'mpesa', receipt: receiptNumber, desc: resultDesc }
        }])
    }

    // Acknowledge to Safaricom
    return new Response(JSON.stringify({ 
        "ResultCode": "0", 
        "ResultDesc": "Success" 
    }), { headers: { 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error("Webhook processing error:", error)
    // Safaricom expects a fast acknowledgement even if we fail internal mapping
    return new Response(JSON.stringify({ 
        "ResultCode": "1", 
        "ResultDesc": "Internal Server Error" 
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
})
