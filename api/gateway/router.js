import { createClient } from '@supabase/supabase-js';
import { requireEnv, getEnv } from '../middleware/env.js';

function getSupabaseClient() {
  const supabaseUrl = getEnv('SUPABASE_URL', ['VITE_SUPABASE_URL']);
  const supabaseServiceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey);
}

export default async function handler(req, res) {
  const { method, query, body, headers } = req;
  const startTime = Date.now();

  // 1. Health Check Endpoint
  if (req.url.includes('/health')) {
      try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Gateway logging database is not configured');
        // Check System A (Self)
        const { error } = await supabase.from('shops').select('id').limit(1);
      const systemAStatus = error ? 'DOWN' : 'UP';

      // Check System B
      const systemBUrl = getEnv('SYSTEM_B_URL', ['VITE_SYSTEM_B_URL']);
      let systemBStatus = 'UNKNOWN';
      try {
        if (!systemBUrl) throw new Error('System B URL missing');
        const bRes = await fetch(`${systemBUrl}/health`, { method: 'GET' });
        systemBStatus = bRes.status === 200 ? 'UP' : 'DEGRADED';
      } catch {
        systemBStatus = 'DOWN';
      }

      return res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        nodes: {
          system_a: systemAStatus,
          system_b: systemBStatus,
          gateway: 'UP'
        }
      });
    } catch (err) {
      return res.status(500).json({ status: 'ERROR', message: err.message });
    }
  }

  // 2. Main Gateway Router
  if (req.url.includes('/route')) {
      const target = query.to || 'SYSTEM_B';
      const endpoint = query.endpoint || '/orders/new';
    
    let targetUrl = '';
    let apiKey = '';

    if (target === 'SYSTEM_B') {
      const systemBUrl = requireEnv('SYSTEM_B_URL', ['VITE_SYSTEM_B_URL']);
      apiKey = requireEnv('SYSTEM_B_API_KEY', ['VITE_SYSTEM_B_API_KEY']);
      targetUrl = `${systemBUrl}${endpoint}`;
    } else {
      return res.status(400).json({ error: 'INVALID_TARGET', message: `Target system ${target} not supported.` });
    }

    try {
      // Log outgoing request (SENT)
      await logGatewayActivity({
        direction: 'SENT',
        method,
        endpoint: targetUrl,
        payload: body,
        system: target
      });

      // Forward Request
      const response = await fetch(targetUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          ...headers, // Forward relevant headers
          host: new URL(targetUrl).host // Fix host header
        },
        body: method !== 'GET' ? JSON.stringify(body) : undefined
      });

      const responseData = await response.json();
      const endTime = Date.now();
      const latency = endTime - startTime;

      // Log incoming response (RECEIVED)
      await logGatewayActivity({
        direction: 'RECEIVED',
        method,
        endpoint: targetUrl,
        payload: body,
        response: responseData,
        status_code: response.status,
        latency_ms: latency,
        system: target
      });

      return res.status(response.status).json(responseData);
    } catch (err) {
      const endTime = Date.now();
      await logGatewayActivity({
        direction: 'RECEIVED',
        method,
        endpoint: targetUrl || 'UNKNOWN',
        payload: body,
        response: { error: 'GATEWAY_ERROR', message: err.message },
        status_code: 502,
        latency_ms: endTime - startTime,
        system: target
      });
      return res.status(502).json({ error: 'BAD_GATEWAY', message: err.message });
    }
  }

  return res.status(404).json({ error: 'NOT_FOUND', message: 'API Gateway endpoint not found.' });
}

async function logGatewayActivity(log) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('gateway_logs').insert([log]);
    if (error) console.error('Failed to log gateway activity:', error);
  } catch (e) {
    console.error('Logging Exception:', e);
  }
}
