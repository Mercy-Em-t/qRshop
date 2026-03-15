import { buildWhatsAppMessage, buildWhatsAppLink } from "./whatsapp-builder";

const QUEUE_KEY = "qr_queued_order";

/**
 * Queue an order for later delivery when the device comes back online.
 * Stores the WhatsApp link so it can be opened automatically.
 */
export function queueOrder(shopName, shopPhone, table, items, total) {
  const entry = {
    shopName,
    shopPhone,
    table,
    items,
    total,
    queuedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(entry));
  } catch (e) {
    console.warn("Failed to queue order:", e);
  }
}

/**
 * Retrieve the currently queued order, or null if none exists.
 */
export function getQueuedOrder() {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Remove the queued order after it has been sent.
 */
export function clearQueuedOrder() {
  localStorage.removeItem(QUEUE_KEY);
}

/**
 * Attempt to send a queued order via WhatsApp.
 * Returns true if an order was found and the link was opened.
 */
export function sendQueuedOrder() {
  const order = getQueuedOrder();
  if (!order) return false;

  const { shopName, shopPhone, table, items, total } = order;
  if (!shopPhone) {
    clearQueuedOrder();
    return false;
  }

  const message = buildWhatsAppMessage(shopName, table, items, total);
  const link = buildWhatsAppLink(shopPhone, message);

  window.open(link, "_blank", "noopener,noreferrer");
  clearQueuedOrder();
  return true;
}

/**
 * Register a one-time listener that sends any queued order when the browser
 * comes back online.  Safe to call multiple times — only one listener is
 * active at a time.
 */
let listenerRegistered = false;

export function registerOnlineSync() {
  if (listenerRegistered) return;
  listenerRegistered = true;

  window.addEventListener("online", function handleOnline() {
    sendQueuedOrder();
    // Always clean up: remove listener and reset flag after first online event
    listenerRegistered = false;
    window.removeEventListener("online", handleOnline);
  });
}
