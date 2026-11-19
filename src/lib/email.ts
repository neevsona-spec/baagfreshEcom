import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';

export interface OrderEmailItem {
  name: string;
  weight?: string;
  quantity: number;
  price: number;
}

export interface OrderConfirmationEmailInput {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    street: string;
    apartment?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: OrderEmailItem[];
  subtotal: number;
  discount?: number;
  shippingFee: number;
  tax?: number;
  total: number;
  paymentMethod: string;
  paymentStatus?: string;
  orderDate?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  fromName?: string;
}

export interface EmailDispatchResult {
  sent: boolean;
  skipped?: boolean;
  recipient?: string;
  messageId?: string;
  accepted?: string[];
  reason?: string;
  error?: string;
}

export interface GmailSmtpConfigStatus {
  configured: boolean;
  authMode: 'app_password' | 'oauth2' | 'unconfigured';
  host: string;
  port: number;
  secure: boolean;
  senderEmail: string | null;
}

interface ResolvedSmtpEnv {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  appPassword: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken: string;
  fromName: string;
  replyTo: string;
}

let cachedTransporter: Transporter | null = null;
let cachedSignature = '';

function readSmtpEnv(): ResolvedSmtpEnv {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT || 465) || 465;
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? process.env.SMTP_SECURE.toLowerCase() === 'true'
      : port === 465;

  const user = (
    process.env.GMAIL_USER ||
    process.env.SMTP_USER ||
    process.env.GMAIL_SMTP_USER ||
    ''
  ).trim();

  const appPassword = (
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SMTP_PASS ||
    process.env.GMAIL_SMTP_PASS ||
    ''
  ).trim();

  const clientId = (process.env.GMAIL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GMAIL_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.GMAIL_REFRESH_TOKEN || '').trim();
  const accessToken = (process.env.GMAIL_ACCESS_TOKEN || '').trim();

  const fromName = (process.env.GMAIL_FROM_NAME || 'BAAGFRESH Royal Concierge').trim();
  const replyTo = (process.env.GMAIL_REPLY_TO || user || 'baagfresh@gmail.com').trim();

  return {
    host,
    port,
    secure,
    user,
    appPassword,
    clientId,
    clientSecret,
    refreshToken,
    accessToken,
    fromName,
    replyTo,
  };
}

export function getGmailSmtpConfigStatus(): GmailSmtpConfigStatus {
  const env = readSmtpEnv();
  const hasAppPassword = Boolean(env.user && env.appPassword);
  const hasOAuth2 = Boolean(env.user && env.clientId && env.clientSecret && env.refreshToken);

  const authMode: GmailSmtpConfigStatus['authMode'] = hasOAuth2
    ? 'oauth2'
    : hasAppPassword
    ? 'app_password'
    : 'unconfigured';

  return {
    configured: authMode !== 'unconfigured',
    authMode,
    host: env.host,
    port: env.port,
    secure: env.secure,
    senderEmail: env.user || null,
  };
}

export function isGmailSmtpConfigured(): boolean {
  return getGmailSmtpConfigStatus().configured;
}

export function createGmailTransporter(): Transporter {
  const env = readSmtpEnv();
  const signature = JSON.stringify([
    env.host,
    env.port,
    env.secure,
    env.user,
    Boolean(env.appPassword),
    Boolean(env.clientId && env.clientSecret && env.refreshToken),
  ]);

  if (cachedTransporter && cachedSignature === signature) {
    return cachedTransporter;
  }

  const hasOAuth2 = Boolean(env.user && env.clientId && env.clientSecret && env.refreshToken);

  if (hasOAuth2) {
    cachedTransporter = nodemailer.createTransport({
      host: env.host,
      port: env.port,
      secure: env.secure,
      auth: {
        type: 'OAuth2',
        user: env.user,
        clientId: env.clientId,
        clientSecret: env.clientSecret,
        refreshToken: env.refreshToken,
        ...(env.accessToken ? { accessToken: env.accessToken } : {}),
      },
    });
  } else {
    cachedTransporter = nodemailer.createTransport({
      host: env.host,
      port: env.port,
      secure: env.secure,
      auth: {
        user: env.user,
        pass: env.appPassword,
      },
    });
  }

  cachedSignature = signature;
  return cachedTransporter;
}

export async function verifyGmailSmtpConnection(): Promise<{
  ok: boolean;
  configured: boolean;
  authMode: GmailSmtpConfigStatus['authMode'];
  senderEmail: string | null;
  host: string;
  port: number;
  error?: string;
}> {
  const status = getGmailSmtpConfigStatus();
  if (!status.configured) {
    return {
      ok: false,
      ...status,
      error:
        'Gmail SMTP relay is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD (or OAuth2 SMTP credentials) in environment variables.',
    };
  }

  try {
    const transporter = createGmailTransporter();
    await transporter.verify();
    return {
      ok: true,
      ...status,
    };
  } catch (err: any) {
    return {
      ok: false,
      ...status,
      error: err?.message || 'Failed to verify Gmail SMTP relay connection.',
    };
  }
}

