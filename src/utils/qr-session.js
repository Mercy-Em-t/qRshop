const SESSION_KEY = "qr_session";
const SESSION_EXPIRY_MINUTES = 240; // Extended to 4 hours for better session tracking

const DEVICE_ID_KEY = "qr_platform_device_id";

/**
 * Mints a new unique ID (UUIDv4 roughly)
 */
function generateTrackingId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets the persistent anonymous device tracker. Creates one if none exists.
 */
export function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateTrackingId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Gets the current active session tracking ID, creating a new one if missing or expired.
 */
export function getOrCreateTrackingSession() {
  let session = getQrSession();
  if (!session) {
     return generateTrackingId();
  }
  
  if (!session.tracking_session_id) {
     session.tracking_session_id = generateTrackingId();
     sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  
  return session.tracking_session_id;
}


/**
 * Create a QR session with server-validated data.
 * Supports both legacy (client-only) and V2 (server-validated) sessions.
 */
export function createQrSession(shopId, table, serverSession = null, campaignId = null) {
  const deviceId = getOrCreateDeviceId();
  // We mint a fresh tracking session ID whenever a brand new QR scan happens
  // to ensure different visits map to different sessions.
  const trackingSessionId = generateTrackingId(); 

  const session = {
    shop_id: shopId,
    table: table,
    campaign_id: campaignId,
    created_at: new Date().toISOString(),
    expires_at: serverSession?.expires_at || new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000).toISOString(),
    session_id: serverSession?.id || null, // Legacy server session ID
    device_id: serverSession?.device_id || deviceId,
    tracking_session_id: trackingSessionId // Global analytics session identifier
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/**
 * Creates a "Public" session for web visitors (e.g. from a subdomain or public link).
 * Bypasses the requirement for a physical QR scan while maintaining shop context.
 */
export function createPublicSession(shopId) {
  const deviceId = getOrCreateDeviceId();
  const trackingSessionId = generateTrackingId();

  const session = {
    shop_id: shopId,
    table: "Web",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000).toISOString(),
    device_id: deviceId,
    tracking_session_id: trackingSessionId
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
