import { z } from 'zod';

const stkPushSchema = z.object({
  phone: z.string().min(10).max(15),
  amount: z.number().positive(),
  orderId: z.string().uuid()
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method Not Allowed'});

  const validation = stkPushSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ 
      error: "Invalid input", 
      details: validation.error.format() 
    });
  }

  const { phone, amount, orderId } = validation.data;

  // Environment variables MUST be set in Vercel/Local .env
  const consumerKey = process.env.DARAJA_CONSUMER_KEY;
  const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
  const passkey = process.env.DARAJA_PASSKEY;
  const shortcode = process.env.DARAJA_SHORTCODE;

  if (!consumerKey || !consumerSecret || !passkey || !shortcode) {
    console.error("Critical Security Failure: Missing Daraja credentials in environment.");
    return res.status(500).json({ error: "Server configuration error" });
  }

  // Format phone logically
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = `254${formattedPhone.slice(1)}`;
  } else if (!formattedPhone.startsWith('254')) {
    formattedPhone = `254${formattedPhone}`;
  }

  try {
    // 1. Generate Access Token via Consumer Signatures
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenRes = await fetch("https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials", {
      headers: { Authorization: `Basic ${auth}` }
    });
    
    if (!tokenRes.ok) throw new Error("Failed to authenticate with Safaricom. Ensure your Daraja credentials are correct.");
    const { access_token } = await tokenRes.json();

    // 2. Generate Timestamps & Passwords 
    const d = new Date();
    const timestamp = d.getFullYear() + 
      String(d.getMonth() + 1).padStart(2, '0') + 
      String(d.getDate()).padStart(2, '0') + 
      String(d.getHours()).padStart(2, '0') + 
      String(d.getMinutes()).padStart(2, '0') + 
      String(d.getSeconds()).padStart(2, '0');

    const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    // Dynamically retrieve the absolute URL Vercel allocated to the deployment for the webhook route
    // Include the orderId in the URL parameters because Safaricom strips metadata from their generic response bodies
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const rawCallbackBase = process.env.VITE_GATEWAY_URL || `${protocol}://${host}`;
    const callbackUrl = `${rawCallbackBase}/api/mpesa/callback?orderId=${encodeURIComponent(orderId)}`;

    // 3. Dispatch the payload instructions to Daraja Core
    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount),
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: orderId.slice(0, 10).toUpperCase(),
      TransactionDesc: `Payment for Order ${orderId.slice(0, 5)}`
    };

    const pushRes = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const pushData = await pushRes.json();
    
    // Pass errors directly up from Safaricom API if payload rejected (e.g. invalid phone/amount)
    if (pushData.errorMessage) {
      throw new Error(`Safaricom Rejected Payload: ${pushData.errorMessage}`);
    }

    res.status(200).json({ success: true, data: pushData });
  } catch (error) {
    console.error("M-Pesa Edge Exception:", error);
    res.status(500).json({ error: error.message });
  }
}
