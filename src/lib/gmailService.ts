import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

// Scopes specifically for Gmail integration
export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.labels',
];

// In-memory token cache (DO NOT store in localStorage or sessionStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initGmailAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google and acquire Gmail OAuth Access Token
 */
export const connectGoogleGmail = async (): Promise<{ user: FirebaseUser; accessToken: string }> => {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
    provider.setCustomParameters({
      prompt: 'select_account consent',
      access_type: 'offline',
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Failed to acquire Gmail OAuth Access Token from Google');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[Gmail Auth Error]:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get the cached in-memory access token
 */
export const getGmailAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Set in-memory token explicitly (e.g. after popup login)
 */
export const setGmailAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet?: string;
  subject?: string;
  from?: string;
  to?: string;
  date?: string;
}

/**
 * Get authenticated user's Gmail profile
 */
export const fetchGmailProfile = async (): Promise<GmailProfile> => {
  const token = getGmailAccessToken();
  if (!token) {
    throw new Error('Gmail not connected. Please sign in with Google first.');
  }

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gmail API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

/**
 * Encode unicode string to base64url format for RFC 2822
 */
const base64UrlEncode = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

export interface SendEmailPayload {
  to: string;
  subject: string;
  htmlBody: string;
  replyTo?: string;
  fromName?: string;
}

/**
 * Send an email directly via user's authenticated Gmail account
 */
export const sendGmailMessage = async (payload: SendEmailPayload): Promise<{ id: string; threadId: string }> => {
  const token = getGmailAccessToken();
  if (!token) {
    throw new Error('Gmail authentication token missing. Please sign in with Google.');
  }

  const profile = await fetchGmailProfile().catch(() => null);
  const senderEmail = profile?.emailAddress || auth.currentUser?.email || 'me';
  const senderName = payload.fromName || auth.currentUser?.displayName || 'Baagh Fresh Gourmet';

  // Construct standard MIME multipart / RFC 2822 message
  const boundary = `__boundary_${Date.now()}__`;
  const rawMessage = [
    `From: "${senderName}" <${senderEmail}>`,
    `To: ${payload.to}`,
    payload.replyTo ? `Reply-To: ${payload.replyTo}` : '',
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`,
    'MIME-Version: 1.0',
    `Content-Type: text/html; charset="UTF-8"`,
    'Content-Transfer-Encoding: base64',
    '',
    btoa(unescape(encodeURIComponent(payload.htmlBody))),
  ]
    .filter(Boolean)
    .join('\r\n');

  const encodedMessage = base64UrlEncode(rawMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email: ${response.statusText}`);
  }

  return response.json();
};

/**
 * List recent messages / order confirmations
 */
export const listRecentEmails = async (query = '', maxResults = 10): Promise<GmailMessageSummary[]> => {
  const token = getGmailAccessToken();
  if (!token) return [];

  const url = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  if (query) url.searchParams.set('q', query);
  url.searchParams.set('maxResults', String(maxResults));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Gmail messages list');
  }

  const data = await response.json();
  const messages: { id: string; threadId: string }[] = data.messages || [];

  // Fetch headers for each message
  const summaries = await Promise.all(
    messages.slice(0, maxResults).map(async (m) => {
      try {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!msgRes.ok) return { id: m.id, threadId: m.threadId };
        const msgData = await msgRes.json();
        const headers = msgData.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
        const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        return {
          id: m.id,
          threadId: m.threadId,
          snippet: msgData.snippet || '',
          subject,
          from,
          to,
          date,
        };
      } catch {
        return { id: m.id, threadId: m.threadId };
      }
    })
  );

  return summaries;
};

/**
 * Generate formatted HTML Email Template for Order Confirmation & Invoice
 */
