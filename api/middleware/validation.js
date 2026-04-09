const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const E164_KE_REGEX = /^254\d{9}$/;

export function isUuidV4(value) {
  return typeof value === 'string' && UUID_V4_REGEX.test(value.trim());
}

export function normalizeKePhone(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  let phone = String(value).replace(/\D/g, '');
  if (phone.startsWith('0')) phone = `254${phone.slice(1)}`;
  if (phone.startsWith('+')) phone = phone.slice(1);
  return E164_KE_REGEX.test(phone) ? phone : null;
}

export function parsePositiveAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.ceil(amount);
}

export function parseIsoTimestamp(value) {
  if (!value) return null;
  const ts = new Date(value);
  if (Number.isNaN(ts.getTime())) return null;
  return ts.toISOString();
}
