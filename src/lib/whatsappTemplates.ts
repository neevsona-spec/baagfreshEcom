export interface WhatsAppOrderItem {
  name: string;
  weight?: string;
  quantity: number;
  price: number;
}

export interface WhatsAppOrderInput {
  orderId: string;
  orderNumber?: string;
  date?: string;
  status?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    fullName?: string;
    phone?: string;
    email?: string;
    street?: string;
    apartment?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items: WhatsAppOrderItem[];
  subtotal: number;
  discount?: number;
  shippingFee: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
}

export function normalizeWhatsAppPhone(rawPhone: string | undefined | null, defaultCountryCode = '91'): string {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/[^\d]/g, '');
  if (!digits) return '';
  // Strip leading 0 if 11-digit local Indian number (e.g. 08707671319)
  if (digits.length === 11 && digits.startsWith('0')) {
    return `${defaultCountryCode}${digits.slice(1)}`;
  }
  // Prepend default country code for standard 10-digit mobile numbers
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }
  return digits;
}

export function buildWhatsAppClickToChatUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) {
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function formatAddressLine(addr: WhatsAppOrderInput['shippingAddress']): string {
  return [
    addr?.apartment,
    addr?.street,
    [addr?.city, addr?.state].filter(Boolean).join(', '),
    addr?.pincode ? `PIN: ${addr.pincode}` : '',
  ]
    .filter(Boolean)
    .join(', ');
}

function formatInr(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

/**
 * Generates a structured List Template for a single order (sent to store owner's official WhatsApp)
 */
export function formatSingleOrderListTemplate(order: WhatsAppOrderInput): string {
  const orderRef = order.orderNumber || order.orderId;
  const orderDate =
    order.date ||
    new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const itemLines = order.items.map((item, idx) => {
    const lineTotal = Number(item.price || 0) * Number(item.quantity || 1);
    const weightTag = item.weight ? ` (${item.weight})` : '';
    return `${idx + 1}. *${item.name}*${weightTag} × ${item.quantity} — ${formatInr(lineTotal)}`;
  });

  const addressText = formatAddressLine(order.shippingAddress) || 'Address pending';
  const payLabel = `${String(order.paymentMethod || 'COD').toUpperCase()}${
    order.paymentStatus ? ` (${order.paymentStatus.replace(/_/g, ' ').toUpperCase()})` : ''
  }`;

  const lines = [
    `*BAAGFRESH — NEW ORDER LIST*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `*Order ID:* #${orderRef}`,
    `*Date:* ${orderDate}`,
    `*Status:* ${(order.status || 'Confirmed').replace(/_/g, ' ').toUpperCase()}`,
    `*Payment:* ${payLabel}`,
    ``,
    `*CUSTOMER DETAILS*`,
    `• Name: ${order.customerName || order.shippingAddress?.fullName || 'Valued Patron'}`,
    `• Phone: ${order.customerPhone || order.shippingAddress?.phone || 'N/A'}`,
    ...(order.customerEmail || order.shippingAddress?.email
      ? [`• Email: ${order.customerEmail || order.shippingAddress?.email}`]
      : []),
    `• Delivery: ${addressText}`,
    ``,
    `*ITEMS ORDERED LIST*`,
    ...itemLines,
    ``,
    `*BILLING SUMMARY*`,
    `• Subtotal: ${formatInr(order.subtotal)}`,
    ...(order.discount && order.discount > 0 ? [`• Discount: -${formatInr(order.discount)}`] : []),
    `• Shipping: ${Number(order.shippingFee) === 0 ? 'FREE' : formatInr(order.shippingFee)}`,
    ...(order.tax && order.tax > 0 ? [`• Tax: ${formatInr(order.tax)}`] : []),
    `• *Grand Total: ${formatInr(order.total)}*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `Please confirm this order from BAAGFRESH Official WhatsApp.`,
  ];

  return lines.join('\n');
}

/**
 * Generates an official BAAGFRESH Order Confirmation List Template sent FROM store WhatsApp TO customer
 */
export function formatCustomerConfirmationWhatsAppTemplate(order: WhatsAppOrderInput): string {
  const orderRef = order.orderNumber || order.orderId;
  const itemLines = order.items.map((item, idx) => {
    const lineTotal = Number(item.price || 0) * Number(item.quantity || 1);
    const weightTag = item.weight ? ` (${item.weight})` : '';
    return `${idx + 1}. *${item.name}*${weightTag} × ${item.quantity} — ${formatInr(lineTotal)}`;
  });

  const addressText = formatAddressLine(order.shippingAddress) || 'Your saved address';
  const statusLabel = (order.status || 'Confirmed').replace(/_/g, ' ').toUpperCase();

  return [
    `Pranam *${order.customerName || 'Valued Patron'}*! 🙏`,
    `Thank you for ordering from *BAAGFRESH* (Varanasi Processing Hub).`,
    ``,
    `✅ *Your Order #${orderRef} is ${statusLabel}*`,
    ``,
    `*ORDERED ITEMS LIST*`,
    ...itemLines,
    ``,
    `*Total Amount:* ${formatInr(order.total)} (${String(order.paymentMethod || 'COD').toUpperCase()})`,
    `*Delivery Address:* ${addressText}`,
    `*Estimated Dispatch:* 2–4 Business Days (Nitrogen-Sealed Freshness)`,
    ``,
    `Reply to this official WhatsApp message anytime for live delivery updates or assistance.`,
  ].join('\n');
}

/**
 * Generates a consolidated List Template of multiple orders for Admin WhatsApp ledger
 */
export function formatMultiOrderListTemplate(
  orders: WhatsAppOrderInput[],
  title = 'BAAGFRESH — ORDERS LIST LEDGER'
): string {
  if (!orders || orders.length === 0) {
    return `*${title}*\nNo orders currently in this list.`;
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const header = [
    `*${title}*`,
    `Generated: ${new Date().toLocaleString('en-IN')}`,
    `Total Orders: *${orders.length}* | Combined Value: *${formatInr(totalRevenue)}*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  const blocks = orders.map((order, idx) => {
    const orderRef = order.orderNumber || order.orderId;
    const itemSummary = order.items
      .map((i) => `${i.quantity}× ${i.name}${i.weight ? ` (${i.weight})` : ''}`)
      .join(', ');
    const addr = [order.shippingAddress?.city, order.shippingAddress?.pincode].filter(Boolean).join(' - ');

    return [
      `*${idx + 1}. Order #${orderRef}* [${(order.status || 'confirmed').replace(/_/g, ' ').toUpperCase()}]`,
      `   • Customer: ${order.customerName} (${order.customerPhone})`,
      `   • Items: ${itemSummary}`,
      `   • Total: *${formatInr(order.total)}* (${String(order.paymentMethod || 'COD').toUpperCase()})`,
      ...(addr ? [`   • Location: ${addr}`] : []),
    ].join('\n');
  });

  return [...header, ...blocks, `━━━━━━━━━━━━━━━━━━━━━━`].join('\n\n');
}