export const generateOrderConfirmationEmailHtml = (order: {
  id: string;
  customerName: string;
  total: number;
  items: { name: string; weight?: string; quantity: number; price: number }[];
  address: string;
  paymentMethod: string;
  date: string;
}): string => {
  const itemsRows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; color: #1f2937; font-size: 14px;">
        <strong>${item.name}</strong> ${item.weight ? `<span style="color: #6b7280; font-size: 12px;">(${item.weight})</span>` : ''}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: center; color: #4b5563; font-size: 14px;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #eee; text-align: right; color: #012d1d; font-weight: bold; font-size: 14px;">
        ₹${(item.price * item.quantity).toLocaleString('en-IN')}
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Confirmation #${order.id}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <!-- Header -->
    <tr>
      <td style="background-color: #012d1d; padding: 32px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fed65b; font-family: Georgia, serif; font-size: 24px; letter-spacing: 1px; font-weight: bold;">
          BAAGH FRESH
        </h1>
        <p style="margin: 6px 0 0 0; color: #ffffff; opacity: 0.85; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">
          Varanasi Processing Hub • Royal Connoisseur Selection
        </p>
      </td>
    </tr>

    <!-- Greeting & Status -->
    <tr>
      <td style="padding: 32px 24px 16px 24px;">
        <div style="display: inline-block; padding: 4px 12px; background-color: #ecfdf5; color: #065f46; border-radius: 999px; font-size: 12px; font-weight: bold; text-transform: uppercase;">
          ✓ Order Confirmed #${order.id}
        </div>
        <h2 style="margin: 16px 0 8px 0; color: #111827; font-size: 20px;">
          Pranam, ${order.customerName}!
        </h2>
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">
          Your order has been received at our Varanasi processing facility. Our artisans are nitrogen-sealing your harvest batch to lock in maximum aromatics, crunch, and nutritional potency.
        </p>
      </td>
    </tr>

    <!-- Order Items Table -->
    <tr>
      <td style="padding: 16px 24px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #4b5563;">Harvest Item</th>
              <th style="padding: 8px; text-align: center; font-size: 11px; text-transform: uppercase; color: #4b5563;">Qty</th>
              <th style="padding: 8px; text-align: right; font-size: 11px; text-transform: uppercase; color: #4b5563;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 16px 8px 8px 8px; text-align: right; font-weight: bold; color: #111827; font-size: 16px;">
                Grand Total:
              </td>
              <td style="padding: 16px 8px 8px 8px; text-align: right; font-weight: bold; color: #012d1d; font-size: 18px;">
                ₹${order.total.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </td>
    </tr>

    <!-- Shipping & Payment Details -->
    <tr>
      <td style="padding: 16px 24px; background-color: #faf5eb; border-top: 1px dashed #d6caba; border-bottom: 1px dashed #d6caba;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="50%" style="vertical-align: top; padding-right: 12px;">
              <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #854d0e; margin-bottom: 4px;">
                Delivery Terroir Address
              </div>
              <div style="font-size: 13px; color: #1f2937; line-height: 1.5;">
                ${order.address}
              </div>
            </td>
            <td width="50%" style="vertical-align: top; padding-left: 12px;">
              <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #854d0e; margin-bottom: 4px;">
                Payment Mode
              </div>
              <div style="font-size: 13px; color: #1f2937; font-weight: 600;">
                ${order.paymentMethod}
              </div>
              <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                Placed on: ${order.date}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px; text-align: center; color: #6b7280; font-size: 12px; line-height: 1.6;">
        <p style="margin: 0 0 8px 0;">
          Need assistance or custom corporate hampers? Contact our concierge at <a href="mailto:support@baagfresh.in" style="color: #012d1d; font-weight: bold;">support@baagfresh.in</a> or WhatsApp <strong>+91 98765 43210</strong>.
        </p>
        <p style="margin: 0; color: #9ca3af; font-size: 11px;">
          © 2026 Baagh Fresh Dry Fruits & Spices. Varanasi, Uttar Pradesh, India.
        </p>
      </td>
    </tr>

  </table>
</body>
</html>
`;
};

/**
 * Generate formatted HTML Email Template for Wholesale / B2B Inquiry Reply
 */
export const generateInquiryReplyEmailHtml = (inquiry: {
  customerName: string;
  companyName?: string;
  requirement: string;
  replyMessage: string;
  quotationAmount?: number;
}): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Baagh Fresh Wholesale Response</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    
    <tr>
      <td style="background-color: #012d1d; padding: 28px 24px; text-align: center;">
        <h1 style="margin: 0; color: #fed65b; font-family: Georgia, serif; font-size: 22px; letter-spacing: 1px;">
          BAAGH FRESH WHOLESALE & CORPORATE
        </h1>
        <p style="margin: 4px 0 0 0; color: #ffffff; opacity: 0.85; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;">
          Varanasi B2B Supply Division
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 28px 24px;">
        <p style="margin: 0 0 16px 0; font-size: 15px; color: #111827;">
          Dear <strong>${inquiry.customerName}</strong> ${inquiry.companyName ? `(${inquiry.companyName})` : ''},
        </p>
        <p style="margin: 0 0 16px 0; font-size: 14px; color: #374151; line-height: 1.6;">
          Thank you for reaching out regarding your bulk procurement requirement:
        </p>
        <div style="background-color: #f3f4f6; border-left: 4px solid #012d1d; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px; font-style: italic; color: #4b5563; font-size: 13px;">
          "${inquiry.requirement}"
        </div>

        <div style="background-color: #fffbeb; border: 1px solid #fed65b; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px 0; color: #92400e; font-size: 14px; text-transform: uppercase;">
            Executive Response & Terms
          </h4>
          <div style="font-size: 14px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">
${inquiry.replyMessage}
          </div>
          ${
            inquiry.quotationAmount
              ? `
          <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #fed65b; font-size: 14px; color: #92400e; font-weight: bold;">
            Estimated Batch Total: ₹${inquiry.quotationAmount.toLocaleString('en-IN')}
          </div>
          `
              : ''
          }
        </div>

        <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.6;">
          All batches are shipped under nitrogen seal with FSSAI & ISO batch certifications. We can dispatch sample packs to your office within 48 hours.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 20px 24px; background-color: #012d1d; text-align: center; color: #fed65b; font-size: 12px;">
        Baagh Fresh B2B Desk • Direct Phone / WhatsApp: +91 98765 43210
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
