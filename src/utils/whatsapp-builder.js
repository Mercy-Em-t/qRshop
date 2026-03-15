export function buildWhatsAppMessage(shopName, table, items, orderId) {
  const itemLines = items
    .map((item) => `${item.quantity}x ${item.name}`)
    .join("\n");

  const shortId = orderId ? orderId.split("-")[0].toUpperCase() : "N/A";

  return `*New Order Ticket*
Receipt: #${shortId}
Shop: ${shopName}
Table: ${table}
------------
Items:
${itemLines}
------------
(Customer is awaiting STK Push for payment)`;
}

export function buildWhatsAppLink(phoneNumber, message) {
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
