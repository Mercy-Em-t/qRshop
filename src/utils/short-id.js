/**
 * Converts a standard 36-character UUID into a 22-character Base64Url string.
 */
export function uuidToShort(uuid) {
  try {
    if (!uuid) return uuid;
    const hex = uuid.replace(/-/g, '');
    let binStr = '';
    for (let i = 0; i < hex.length; i += 2) {
      binStr += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error("Failed to shorten UUID", e);
    return uuid; 
  }
}

/**
 * Converts a 22-character Base64Url string back into a standard 36-character UUID.
 */
export function shortToUuid(shortId) {
  try {
    if (!shortId) return shortId;
    if (shortId.length === 36 && shortId.includes('-')) return shortId;
    
    let base64 = shortId.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    
    const binStr = atob(base64);
    let hex = '';
    for (let i = 0; i < binStr.length; i++) {
        let h = binStr.charCodeAt(i).toString(16);
        if (h.length === 1) h = '0' + h;
        hex += h;
    }
    return `${hex.substr(0,8)}-${hex.substr(8,4)}-${hex.substr(12,4)}-${hex.substr(16,4)}-${hex.substr(20,12)}`;
  } catch (e) {
    console.error("Failed to expand short ID", e);
    return shortId;
  }
}
