const SESSION_KEY = "qr_session";
const SESSION_EXPIRY_MINUTES = 30;

export function createQrSession(shopId, table) {
  const session = {
    shop_id: shopId,
    table: table,
    created_at: new Date().toISOString(),
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
  if (!session || !session.created_at) return true;

  const createdAt = new Date(session.created_at);
  const now = new Date();
  const diffMs = now - createdAt;
  const diffMinutes = diffMs / (1000 * 60);

  return diffMinutes > SESSION_EXPIRY_MINUTES;
}
