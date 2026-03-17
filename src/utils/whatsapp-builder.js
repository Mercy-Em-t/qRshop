export function buildWhatsAppMessage(shopName, table, items, orderId, total, discountAmount = 0, couponCode = null, isOffline = false) {
  const shortId = orderId ? orderId.split("-")[0].toUpperCase() : "N/A";
  const date = new Date().toLocaleString();
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const itemLines = items
    .map((item) => {
       const lineTotal = item.price * item.quantity;
       return `${item.quantity}x ${item.name.padEnd(15, " ")} KSh ${lineTotal}`;
    })
    .join("\n");

  let discountSection = "";
  if (discountAmount > 0) {
     discountSection = `\n🔥 DISCOUNT (${couponCode}): -KSh ${discountAmount}`;
  }

  const status = isOffline ? "📥 OFFLINE QUEUE / PAY AT DESK" : "💳 AWAITING PAYMENT (STK / CASH)";

  return `🧾 *NEW ORDER TICKET* 🧾
=========================
🏪 ${shopName.toUpperCase()}
🪑 Table: ${table}
🕒 ${date}
🎫 Receipt: #${shortId}
=========================
*ITEMS:*
${itemLines}
-------------------------
Subtotal: KSh ${subtotal}${discountSection}
-------------------------
*FINAL TOTAL: KSh ${total}*
=========================
*STATUS:* ${status}
=========================
_Powered by Savannah OS_`;
}

export function buildWhatsAppLink(phoneNumber, message) {
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
