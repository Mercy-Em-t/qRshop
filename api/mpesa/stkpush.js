/* global Buffer */
import { normalizeKePhone, parsePositiveAmount, isUuidV4 } from '../middleware/validation.js';
import { requireEnv, getEnv } from '../middleware/env.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method Not Allowed'});

  const { phone, amount, orderId } = req.body || {};

  if (!phone || !amount || !orderId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const formattedPhone = normalizeKePhone(phone);
  const safeAmount = parsePositiveAmount(amount);
  if (!formattedPhone || !safeAmount || !isUuidV4(orderId)) {
    return res.status(400).json({ error: 'Invalid phone, amount, or orderId format.' });
  }

  try {
    const consumerKey = requireEnv('DARAJA_CONSUMER_KEY');
    const consumerSecret = requireEnv('DARAJA_CONSUMER_SECRET');
    const passkey = requireEnv('DARAJA_PASSKEY');
    const shortcode = requireEnv('DARAJA_SHORTCODE');
    const gatewayBase = getEnv('GATEWAY_URL', ['VITE_GATEWAY_URL']);
    const envString = getEnv('DARAJA_ENVIRONMENT') || 'sandbox';
    const baseUrl = envString === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

    // 1. Generate Access Token via Consumer Signatures
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
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
    const host = req.headers['x-forwarded-host'] || req.headers.host || '';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const rawCallbackBase = gatewayBase || (host ? `${protocol}://${host}` : null);
    if (!rawCallbackBase) {
      throw new Error('Missing gateway callback base URL. Set GATEWAY_URL.');
    }
    const callbackUrl = `${rawCallbackBase}/api/mpesa/callback?orderId=${encodeURIComponent(orderId)}`;

    // 3. Dispatch the payload instructions to Daraja Core
    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: safeAmount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: orderId.slice(0, 10).toUpperCase(),
      TransactionDesc: `Payment for Order ${orderId.slice(0, 5)}`
    };

    const pushRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
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
