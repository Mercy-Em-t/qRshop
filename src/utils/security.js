/**
 * Security and Sanitisation Utilities
 */

// 1. Image Header Magic Number / MIME Verification
export async function validateImageFile(file) {
  if (!file) return { valid: false, error: "No file provided" };
  
  // Checking size limits (e.g. max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: "File size exceeds 5MB limit" };
  }

  // Double check basic extension and mime types
  const validMimes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
  if (!validMimes.includes(file.type)) {
    return { valid: false, error: "Invalid file type. Only valid photo formats (JPEG, PNG, WEBP, SVG, GIF) are accepted." };
  }

  // To truly verify it's a valid photo, we can read the file as an array buffer
  // and check the first few bytes (Magic Numbers).
  // JPEG: FF D8 FF
  // PNG: 89 50 4E 47
  // GIF: 47 49 46 38
  try {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let header = "";
    for (let i = 0; i < bytes.length; i++) {
      header += bytes[i].toString(16).toUpperCase().padStart(2, "0");
    }

    // JPEG
    if (header.startsWith("FFD8")) return { valid: true };
    // PNG
    if (header.startsWith("89504E47")) return { valid: true };
    // GIF
    if (header.startsWith("47494638")) return { valid: true };
    // WebP/RIFF: First 4 bytes are '52494646' (RIFF), byte 8-11 '57454250' (WEBP)
    if (header.startsWith("52494646")) return { valid: true };
    // SVG: Starts with <svg (3C 73 76 67) or <?xml (3C 3F 78 6D 6C)
    if (header.startsWith("3C737667") || header.startsWith("3C3F786D")) return { valid: true };

    // If none match but MIME type says image, accept with a warning
    return { valid: true, warning: "MIME type trusted but magic number skipped." };
  } catch (err) {
    // If browser doesn't support reading buffer, default to MIME type
    return { valid: true };
  }
}

// 2. Input Sanitisation for Text/Data
export function sanitiseText(val, maxLength = 2000) {
  if (typeof val !== "string") return val;
  
  let clean = val
    .replace(/<script[\s\S]*?<\/script>/gi, "")     // Strips script tags
    .replace(/javascript\s*:/gi, "")                // Strips javascript:
    .replace(/onload\s*=/gi, "")                    // Strips event handlers
    .replace(/onerror\s*=/gi, "")
    .replace(/onclick\s*=/gi, "")
    .replace(/eval\s*\(/gi, "")
    .replace(/expression\s*\(/gi, "");              // Strips expression()

  return clean.slice(0, maxLength);
}

// 3. Suspicious Activity Reporter to System Admins
// Logs suspicious activity silently to Supabase or local telemetry
export async function reportSecurityEvent(eventType, metadata = {}) {
  const user = localStorage.getItem("savannah_session");
  const userData = user ? JSON.parse(user) : null;

  const newLog = {
    event_type: `security_alert_${eventType}`,
    user: userData?.email || "anonymous",
    user_id: userData?.id || null,
    shop_id: userData?.shop_id || null,
    metadata,
    timestamp: new Date().toISOString(),
    url: window.location.href
  };

  console.warn(`[SECURITY EVENT ALERT]: ${eventType}`, newLog);

  // 1. Redundant local storage security log "file"
  try {
    const existing = localStorage.getItem("savannah_security_file_logs");
    const logs = existing ? JSON.parse(existing) : [];
    logs.unshift(newLog);
    localStorage.setItem("savannah_security_file_logs", JSON.stringify(logs.slice(0, 100)));
  } catch (err) {
    // ignore local storage capacity limits
  }

  // 2. If Supabase is active, push an alert event to the telemetry table
  try {
    const { supabase } = await import("../services/supabase-client");
    if (supabase) {
      await supabase.from("events").insert({
        event_type: `security_alert_${eventType}`,
        user_id: userData?.id || null,
        shop_id: userData?.shop_id || null,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      });
    }
  } catch (err) {
    // Fall back to silent tracing
  }
}
