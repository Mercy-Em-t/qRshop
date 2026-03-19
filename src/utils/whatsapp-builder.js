export function buildWhatsAppMessage(shopName, table, items, orderId, total, discountAmount = 0, couponCode = null, isOffline = false, clientName = null, clientPhone = null, fulfillmentType = 'dine_in', deliveryAddress = null, deliveryFeeCharged = 0) {
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
  
  let deliverySection = "";
  if (deliveryFeeCharged > 0) {
     deliverySection = `\n🚗 Delivery Fee: +KSh ${deliveryFeeCharged}`;
  }

  const status = isOffline ? "Awaiting Payment (Pay Offline)" : "Awaiting Payment (STK / Cash)";
  
  let fulfillmentBlock = "";
  if (fulfillmentType === 'delivery') {
      fulfillmentBlock = `🚗 *DELIVERY*\n📍 Address: ${deliveryAddress || "N/A"}\n📞 ${clientPhone}`;
  } else if (fulfillmentType === 'pickup') {
      fulfillmentBlock = `🛍️ *PICKUP*\n📞 ${clientPhone}`;
  } else if (fulfillmentType === 'digital') {
      fulfillmentBlock = `💻 *DIGITAL DELIVERY*\n📧 Email (Delivery To): ${deliveryAddress || "N/A"}\n📞 ${clientPhone}`;
  } else {
      fulfillmentBlock = `🍽️ *DINE IN*\n🪑 Table: ${table}`;
  }

  return `🧾 *NEW ORDER*

🏪 *${shopName.toUpperCase()}*
🕒 ${dateStrFormatted}

${fulfillmentBlock}
${clientName ? `👤 Client: ${clientName}\n` : ''}
🧾 Receipt: #${shortId}

*ITEMS:*
${itemLines}

Subtotal: KSh ${subtotal}${discountSection}${deliverySection}

💰 *TOTAL: KSh ${total}*

📌 Status: ${status}

— _Savannah OS_`;
}

export function buildWhatsAppLink(phoneNumber, message) {
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
