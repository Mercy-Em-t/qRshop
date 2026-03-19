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
    // ResultCode 0 is success, anything else is failure (e.g. 1032 user cancelled)
    const orderStatus = resultCode === 0 ? 'paid' : 'cancelled'

    // 3. Update the matching Order + compute financial split
    // First fetch the order so we have the shop_id, total_price, delivery_fee and shop's commission rate
    const { data: orderRows, error: fetchErr } = await supabase
        .from('orders')
        .select(`
          id, shop_id, total_price, delivery_fee_charged,
          shops ( platform_commission_rate, delivery_managed_by_platform )
        `)
        .eq('mpesa_checkout_request_id', checkoutRequestId)
        .limit(1)

    if (fetchErr || !orderRows || orderRows.length === 0) {
        console.error("Could not find order for STK:", checkoutRequestId)
        throw new Error("Order not found for this STK request")
    }

    const order = orderRows[0] as any
    const shopCommissionRate: number = order.shops?.platform_commission_rate ?? 5.0
    const deliveryFee: number = order.delivery_fee_charged ?? 0
    const totalPaid: number = order.total_price ?? 0
    const goodsSubtotal: number = totalPaid - deliveryFee

    // Calculate the 3-way split
    const platformCommission = parseFloat(((goodsSubtotal * shopCommissionRate) / 100).toFixed(2))
    const deliveryFeeRetained = deliveryFee   // Platform keeps 100% of delivery
    const shopAmountDue = parseFloat((goodsSubtotal - platformCommission).toFixed(2))

    console.log(`Split for Order ${order.id}: goods=${goodsSubtotal} | commission=${platformCommission} | delivery=${deliveryFeeRetained} | shop_due=${shopAmountDue}`)

    const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
             status: orderStatus,
             payment_receipt: receiptNumber || resultDesc,
             goods_subtotal: goodsSubtotal,
             platform_commission: platformCommission,
             delivery_fee_retained: deliveryFeeRetained,
             shop_amount_due: shopAmountDue,
             settlement_status: 'unsettled'
        })
        .eq('id', order.id)
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
