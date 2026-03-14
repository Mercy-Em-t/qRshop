const SESSION_KEY = 'qrSession'
const SESSION_DURATION_MS = 30 * 60 * 1000

export function createQrSession(shopId, table) {
  const session = {
    shop_id: shopId,
    table,
    created_at: new Date().toISOString(),
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

export function getQrSession() {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null

  let session
  try {
    session = JSON.parse(raw)
  } catch {
    clearQrSession()
    return null
  }

  const createdAt = new Date(session.created_at).getTime()
  const now = Date.now()

  if (now - createdAt > SESSION_DURATION_MS) {
    clearQrSession()
    return null
  }

  return session
}

export function clearQrSession() {
  sessionStorage.removeItem(SESSION_KEY)
}
