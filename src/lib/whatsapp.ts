import {
  WhatsAppOrderInput,
  normalizeWhatsAppPhone,
  buildWhatsAppClickToChatUrl,
  formatSingleOrderListTemplate,
  formatCustomerConfirmationWhatsAppTemplate,
} from './whatsappTemplates';

export interface WhatsAppConfigStatus {
  officialNumber: string;
  normalizedNumber: string;
  cloudApiConfigured: boolean;
  webhookConfigured: boolean;
  autoSendMode: 'meta_cloud_api' | 'webhook_relay' | 'click_to_chat_only';
  phoneNumberId: string | null;
}

export interface WhatsAppDispatchResult {
  sent: boolean;
  skipped?: boolean;
  mode: 'meta_cloud_api' | 'webhook_relay' | 'click_to_chat_only';
  adminNumber: string;
  waMeUrl: string;
  templateText: string;
  customerConfirmWaMeUrl: string;
  customerConfirmTemplateText: string;
  messageId?: string;
  reason?: string;
  error?: string;
}

// Runtime official WhatsApp number (synced from Store Settings or env var)
let runtimeOfficialWhatsAppNumber = '';

export function setRuntimeOfficialWhatsAppNumber(phone: string) {
  const cleaned = (phone || '').trim();
  if (cleaned) {
    runtimeOfficialWhatsAppNumber = cleaned;
  }
}

function resolveOfficialWhatsAppNumber(): string {
  return (
    runtimeOfficialWhatsAppNumber ||
    process.env.WHATSAPP_ADMIN_NUMBER ||
    process.env.OFFICIAL_WHATSAPP_NUMBER ||
    '+91 87076 71319'
  ).trim();
}

export function getWhatsAppConfigStatus(): WhatsAppConfigStatus {
  const officialNumber = resolveOfficialWhatsAppNumber();
  const normalizedNumber = normalizeWhatsAppPhone(officialNumber);
  const accessToken = (process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || '').trim();
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const webhookUrl = (process.env.WHATSAPP_WEBHOOK_URL || '').trim();

  const cloudApiConfigured = Boolean(accessToken && phoneNumberId && normalizedNumber);
  const webhookConfigured = Boolean(webhookUrl && normalizedNumber);

  const autoSendMode: WhatsAppConfigStatus['autoSendMode'] = cloudApiConfigured
    ? 'meta_cloud_api'
    : webhookConfigured
    ? 'webhook_relay'
    : 'click_to_chat_only';

  return {
    officialNumber,
    normalizedNumber,
    cloudApiConfigured,
    webhookConfigured,
    autoSendMode,
    phoneNumberId: phoneNumberId || null,
  };
}

export async function sendWhatsAppTextMessage(
  recipientPhone: string,
  textBody: string
): Promise<{
  sent: boolean;
  skipped?: boolean;
  mode: WhatsAppConfigStatus['autoSendMode'];
  recipient: string;
  waMeUrl: string;
  messageId?: string;
  reason?: string;
  error?: string;
}> {
  const normalizedRecipient = normalizeWhatsAppPhone(recipientPhone);
  const waMeUrl = buildWhatsAppClickToChatUrl(recipientPhone, textBody);
  const accessToken = (process.env.WHATSAPP_CLOUD_ACCESS_TOKEN || '').trim();
  const phoneNumberId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  const webhookUrl = (process.env.WHATSAPP_WEBHOOK_URL || '').trim();
  const webhookSecret = (process.env.WHATSAPP_WEBHOOK_SECRET || '').trim();

  if (!normalizedRecipient) {
    return {
      sent: false,
      skipped: true,
      mode: 'click_to_chat_only',
      recipient: recipientPhone,
      waMeUrl,
      reason: 'Recipient phone number is empty or invalid.',
    };
  }

  // 1. Meta WhatsApp Business Cloud API
  if (accessToken && phoneNumberId) {
    try {
      const apiVersion = (process.env.WHATSAPP_GRAPH_VERSION || 'v21.0').trim();
      const response = await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: normalizedRecipient,
            type: 'text',
            text: {
              preview_url: false,
              body: textBody,
            },
          }),
        }
      );

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          sent: false,
          mode: 'meta_cloud_api',
          recipient: normalizedRecipient,
          waMeUrl,
          error: data?.error?.message || `WhatsApp Cloud API error (${response.status})`,
        };
      }

      return {
        sent: true,
        mode: 'meta_cloud_api',
        recipient: normalizedRecipient,
        waMeUrl,
        messageId: data?.messages?.[0]?.id,
      };
    } catch (err: any) {
      return {
        sent: false,
        mode: 'meta_cloud_api',
        recipient: normalizedRecipient,
        waMeUrl,
        error: err?.message || 'Network error calling WhatsApp Cloud API.',
      };
    }
  }

  // 2. Custom WhatsApp Webhook Relay (e.g. Twilio / Wati / Interakt / AiSensy / Evolution API)
  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookSecret ? { Authorization: `Bearer ${webhookSecret}` } : {}),
        },
        body: JSON.stringify({
          to: normalizedRecipient,
          phone: `+${normalizedRecipient}`,
          message: textBody,
          source: 'baagfresh-orders',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return {
          sent: false,
          mode: 'webhook_relay',
          recipient: normalizedRecipient,
          waMeUrl,
          error: errText || `WhatsApp webhook returned HTTP ${response.status}`,
        };
      }

      const data: any = await response.json().catch(() => ({}));
      return {
        sent: true,
        mode: 'webhook_relay',
        recipient: normalizedRecipient,
        waMeUrl,
        messageId: data?.messageId || data?.id || `wh-${Date.now()}`,
      };
    } catch (err: any) {
      return {
        sent: false,
        mode: 'webhook_relay',
        recipient: normalizedRecipient,
        waMeUrl,
        error: err?.message || 'Failed to dispatch to WhatsApp webhook relay.',
      };
    }
  }

  // 3. Fallback: Click-to-Chat link ready for instant 1-tap official WhatsApp send
  return {
    sent: false,
    skipped: true,
    mode: 'click_to_chat_only',
    recipient: normalizedRecipient,
    waMeUrl,
    reason:
      'WhatsApp Cloud API tokens are not configured; generated instant Click-to-Chat link with formatted Order List Template.',
  };
}

/**
 * Generates formatted Order List Template and dispatches to the store's Official WhatsApp
 * upon successful Supabase order persistence.
 */
export async function sendWhatsAppOrderAlertToOwner(
  order: WhatsAppOrderInput,
  overrideAdminNumber?: string
): Promise<WhatsAppDispatchResult> {
  const adminNumber = (overrideAdminNumber || resolveOfficialWhatsAppNumber()).trim();
  const templateText = formatSingleOrderListTemplate(order);
  const customerConfirmTemplateText = formatCustomerConfirmationWhatsAppTemplate(order);
  const customerConfirmWaMeUrl = buildWhatsAppClickToChatUrl(
    order.customerPhone || order.shippingAddress?.phone || '',
    customerConfirmTemplateText
  );

  const dispatch = await sendWhatsAppTextMessage(adminNumber, templateText);

  return {
    sent: dispatch.sent,
    skipped: dispatch.skipped,
    mode: dispatch.mode,
    adminNumber,
    waMeUrl: dispatch.waMeUrl,
    templateText,
    customerConfirmWaMeUrl,
    customerConfirmTemplateText,
    messageId: dispatch.messageId,
    reason: dispatch.reason,
    error: dispatch.error,
  };
}
