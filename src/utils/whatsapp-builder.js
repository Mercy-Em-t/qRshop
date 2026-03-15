export function buildWhatsAppMessage(shopName, table, items) {
  const itemLines = items
    .map((item) => `${item.quantity}x ${item.name}`)
    .join("\n");

  return `New Order Ticket
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
