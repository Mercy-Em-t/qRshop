const SESSION_KEY = "qr_session";
const SESSION_EXPIRY_MINUTES = 30;

/**
 * Create a QR session with server-validated data.
 * Supports both legacy (client-only) and V2 (server-validated) sessions.
 */
export function createQrSession(shopId, table, serverSession = null) {
  const session = {
    shop_id: shopId,
    table: table,
    created_at: new Date().toISOString(),
    expires_at: serverSession?.expires_at || new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000).toISOString(),
    session_id: serverSession?.id || null,
    device_id: serverSession?.device_id || null,
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getQrSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    if (isSessionExpired(session)) {
      clearQrSession();
      return null;
    }
    return session;
  } catch {
    clearQrSession();
    return null;
  }
}

export function clearQrSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

function isSessionExpired(session) {
  if (!session) return true;

  // Use expires_at if available (V2 server-validated session)
  if (session.expires_at) {
    return new Date(session.expires_at) <= new Date();
  }

  // Fallback to created_at check (legacy)
  if (!session.created_at) return true;
  const createdAt = new Date(session.created_at);
  const now = new Date();
  const diffMs = now - createdAt;
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes > SESSION_EXPIRY_MINUTES;
}
