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
}
