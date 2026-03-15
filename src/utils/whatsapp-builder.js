export function buildWhatsAppUrl(phone, order) {
  const message = formatOrderMessage(order)
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${phone}?text=${encoded}`
}

function formatOrderMessage(order) {
  const itemLines = order.items
    .map((item) => `${item.quantity} ${item.name}`)
    .join('\n')

  return [
    'New Order',
    '',
    `Shop: ${order.shopName}`,
    `Table: ${order.table}`,
    '',
    'Items:',
    itemLines,
    '',
    `Total: KSh ${order.total}`,
  ].join('\n')
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
