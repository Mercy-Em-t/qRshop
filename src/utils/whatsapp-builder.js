export function buildWhatsAppMessage(shopName, table, items, orderId, total, discountAmount = 0, couponCode = null, isOffline = false, clientName = null, clientPhone = null) {
  const shortId = orderId ? orderId.split("-")[0].toUpperCase() : "N/A";
  
  // Create formatted datestring e.g. "17/03/2026, 13:02"
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const dateStrFormatted = `${dateStr}, ${timeStr}`;

  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const itemLines = items
    .map((item) => {
       const lineTotal = item.price * item.quantity;
       return `• ${item.name} ${item.quantity > 1 ? `x${item.quantity}` : ''} — KSh ${lineTotal}`;
    })
    .join("\n");

  let discountSection = "";
  if (discountAmount > 0) {
     discountSection = `\n🔥 Discount: -KSh ${discountAmount}`;
  }

  const status = isOffline ? "Awaiting Payment (Pay at Desk / Offline)" : "Awaiting Payment (STK / Cash)";

  return `🧾 *NEW ORDER*

🏪 *${shopName.toUpperCase()}*
🪑 Table: ${table}
🕒 ${dateStrFormatted}

${clientName ? `👤 Client: ${clientName}\n📞 ${clientPhone}\n` : ''}

🧾 Receipt: #${shortId}

*ITEMS:*
${itemLines}

Subtotal: KSh ${subtotal}${discountSection}

💰 *TOTAL: KSh ${total}*

📌 Status: ${status}

— _Savannah OS_`;
}

export function buildWhatsAppLink(phoneNumber, message) {
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