function escapeHtml(value: string | number | undefined | null): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isValidEmailAddress(email: string | undefined | null): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function generateOrderConfirmationEmailHtml(order: OrderConfirmationEmailInput): string {
  const formattedDate =
    order.orderDate ||
    new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #ece7db; color: #1f2937; font-size: 14px;">
          <strong>${escapeHtml(item.name)}</strong>
          ${item.weight ? `<span style="color: #6b7280; font-size: 12px;"> (${escapeHtml(item.weight)})</span>` : ''}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #ece7db; text-align: center; color: #4b5563; font-size: 14px;">
          ${Number(item.quantity)}
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #ece7db; text-align: right; color: #012d1d; font-weight: 700; font-size: 14px;">
          &#8377;${(Number(item.price) * Number(item.quantity)).toLocaleString('en-IN')}
        </td>
      </tr>`
    )
    .join('');

  const fullAddress = [
    order.shippingAddress.apartment,
    order.shippingAddress.street,
    `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
  ]
    .filter(Boolean)
    .map(escapeHtml)
    .join(', ');

  const discountRow =
    order.discount && order.discount > 0
      ? `<tr>
          <td colspan="2" style="padding: 6px 10px; text-align: right; color: #059669; font-size: 13px;">Discount:</td>
          <td style="padding: 6px 10px; text-align: right; color: #059669; font-weight: 600; font-size: 13px;">-&#8377;${Number(order.discount).toLocaleString('en-IN')}</td>
        </tr>`
      : '';

  const taxRow =
    order.tax && order.tax > 0
      ? `<tr>
          <td colspan="2" style="padding: 6px 10px; text-align: right; color: #4b5563; font-size: 13px;">Taxes (GST):</td>
          <td style="padding: 6px 10px; text-align: right; color: #1f2937; font-size: 13px;">&#8377;${Number(order.tax).toLocaleString('en-IN')}</td>
        </tr>`
      : '';

  const shippingLabel =
    Number(order.shippingFee) === 0
      ? 'FREE'
      : `&#8377;${Number(order.shippingFee).toLocaleString('en-IN')}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>BAAGFRESH Order Confirmation #${escapeHtml(order.orderId)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f7f4ec; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 620px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e6decb; box-shadow: 0 6px 20px rgba(1,45,29,0.08);">
    <tr>
      <td style="background-color: #012d1d; padding: 30px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fed65b; font-family: Georgia, serif; font-size: 26px; letter-spacing: 1.5px; font-weight: 700;">
          BAAGFRESH
        </h1>
        <p style="margin: 6px 0 0 0; color: #ffffff; opacity: 0.88; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
          Varanasi Processing Hub &bull; Royal Connoisseur Selection
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 28px 24px 14px 24px;">
        <div style="display: inline-block; padding: 5px 14px; background-color: #ecfdf5; color: #065f46; border-radius: 999px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
          &#10003; Order Confirmed &bull; #${escapeHtml(order.orderId)}
        </div>
        <h2 style="margin: 16px 0 8px 0; color: #111827; font-size: 20px;">
          Pranam, ${escapeHtml(order.customerName)}!
        </h2>
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
          Thank you for your order with BAAGFRESH. Your order has been confirmed and recorded at our Varanasi processing hub. Our artisans are vacuum-sealing your harvest batch for peak freshness.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 12px 24px 20px 24px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <thead>
            <tr style="background-color: #faf5eb;">
              <th style="padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #5c4b23;">Harvest Item</th>
              <th style="padding: 10px; text-align: center; font-size: 11px; text-transform: uppercase; color: #5c4b23;">Qty</th>
              <th style="padding: 10px; text-align: right; font-size: 11px; text-transform: uppercase; color: #5c4b23;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px 10px 4px 10px; text-align: right; color: #4b5563; font-size: 13px;">Subtotal:</td>
              <td style="padding: 10px 10px 4px 10px; text-align: right; color: #1f2937; font-size: 13px;">&#8377;${Number(order.subtotal).toLocaleString('en-IN')}</td>
            </tr>
            ${discountRow}
            <tr>
              <td colspan="2" style="padding: 4px 10px; text-align: right; color: #4b5563; font-size: 13px;">Shipping:</td>
              <td style="padding: 4px 10px; text-align: right; color: #1f2937; font-size: 13px;">${shippingLabel}</td>
            </tr>
            ${taxRow}
            <tr>
              <td colspan="2" style="padding: 12px 10px 4px 10px; text-align: right; font-weight: 700; color: #111827; font-size: 16px; border-top: 2px solid #e6decb;">
                Grand Total:
              </td>
              <td style="padding: 12px 10px 4px 10px; text-align: right; font-weight: 800; color: #012d1d; font-size: 18px; border-top: 2px solid #e6decb;">
                &#8377;${Number(order.total).toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 18px 24px; background-color: #faf5eb; border-top: 1px dashed #d6caba; border-bottom: 1px dashed #d6caba;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="55%" style="vertical-align: top; padding-right: 12px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #854d0e; margin-bottom: 4px;">
                Delivery Destination
              </div>
              <div style="font-size: 13px; color: #1f2937; line-height: 1.5;">
                ${fullAddress}
              </div>
              ${order.customerPhone ? `<div style="font-size: 12px; color: #4b5563; margin-top: 4px;">Phone: ${escapeHtml(order.customerPhone)}</div>` : ''}
            </td>
            <td width="45%" style="vertical-align: top; padding-left: 12px;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #854d0e; margin-bottom: 4px;">
                Payment &amp; Dispatch
              </div>
              <div style="font-size: 13px; color: #1f2937; font-weight: 600;">
                ${escapeHtml(order.paymentMethod.toUpperCase())}
              </div>
              <div style="font-size: 12px; color: #4b5563; margin-top: 4px;">
                Date: ${escapeHtml(formattedDate)}
              </div>
              <div style="font-size: 12px; color: #065f46; font-weight: 600; margin-top: 2px;">
                ETA: 2-4 Business Days
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 22px 24px; text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6;">
        <p style="margin: 0 0 8px 0;">
          Questions about your order? Contact us at <a href="mailto:baagfresh@gmail.com" style="color: #012d1d; font-weight: 700;">baagfresh@gmail.com</a> or call <strong>+91 87076 71319</strong>.
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 11px;">
          &copy; ${new Date().getFullYear()} BAAGFRESH Dry Fruits &amp; Spices. Varanasi, Uttar Pradesh, India.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function generateOrderConfirmationEmailText(order: OrderConfirmationEmailInput): string {
  const lines = [
    `BAAGFRESH - Order Confirmation #${order.orderId}`,
    `--------------------------------------------------`,
    `Pranam ${order.customerName},`,
    `Thank you for shopping with BAAGFRESH! Your order has been confirmed.`,
    ``,
    `Items:`,
    ...order.items.map(
      (item) =>
        `- ${item.name}${item.weight ? ` (${item.weight})` : ''} x${item.quantity}: Rs. ${(
          Number(item.price) * Number(item.quantity)
        ).toLocaleString('en-IN')}`
    ),
    ``,
    `Subtotal: Rs. ${Number(order.subtotal).toLocaleString('en-IN')}`,
    ...(order.discount ? [`Discount: -Rs. ${Number(order.discount).toLocaleString('en-IN')}`] : []),
    `Shipping: ${Number(order.shippingFee) === 0 ? 'FREE' : `Rs. ${Number(order.shippingFee).toLocaleString('en-IN')}`}`,
    `Grand Total: Rs. ${Number(order.total).toLocaleString('en-IN')}`,
    ``,
    `Payment Method: ${order.paymentMethod.toUpperCase()}`,
    `Shipping Address: ${[
      order.shippingAddress.apartment,
      order.shippingAddress.street,
      `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
    ]
      .filter(Boolean)
      .join(', ')}`,
    ``,
    `Need help? Email baagfresh@gmail.com or call +91 87076 71319.`,
  ];

  return lines.join('\n');
}

export async function sendEmailViaGmailSmtp(options: SendEmailOptions): Promise<EmailDispatchResult> {
  const recipientStr = Array.isArray(options.to) ? options.to.join(', ') : options.to;
  const env = readSmtpEnv();

  if (!isGmailSmtpConfigured()) {
    return {
      sent: false,
      skipped: true,
      recipient: recipientStr,
      reason:
        'Gmail SMTP relay credentials (GMAIL_USER and GMAIL_APP_PASSWORD) are not configured on the server.',
    };
  }

  try {
    const transporter = createGmailTransporter();
    const mailOptions: SendMailOptions = {
      from: `"${options.fromName || env.fromName}" <${env.user}>`,
      to: options.to,
      replyTo: options.replyTo || env.replyTo,
      subject: options.subject,
      html: options.html,
      ...(options.text ? { text: options.text } : {}),
    };

    const info = await transporter.sendMail(mailOptions);
    return {
      sent: true,
      recipient: recipientStr,
      messageId: info.messageId,
      accepted: Array.isArray(info.accepted) ? info.accepted.map(String) : undefined,
    };
  } catch (err: any) {
    console.error('[Email Service] Gmail SMTP send error:', err);
    return {
      sent: false,
      recipient: recipientStr,
      error: err?.message || 'Failed to send email via Gmail SMTP relay.',
    };
  }
}

export async function sendOrderConfirmationEmail(
  order: OrderConfirmationEmailInput
): Promise<EmailDispatchResult> {
  const recipient = (order.customerEmail || '').trim();
  if (!isValidEmailAddress(recipient)) {
    return {
      sent: false,
      skipped: true,
      recipient: recipient || undefined,
      reason: 'No valid customer email address was provided for this order.',
    };
  }

  const subject = `BAAGFRESH Order Confirmation #${order.orderId}`;
  const html = generateOrderConfirmationEmailHtml(order);
  const text = generateOrderConfirmationEmailText(order);

  return sendEmailViaGmailSmtp({
    to: recipient,
    subject,
    html,
    text,
  });
}
