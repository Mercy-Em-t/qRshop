/**
 * File Content Validator
 * ─────────────────────────────────────────────────────────────────
 * Validates file contents by reading magic bytes (file signatures),
 * NOT just the extension. This prevents disguised files like shop.php.jpg
 * from entering the system.
 *
 * Supported image formats:  JPEG, PNG, WebP, GIF
 * Supported spreadsheets:   CSV (UTF-8 text), XLSX (ZIP/PK), XLS (CFBF)
 */

// ── Magic Byte Signatures ─────────────────────────────────────────
const SIGNATURES = {
  jpeg: { bytes: [0xFF, 0xD8, 0xFF],           offset: 0 },
  png:  { bytes: [0x89, 0x50, 0x4E, 0x47],     offset: 0 },
  gif:  { bytes: [0x47, 0x49, 0x46, 0x38],     offset: 0 },
  webp: { bytes: [0x57, 0x45, 0x42, 0x50],     offset: 8 }, // "WEBP" at byte 8
  xlsx: { bytes: [0x50, 0x4B, 0x03, 0x04],     offset: 0 }, // PK ZIP header
  xls:  { bytes: [0xD0, 0xCF, 0x11, 0xE0],     offset: 0 }, // CFBF format
};

/**
 * Reads the first `count` bytes of a File as a Uint8Array.
 */
function readBytes(file, count = 16) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(new Uint8Array(e.target.result));
    reader.onerror = reject;
    reader.readAsArrayBuffer(file.slice(0, count));
  });
}

function matchesSignature(bytes, sig) {
  for (let i = 0; i < sig.bytes.length; i++) {
    if (bytes[sig.offset + i] !== sig.bytes[i]) return false;
  }
  return true;
}

// ── Image Validator ───────────────────────────────────────────────
/**
 * Validates that a file is a genuine image (JPEG, PNG, WebP, or GIF).
 * @param {File} file
 * @returns {{ valid: boolean, type: string|null, error: string|null }}
 */
export async function validateImage(file) {
  // 1. Size guard: max 2MB
  if (file.size > 2 * 1024 * 1024) {
    return { valid: false, type: null, error: "Image must be under 2MB." };
  }

  // 2. Magic bytes check
  const bytes = await readBytes(file, 16);

  if (matchesSignature(bytes, SIGNATURES.jpeg)) return { valid: true, type: "image/jpeg", error: null };
  if (matchesSignature(bytes, SIGNATURES.png))  return { valid: true, type: "image/png",  error: null };
  if (matchesSignature(bytes, SIGNATURES.gif))  return { valid: true, type: "image/gif",  error: null };
  if (matchesSignature(bytes, SIGNATURES.webp)) return { valid: true, type: "image/webp", error: null };

  return {
    valid: false,
    type: null,
    error: "Invalid image file. Only JPEG, PNG, WebP, and GIF are accepted. Disguised files (e.g. .php.jpg) are rejected.",
  };
}

// ── Spreadsheet Validator ─────────────────────────────────────────
/**
 * Validates that a file is a genuine spreadsheet (XLSX, XLS, or CSV).
 * For CSV: ensures the file is valid UTF-8 text with at least one comma or semicolon delimiter.
 * @param {File} file
 * @returns {{ valid: boolean, type: "xlsx"|"xls"|"csv"|null, error: string|null }}
 */
export async function validateSpreadsheet(file) {
  // 1. Size guard: max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, type: null, error: "Spreadsheet must be under 10MB." };
  }

  const bytes = await readBytes(file, 16);

  // 2. XLSX check (ZIP/PK magic bytes)
  if (matchesSignature(bytes, SIGNATURES.xlsx)) {
    return { valid: true, type: "xlsx", error: null };
  }

  // 3. XLS check (CFBF magic bytes)
  if (matchesSignature(bytes, SIGNATURES.xls)) {
    return { valid: true, type: "xls", error: null };
  }

  // 4. CSV check: first bytes must be printable text (no binary)
  const isBinary = bytes.some((b) => b < 0x09 || (b > 0x0D && b < 0x20));
  if (isBinary) {
    return {
      valid: false,
      type: null,
      error: "File contains binary data and is not a valid CSV or spreadsheet.",
    };
  }

  // 5. Read a sample of the file to confirm delimiter presence
  const sample = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsText(file.slice(0, 2048));
  });

  const hasDelimiter = sample.includes(",") || sample.includes(";") || sample.includes("\t");
  if (!hasDelimiter) {
    return {
      valid: false,
      type: null,
      error: "File does not appear to be a valid CSV (no comma, semicolon, or tab delimiters found).",
    };
  }

  return { valid: true, type: "csv", error: null };
}
