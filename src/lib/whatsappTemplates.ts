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

export function formatExactInr(amount: number): string {
  const num = Number(amount || 0);
  const rounded = Math.round(num * 100) / 100;
  const isWhole = Math.abs(rounded - Math.round(rounded)) < 0.001;
  return `₹${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatInr(amount: number): string {
  return formatExactInr(amount);
}

export const FREE_DELIVERY_THRESHOLD_INR = 2000;
export const FLAT_DELIVERY_CHARGE_INR = 199;

/**
 * Mandatory BAAGFRESH delivery charge rule:
 * - Cart product subtotal >= ₹2,000 => FREE DELIVERY (₹0)
 * - Cart product subtotal < ₹2,000 (and > ₹0) => Flat ₹199
 */
export function calculateDeliveryCharge(productSubtotal: number): number {
  const safeSubtotal = Math.max(0, Number(productSubtotal || 0));
  if (safeSubtotal <= 0) return 0;
  return safeSubtotal >= FREE_DELIVERY_THRESHOLD_INR ? 0 : FLAT_DELIVERY_CHARGE_INR;
}

/**
 * Extracts the embedded GST component from a GST-inclusive selling price
 * for internal reference only. Never add this on top of selling prices or Grand Total.
 */
export function extractInclusiveGstComponent(inclusiveAmount: number, gstRatePercent: number): number {
  const amount = Math.max(0, Number(inclusiveAmount || 0));
  const rate = Math.max(0, Number(gstRatePercent || 0));
  if (amount <= 0 || rate <= 0) return 0;
  return Math.round((amount - amount / (1 + rate / 100)) * 100) / 100;
}

export interface WhatsAppEnquiryInput {
  items: WhatsAppOrderItem[];
  subtotal: number;
  discount?: number;
  promoCode?: string;
  deliveryCharge: number;
  grandTotal: number;
  customerName: string;
  customerMobile: string;
}

export function isValidCustomerName(rawName: string): boolean {
  return String(rawName || '').trim().length >= 2;
}

export function isValidCustomerMobile(rawPhone: string): boolean {
  const digits = String(rawPhone || '').replace(/[^\d]/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Generates a clean GST-inclusive WhatsApp order enquiry message with complete product list,
 * quantities, GST-inclusive unit prices, item totals, product subtotal (GST inclusive),
 * applicable delivery charge (₹199 or FREE), grand total, Customer Name, and WhatsApp Mobile Number.
 */
export function formatWhatsAppCartEnquiryMessage(enquiry: WhatsAppEnquiryInput): string {
  const itemLines = enquiry.items.map((item, idx) => {
    const unitPrice = Number(item.price || 0);
    const qty = Number(item.quantity || 1);
    const itemTotal = unitPrice * qty;
    const weightTag = item.weight ? ` (${item.weight})` : '';
    return `${idx + 1}. *${item.name}*${weightTag}\n   Qty: ${qty} × ${formatExactInr(unitPrice)} (GST Incl.) = *${formatExactInr(itemTotal)}*`;
  });

  const deliveryLabel =
    Number(enquiry.deliveryCharge || 0) === 0
      ? 'FREE (₹0)'
      : formatExactInr(enquiry.deliveryCharge);

  const lines = [
    `*BAAGFRESH — WHATSAPP ORDER ENQUIRY*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `*CUSTOMER DETAILS*`,
    `• Customer Name: ${enquiry.customerName.trim()}`,
    `• WhatsApp Mobile: ${enquiry.customerMobile.trim()}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `*ORDER LIST*`,
    ...itemLines,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `*ORDER SUMMARY*`,
    `• Product Subtotal (GST Inclusive): ${formatExactInr(enquiry.subtotal)}`,
    ...(enquiry.discount && enquiry.discount > 0
      ? [
          `• Discount${enquiry.promoCode ? ` (${enquiry.promoCode})` : ''}: -${formatExactInr(enquiry.discount)}`,
        ]
      : []),
    `• Delivery Charge: ${deliveryLabel}`,
    `• *Grand Total: ${formatExactInr(enquiry.grandTotal)}*`,
    `_All Product Prices Are Inclusive of Applicable GST._`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `Please confirm availability and next steps for this enquiry.`,
  ];

  return lines.join('\n');
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
