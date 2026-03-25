import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // Always acknowledge receipt for webhooks
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } })
  }

  try {
    // SECURITY: Validate Webhook Secret Token to prevent spoofing/DDoS
    const url = new URL(req.url)
    const providedSecret = url.searchParams.get('secret')
    const expectedSecret = Deno.env.get('MPESA_WEBHOOK_SECRET')
    
    if (expectedSecret && providedSecret !== expectedSecret) {
       console.error(`[SECURITY EVENT] Dropped unauthorized webhook hit from ${req.headers.get('x-forwarded-for') || 'unknown IP'}`)
       return new Response("Unauthorized", { status: 401 })
    }

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
    const orderStatus = resultCode === 0 ? 'paid' : 'cancelled'

    // 3. Lookup in Payment Audit Log
    const { data: auditLog, error: auditErr } = await supabase
        .from('payment_audit_log')
        .select('*')
        .eq('checkout_request_id', checkoutRequestId)
        .single()

    if (auditErr || !auditLog) {
        console.error("Could not find audit log for STK:", checkoutRequestId)
        throw new Error("Transaction audit log not found")
    }

    const { target_table, target_id } = auditLog

    // 4. Update the Target Table
    if (target_table === 'orders') {
        // Retail Order logic (includes commission splitting)
        const { data: orderRows } = await supabase
            .from('orders')
            .select(`
              id, shop_id, total_price, delivery_fee_charged,
              shops ( platform_commission_rate )
            `)
            .eq('id', target_id)
            .limit(1)

        const order = orderRows?.[0] as any
        if (order && resultCode === 0) {
            const shopCommissionRate: number = order.shops?.platform_commission_rate ?? 5.0
            const deliveryFee: number = order.delivery_fee_charged ?? 0
            const totalPaid: number = order.total_price ?? 0
            const goodsSubtotal: number = totalPaid - deliveryFee
            const platformCommission = parseFloat(((goodsSubtotal * shopCommissionRate) / 100).toFixed(2))
            const shopAmountDue = parseFloat((goodsSubtotal - platformCommission).toFixed(2))

            await supabase
                .from('orders')
                .update({
                     status: orderStatus,
                     payment_receipt: receiptNumber || resultDesc,
                     goods_subtotal: goodsSubtotal,
                     platform_commission: platformCommission,
                     delivery_fee_retained: deliveryFee,
                     shop_amount_due: shopAmountDue,
                     settlement_status: 'unsettled'
                })
                .eq('id', target_id)
        } else {
            await supabase.from('orders').update({ status: orderStatus }).eq('id', target_id)
        }
    } else {
        // Wholesale / Simple Table logic
        await supabase
            .from(target_table)
            .update({
                 status: orderStatus,
                 payment_receipt: receiptNumber || resultDesc
            })
            .eq('id', target_id)
    }

    // 5. Update Audit Log status
    await supabase.from('payment_audit_log').update({ status: orderStatus }).eq('id', auditLog.id)

    // 6. Log event
    await supabase.from('events').insert([{
       event_type: orderStatus === 'paid' ? 'payment_success' : 'payment_failed',
       device_info: { provider: 'mpesa', receipt: receiptNumber, desc: resultDesc, table: target_table }
    }])

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
