/**
 * Credential Email Service
 * ─────────────────────────────────────────────────────
 * Scaffold for sending welcome emails to newly provisioned shop operators.
 * 
 * FEATURE FLAG: Set VITE_ENABLE_CREDENTIAL_EMAIL=true in .env to activate.
 * Leave as false (default) until SMTP / Edge Function credentials are ready.
 */

const ENABLED = import.meta.env.VITE_ENABLE_CREDENTIAL_EMAIL === 'true';

/**
 * Sends a welcome email with login credentials to a new shop operator.
 * @param {{ email: string, tempPassword: string, shopName: string }} params
 */
export async function sendCredentialEmail({ email, tempPassword, shopName }) {
  if (!ENABLED) {
    console.warn(
      '[credential-email] Feature flag VITE_ENABLE_CREDENTIAL_EMAIL is OFF. ' +
      'Email was NOT sent to:', email,
      '— Set VITE_ENABLE_CREDENTIAL_EMAIL=true in .env when ready to activate.'
    );
    return { sent: false, reason: 'disabled' };
  }

  try {
    // Wire this to your Supabase Edge Function or email provider when ready.
    // Example: supabase.functions.invoke('send-credential-email', { body: { email, tempPassword, shopName } })
    const { supabase } = await import('../lib/supabase');
    const { error } = await supabase.functions.invoke('send-credential-email', {
      body: { email, tempPassword, shopName }
    });

    if (error) throw error;
    console.log('[credential-email] Sent successfully to:', email);
    return { sent: true };
  } catch (err) {
    console.error('[credential-email] Failed to send:', err);
    return { sent: false, error: err.message };
  }
}
