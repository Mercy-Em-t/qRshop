export function buildWhatsAppMessage(shopName, table, items, total) {
  const itemLines = items
    .map((item) => `${item.quantity} ${item.name}`)
    .join("\n");

  const message = `New Order
Shop: ${shopName}
Table: ${table}
Items:
${itemLines}
Total: KSh ${total}`;

  return message;
}

export function buildWhatsAppLink(phoneNumber, message) {
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
