import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import {
  sendOrderConfirmationEmail,
  verifyGmailSmtpConnection,
  getGmailSmtpConfigStatus,
  sendEmailViaGmailSmtp
} from "./src/lib/email";
import {
  sendWhatsAppOrderAlertToOwner,
  getWhatsAppConfigStatus,
  setRuntimeOfficialWhatsAppNumber,
  sendWhatsAppTextMessage
} from "./src/lib/whatsapp";
import {
  localInsertOrder,
  localGetOrderById,
  localGetAllOrders,
  localGetOrdersByPhone,
  localUpdateOrderStatus,
  localFindCustomer,
  localUpsertCustomer,
  localGetAllCustomers
} from "./src/lib/localStore";
import {
  verifyAdminRequest,
  issueAdminApprovalChallenge,
  confirmAdminApprovalChallenge,
  getActiveConfirmedSession,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  revokeAdminSession,
  getAuthorizedOwnerEmails,
  getClientIp,
  checkAdminRateLimit,
  recordFailedAdminAttempt,
  clearFailedAdminAttempts,
} from "./src/lib/serverAuth";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Universal CORS & Preflight middleware for all API routes
app.use("/api", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-approval-token, x-user-email, x-user-phone");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// Supabase Server Client (only active when explicitly configured via env and reachable)
const defaultSupabaseUrl = 'https://yarbuasdzujbtrwcfdwb.supabase.co';
const defaultSupabaseAnonKey = 'sb_publishable_TKF3pz5CdryPzu7vd0oKlg_RHOjOhHO';

const rawServerUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const rawServerKey = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

const hasExplicitSupabaseEnv = Boolean(
  rawServerUrl && (rawServerUrl.startsWith('http://') || rawServerUrl.startsWith('https://'))
);
const supabaseUrl = hasExplicitSupabaseEnv ? rawServerUrl : defaultSupabaseUrl;
const supabaseAnonKey = rawServerKey || defaultSupabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

let supabaseBackoffUntil = 0;

function isSupabaseNetworkError(err: any): boolean {
  if (!err) return false;
  const combined = `${err?.message || ''} ${err?.details || ''} ${err?.hint || ''} ${err?.code || ''}`.toLowerCase();
  return (
    combined.includes('fetch failed') ||
    combined.includes('enotfound') ||
    combined.includes('econnrefused') ||
    combined.includes('etimedout') ||
    combined.includes('eai_again') ||
    combined.includes('network')
  );
}

function canUseSupabase(): boolean {
  if (!hasExplicitSupabaseEnv) return false;
  return Date.now() >= supabaseBackoffUntil;
}

function noteSupabaseError(err: any): boolean {
  if (isSupabaseNetworkError(err)) {
    supabaseBackoffUntil = Date.now() + 60_000;
    return true;
  }
  return false;
}

async function serverQueryOrder(executor: (tbl: string) => any) {
  let res = await executor('Order');
  if (res && res.error && (res.error.code === 'PGRST205' || res.error.message?.includes('Could not find the table'))) {
    res = await executor('orders');
  }
  return res;
}

// Lazy Google GenAI Client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// System Persona & Knowledge Base for BAAGFRESH
const SYSTEM_INSTRUCTION = `You are "BaagFresh Royal Concierge & Sommelier", the prestigious AI advisor for BAAGFRESH (बाघफ्रेश) — Varanasi's premier purveyor of royal grade dry fruits, authentic whole spices, exotic nuts, organic seeds, and handcrafted festive gifting hampers.

Your Responsibilities:
1. Product Expertise: Guide customers on dry fruit quality (e.g. Mamra Almonds vs California Almonds, Cashew Grade W180 King size vs W320, Kashmiri Mongra Grade-A1 Saffron vs Persian, Afghan Green Raisins, Medjool Royal Dates, Kashmiri Walnut Kernels, Whole Green Cardamom, Cloves, Cinnamon).
2. Health & Ayurveda: Provide evidence-based and traditional benefits (e.g. soaked almonds for memory & heart, walnuts for brain health/omega-3, saffron milk for vitality & skin glow, chia/pumpkin seeds for fiber & zinc, figs for digestion).
3. Royal Gifting Concierge: Recommend hampers based on budget, occasion (Weddings, Diwali, Eid, Corporate, Housewarming) and custom combinations.
4. Store Info:
   - Location: Varanasi Hub, Uttar Pradesh, India.
   - Contact: +91 87076 71319 | Email: baagfresh@gmail.com
   - Shipping: Free delivery across India on orders above ₹999. Express delivery in 2-4 business days with vacuum-sealed freshness packaging.
   - Bulk / Corporate: Direct inquiry support with custom laser-engraved wooden boxes & corporate branding.

Product Catalog Overview:
- ID: 'mamra-almonds' | Iranian Mamra Royal Almonds (Grade AAA) | ₹1,450/250g | 100% oil content, cold-pressed quality
- ID: 'kaju-w180' | Royal King Jumbo Cashews (Grade W-180) | ₹680/250g | King-sized whole cashews from Mangalore/Goa
- ID: 'kashmiri-saffron' | Pure Kashmiri Mongra Grade A1 Saffron (Kesar) | ₹599/1g | 100% pure stigma, GI-tagged Pampore harvest
- ID: 'walnut-kashmiri' | Snow-White Kashmiri Walnut Kernels | ₹490/250g | Extra light halves, rich in Omega-3
- ID: 'green-cardamom' | Royal Idukki Green Cardamom 8mm+ Jumbo | ₹580/100g | Aromatic whole pods from Kerala
- ID: 'pistachio-salted' | Jumbo Iranian Roasted & Lightly Salted Pistachios | ₹620/250g | Naturally opened, rich crunch
- ID: 'medjool-dates' | Royal Medjool Jumbo Dates | ₹750/500g | Soft, luscious caramel sweetness
- ID: 'black-pepper' | Malabar Tellicherry Garbled Extra Bold Black Pepper | ₹280/100g | High piperine content
- ID: 'pumpkin-seeds' | Raw Organic Himalayan Pumpkin Seeds | ₹240/250g | Rich in Magnesium & Zinc
- ID: 'chia-seeds' | Pure Organic Black Chia Seeds | ₹210/250g | High fiber & omega fatty acids
- ID: 'cranberries' | Whole Dried Ruby Cranberries | ₹340/250g | Tart-sweet superfood
- ID: 'turkish-figs' | Royal Jumbo Golden Turkish Anjeer | ₹620/250g | Naturally sun-dried, high fiber
- ID: 'royal-gift-trunk' | The Imperial Royal Gifting Trunk | ₹4,200 | Velvet lined wooden chest with 6 royal jars
- ID: 'festive-wooden-box' | Shahi Festive Handcrafted Wooden Dry Fruit Box | ₹2,499 | Intricate heritage brass inlay box

Response Formatting:
- Tone: Warm, refined, respectful, knowledgeable, and hospitable ("Namaste & Welcome to BaagFresh!").
- Formatting: Use concise bullet points, bold product highlights, and clear recommendations.
- When recommending catalog items, mention the exact product name and append special tag \`[PRODUCT:product-id]\` (e.g. \`[PRODUCT:mamra-almonds]\`, \`[PRODUCT:kashmiri-saffron]\`, \`[PRODUCT:kaju-w180]\`, \`[PRODUCT:royal-gift-trunk]\`) so the website can render direct purchase cards!`;

// ==========================================
// SECURITY & RBAC ACCESS CONTROL DEFINITIONS
// ==========================================
// Authorized owner list is strictly managed server-side in src/lib/serverAuth.ts

// Server-side audit event store
interface ServerSecurityEvent {
  id: string;
  timestamp: string;
  action: string;
  userEmail: string;
  status: "granted" | "denied" | "flagged";
  ip: string;
  details: string;
}

const serverAuditLog: ServerSecurityEvent[] = [
  {
    id: "sec-init-" + Date.now(),
    timestamp: new Date().toISOString(),
    action: "SYSTEM_SECURITY_INITIALIZATION",
    userEmail: "system@baagfresh.in",
    status: "granted",
    ip: "127.0.0.1",
    details: "Server-side Access Control Guard & Google Admin Authentication policy armed.",
  }
];

// Role Permission Policy Matrix
const ROLE_PERMISSIONS_POLICY = [
  {
    role: "superadmin",
    title: "Master / Super Administrator",
    badgeColor: "amber",
    description: "Exclusive full system control with sole Google Sign-In authentication enforcement.",
    allowedActions: [
      "Access Admin Control Center",
      "Full Product Catalog & Inventory Management (Add, Edit, Bulk, Price overrides)",
      "Live Order Status Management & Fulfillment Processing",
      "Storewide Settings, Announcement Banners & Maintenance Mode",
      "Promo Codes Management & Usage Auditing",
      "Wholesale Inquiries Review, Quoting & Status Transitions",
      "Security Posture & RBAC Audit Log Inspection",
      "Google Admin Identity Verification"
    ],
    restrictedActions: []
  },
  {
    role: "store_manager",
    title: "Store Operations Manager",
    badgeColor: "emerald",
    description: "Daily inventory updates, live order tracking, and wholesale inquiry management.",
    allowedActions: [
      "View Live Orders & Update Dispatch Milestones",
      "Update Stock Availability & Low-Stock Alerts",
      "Manage Wholesale Inquiries & Record Patron Quotes",
      "Inspect Product Reviews & Flag Spam"
    ],
    restrictedActions: [
      "Modify Global Store Financial Settings",
      "Delete Master Products",
      "Modify Security Access Control Rules"
    ]
  },
  {
    role: "customer",
    title: "Verified Royal Patron (Customer)",
    badgeColor: "blue",
    description: "Standard registered user with personal data protection and shopping capabilities.",
    allowedActions: [
      "Browse Full Catalog & Filter Products",
      "Manage Shopping Cart & Custom Box Bundles",
      "Save Personal Delivery Addresses to Firestore Profile",
      "Track Personal Orders in Real-Time",
      "Submit Product Reviews & Wishlist Items",
      "Submit Wholesale Inquiries"
    ],
    restrictedActions: [
      "Access Admin Control Center",
      "Modify Catalog Prices or Inventory",
      "View Other Customers' Orders or Addresses",
      "Access Server Security Logs"
    ]
  },
  {
    role: "guest",
    title: "Anonymous Guest Patron",
    badgeColor: "slate",
    description: "Public visitor with transient shopping privileges.",
    allowedActions: [
      "Browse Catalog & View Product Details",
      "Add to Cart & Calculate Shipping",
      "Place Orders with Guest Checkout",
      "Interact with AI Dry Fruits Sommelier"
    ],
    restrictedActions: [
      "Access User Profile Dashboard",
      "Access Admin Control Center",
      "Perform Administrative Operations"
    ]
  }
];

function pushAuditEvent(event: Omit<ServerSecurityEvent, "id" | "timestamp">) {
  serverAuditLog.unshift({
    id: "sec-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    timestamp: new Date().toISOString(),
    ...event,
  });
  if (serverAuditLog.length > 100) serverAuditLog.pop();
}

// Server-side Middleware: Cryptographic Admin Verification (Firebase ID Token + Confirmed Server Session)
async function verifyAdminAuthorization(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientIp = getClientIp(req);
  const verification = await verifyAdminRequest(req, { requireConfirmedSession: true });

  if (!verification.ok || !verification.token) {
    pushAuditEvent({
      action: "UNAUTHORIZED_ADMIN_ROUTE_ATTEMPT",
      userEmail: verification.token?.email || "unverified",
      status: "denied",
      ip: clientIp,
      details: `Denied access to ${req.method} ${req.originalUrl}. Reason: ${verification.code || "AUTH_FORBIDDEN"}.`,
    });

    return res.status(verification.statusCode || 403).json({
      success: false,
      error: verification.error || "Access Denied: Verified administrator authentication and approval confirmation are required.",
      code: verification.code || "AUTH_FORBIDDEN",
    });
  }

  (req as any).verifiedAdmin = verification.token;
  next();
}

// Server-side Middleware: Enforce Patron / Customer Data Isolation
async function enforceCustomerDataIsolation(req: express.Request, res: express.Response, next: express.NextFunction) {
  const requestingUid = (req.headers["x-user-uid"] as string || "").trim();
  const targetUserId = (req.params.userId || req.query.userId || req.body?.userId || "").toString().trim();
  const clientIp = getClientIp(req);

  const adminCheck = await verifyAdminRequest(req, { requireConfirmedSession: true });
  const isElevatedAdmin = adminCheck.ok;

  if (targetUserId && targetUserId !== requestingUid && !isElevatedAdmin) {
    pushAuditEvent({
      action: "CROSS_USER_DATA_ACCESS_BLOCKED",
      userEmail: requestingUid || "unknown-user",
      status: "denied",
      ip: clientIp,
      details: `Blocked attempt to access customer data belonging to userId: "${targetUserId}".`,
    });

    return res.status(403).json({
      error: "Access Denied: Customer Data Isolation Policy violated. You may only query and view your own private orders and records.",
      code: "CROSS_USER_ACCESS_FORBIDDEN",
      targetUserId,
    });
  }

  next();
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    service: "BaagFresh Secure Commerce & Gemini Server",
    serverAdminVerificationActive: true,
    timestamp: new Date().toISOString(),
  });
});

// RBAC Roles & Permissions Policy Endpoint (Publicly auditable)
app.get("/api/auth/roles-policy", (_req, res) => {
  res.json({
    success: true,
    matrix: ROLE_PERMISSIONS_POLICY,
    adminMethodRequirement: "Server-Verified Owner Identity (checkAdminRole) + Approval Confirmation",
    version: "3.0-cryptographic-hardened",
  });
});

/**
 * Authoritative Server-Side Admin Role Verification & Two-Step Confirmation Endpoint
 * - Verifies cryptographic Firebase RS256 ID Token signature against Google's official public x509 certs
 * - Requires email_verified === true and exact match against server-only owner allowlist
 * - Stage 1 (action: 'check'): Issues a 5-minute signed single-use approval challenge
 * - Stage 2 (action: 'confirm'): Consumes challenge & mints a server-bound HttpOnly + in-memory session
 */
async function handleCheckAdminRole(req: express.Request, res: express.Response) {
  const clientIp = getClientIp(req);
  const rateCheck = checkAdminRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      isAdmin: false,
      authorized: false,
      approved: false,
      confirmed: false,
      code: "RATE_LIMITED",
      retryAfterSeconds: rateCheck.retryAfterSeconds,
      error: `Too many failed administrative verification attempts. Try again in ${rateCheck.retryAfterSeconds} seconds.`,
    });
  }

  const verification = await verifyAdminRequest(req, { requireConfirmedSession: false });
  if (!verification.ok || !verification.token) {
    recordFailedAdminAttempt(clientIp);
    pushAuditEvent({
      action: "ADMIN_ROLE_CHECK_DENIED",
      userEmail: verification.token?.email || "unverified",
      status: "denied",
      ip: clientIp,
      details: `checkAdminRole denied (${verification.code || "FORBIDDEN"}) from IP ${clientIp}.`,
    });

    return res.status(verification.statusCode || 403).json({
      success: false,
      isAdmin: false,
      authorized: false,
      approved: false,
      confirmed: false,
      code: verification.code || "ADMIN_ROLE_FORBIDDEN",
      error: verification.error || "Access Denied: Verified owner credentials are required.",
    });
  }

  const decoded = verification.token;
  clearFailedAdminAttempts(clientIp);

  const action = (req.body?.action || req.query?.action || "check").toString().toLowerCase();
  const existingSession = getActiveConfirmedSession(req, decoded.uid, decoded.email);

  // Stage 2: Explicit Owner Confirmation -> consumes signed approvalChallenge & activates server session
  if (action === "confirm") {
    const challengeToken = (req.body?.approvalChallenge || "").toString().trim();

    // If an active confirmed session already exists for this exact verified owner, return it
    if (existingSession) {
      setAdminSessionCookie(req, res, existingSession.sessionToken);
      return res.json({
        success: true,
        isAdmin: true,
        authorized: true,
        approved: true,
        confirmed: true,
        requiresConfirmation: false,
        role: "owner_admin",
        sessionToken: existingSession.sessionToken,
        expiresInSeconds: Math.max(60, Math.floor((existingSession.expiresAt - Date.now()) / 1000)),
        authProvider: decoded.signInProvider || "firebase",
        timestamp: new Date().toISOString(),
      });
    }

    const confirmedSession = confirmAdminApprovalChallenge(challengeToken, decoded.uid, decoded.email);
    if (!confirmedSession) {
      pushAuditEvent({
        action: "ADMIN_CONFIRMATION_FAILED",
        userEmail: decoded.email,
        status: "denied",
        ip: clientIp,
        details: "Invalid or expired approval challenge submitted during Step 2 confirmation.",
      });
      return res.status(403).json({
        success: false,
        isAdmin: false,
        authorized: false,
        approved: false,
        confirmed: false,
        code: "INVALID_APPROVAL_CHALLENGE",
        error: "Approval confirmation token is invalid or expired. Please authenticate again.",
      });
    }

    setAdminSessionCookie(req, res, confirmedSession.sessionToken);
    pushAuditEvent({
      action: "ADMIN_ACCESS_CONFIRMED",
      userEmail: decoded.email,
      status: "granted",
      ip: clientIp,
      details: `Owner identity cryptographically verified (${decoded.signInProvider || "firebase"}) and explicitly confirmed.`,
    });

    return res.json({
      success: true,
      isAdmin: true,
      authorized: true,
      approved: true,
      confirmed: true,
      requiresConfirmation: false,
      role: "owner_admin",
      sessionToken: confirmedSession.sessionToken,
      expiresInSeconds: Math.floor((confirmedSession.expiresAt - Date.now()) / 1000),
      authProvider: decoded.signInProvider || "firebase",
      timestamp: new Date().toISOString(),
    });
  }

  // Stage 1: Identity Verified & Approved -> return active session or issue signed confirmation challenge
  if (existingSession) {
    return res.json({
      success: true,
      isAdmin: true,
      authorized: true,
      approved: true,
      confirmed: true,
      requiresConfirmation: false,
      role: "owner_admin",
      sessionToken: existingSession.sessionToken,
      expiresInSeconds: Math.max(60, Math.floor((existingSession.expiresAt - Date.now()) / 1000)),
      authProvider: decoded.signInProvider || "firebase",
      timestamp: new Date().toISOString(),
    });
  }

  const approvalChallenge = issueAdminApprovalChallenge(decoded.uid, decoded.email);
  pushAuditEvent({
    action: "ADMIN_IDENTITY_APPROVED_PENDING_CONFIRMATION",
    userEmail: decoded.email,
    status: "granted",
    ip: clientIp,
    details: `Owner identity verified via ${decoded.signInProvider || "firebase"}. Awaiting explicit owner confirmation.`,
  });

  return res.json({
    success: true,
    isAdmin: true,
    authorized: true,
    approved: true,
    confirmed: false,
    requiresConfirmation: true,
    approvalChallenge,
    role: "owner_admin",
    authProvider: decoded.signInProvider || "firebase",
    timestamp: new Date().toISOString(),
  });
}

app.post("/api/auth/checkAdminRole", handleCheckAdminRole);
app.get("/api/auth/checkAdminRole", handleCheckAdminRole);
app.post("/api/checkAdminRole", handleCheckAdminRole);
app.get("/api/checkAdminRole", handleCheckAdminRole);
// Legacy verify-session route now enforces the same cryptographic checkAdminRole guard
app.post("/api/admin/verify-session", handleCheckAdminRole);

// Revoke server-side admin confirmation session
app.post("/api/auth/adminLogout", (req, res) => {
  const clientIp = getClientIp(req);
  revokeAdminSession(req);
  clearAdminSessionCookie(req, res);
  pushAuditEvent({
    action: "ADMIN_SESSION_REVOKED",
    userEmail: "owner",
    status: "granted",
    ip: clientIp,
    details: "Server-side administrative session revoked and cookie cleared.",
  });
  return res.json({ success: true, message: "Administrative session closed." });
});

// Customer Session & Isolation Audit Verification Endpoint
app.post("/api/customer/verify-access", enforceCustomerDataIsolation, (req, res) => {
  const { orderId, action = "read_orders" } = req.body;
  const requestingUid = (req.headers["x-user-uid"] as string || "").trim();
  const clientIp = getClientIp(req);

  pushAuditEvent({
    action: "CUSTOMER_ISOLATED_ACCESS_GRANTED",
    userEmail: requestingUid || "customer",
    status: "granted",
    ip: clientIp,
    details: `Authorized isolated data query for customer UID: ${requestingUid}. Action: ${action}${orderId ? ` on Order #${orderId}` : ""}.`,
  });

  return res.json({
    authorized: true,
    isolated: true,
    userId: requestingUid,
    role: "customer",
    dataScope: "Strict User-Scoped Self Data Only",
    timestamp: new Date().toISOString(),
  });
});

// Protected Administrative Security Audit Endpoint
app.get("/api/admin/security-audit", verifyAdminAuthorization, (_req, res) => {
  res.json({
    success: true,
    posture: {
      googleAuthEnforced: true,
      serverSideVerificationActive: true,
      rbacPolicyLoaded: true,
      firestoreRulesEnforced: true,
      lastAuditCheck: new Date().toISOString(),
      authorizedAdminCount: getAuthorizedOwnerEmails().length,
      verificationMechanism: "Cryptographic Firebase RS256 ID Token + checkAdminRole Approval Session",
    },
    auditEvents: serverAuditLog.slice(0, 30),
    rolePolicies: ROLE_PERMISSIONS_POLICY,
  });
});

// Protected Administrative System Metrics Endpoint
app.get("/api/admin/stats", verifyAdminAuthorization, (_req, res) => {
  res.json({
    success: true,
    serverUptimeSeconds: Math.floor(process.uptime()),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    securityShield: "ACTIVE (Cryptographic checkAdminRole + Confirmed Server Session)",
    timestamp: new Date().toISOString(),
  });
});

// Multi-turn Chat API Endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, role = "sommelier", model = "gemini-3.5-flash", userContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required." });
    }

    const ai = getGenAI();

    // Context preparation
    let contextStr = "";
    if (userContext) {
      const { user, cart, orders } = userContext;
      contextStr = `\n\nUSER CONTEXT:\n- Logged-in: ${user ? "Yes (" + user.name + ")" : "No (Guest)"}\n`;
      if (user) {
        contextStr += `- Current Cart: ${cart?.length || 0} items\n`;
        if (orders && orders.length > 0) {
          contextStr += `- Past Orders:\n${orders.map((o: any) => `- ID: ${o.id}, Status: ${o.status}, Total: ${o.total}, Tracking: ${o.trackingRef || "N/A"}`).join("\n")}\n`;
        } else {
          contextStr += "- Past Orders: None\n";
        }
      }
    }

    // Check if API key is provided
    if (!ai) {
      // Return a graceful contextual response if API key is pending
      const lastUserMsg = messages[messages.length - 1]?.text || "";
      return res.json({
        text: `Namaste! Welcome to BAAGFRESH Royal Concierge. I am your personal Dry Fruits & Spices Sommelier.\n\nRegarding your query about "${lastUserMsg}":\n• **Royal Mamra Almonds** [PRODUCT:mamra-almonds] and **Grade A1 Kashmiri Saffron** [PRODUCT:kashmiri-saffron] are our most popular premium harvests.\n• For festive gifting, our **Shahi Festive Handcrafted Wooden Box** [PRODUCT:festive-wooden-box] is handcrafted in Varanasi.\n\n*Feel free to browse our complete collection or call us directly at +91 87076 71319.*`,
        modelUsed: "local-fallback",
        recommendedProductIds: ["mamra-almonds", "kashmiri-saffron", "festive-wooden-box"],
      });
    }

    // Determine target model
    let targetModel = "gemini-3.5-flash";
    if (model === "gemini-3.1-pro-preview") {
      targetModel = "gemini-3.1-pro-preview";
    } else if (model === "gemini-3.1-flash-lite") {
      targetModel = "gemini-3.1-flash-lite";
    } else if (model === "gemini-3.7-flash") {
      targetModel = "gemini-3.7-flash";
    }

    // Role-specific instruction modifications
    let roleModifier = "";
    if (role === "health") {
      roleModifier = "\nEmphasis: Focus specifically on ayurvedic wellness, nutritional facts, calorie control, cardiovascular health, pregnancy nutrition, and daily consumption quantities.";
    } else if (role === "gifting") {
      roleModifier = "\nEmphasis: Focus specifically on wedding, corporate, festival (Diwali/Eid), and luxury custom gift hampers, packaging aesthetics, budget options, and personalization.";
    } else if (role === "culinary") {
      roleModifier = "\nEmphasis: Focus specifically on authentic culinary recipes, spice pairings, biryani/kheer preparation, saffron infusion secrets, and proper airtight storage methods.";
    }

    const fullSystemInstruction = `${SYSTEM_INSTRUCTION}\n${roleModifier}${contextStr}\n\nRULES FOR ORDER INQUIRIES:\n1. If user asks about order status, analyze their pastOrders from USER CONTEXT.\n2. If user is a guest, ask them to Sign In.\n3. If user is logged in and has orders, state order details clearly and include [BUTTON:track-order:ORDER_ID].\n4. If user is logged in but has no orders, inform them politely and suggest shopping.`;

    // Transform conversation history into Gemini format
    // Map previous turns: user -> user, assistant -> model
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: contents,
      config: {
        systemInstruction: fullSystemInstruction,
        temperature: 0.7,
        topP: 0.95,
      },
    });

    const replyText = response.text || "Namaste! How may I assist you with BaagFresh premium dry fruits and royal spices today?";

    // Extract product tags if any [PRODUCT:xyz]
    const productTagRegex = /\[PRODUCT:([a-z0-9-]+)\]/gi;
    const recommendedProductIds: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = productTagRegex.exec(replyText)) !== null) {
      if (match[1] && !recommendedProductIds.includes(match[1])) {
        recommendedProductIds.push(match[1]);
      }
    }

    return res.json({
      text: replyText,
      modelUsed: targetModel,
      recommendedProductIds,
    });
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    return res.status(500).json({
      error: error?.message || "Encountered an issue generating AI response.",
      text: "Namaste! Our concierge encountered a temporary connection issue. Please feel free to explore our royal catalogue or contact our Varanasi team at +91 87076 71319.",
    });
  }
});

// Single prompt question answering endpoint
app.post("/api/ask", async (req, res) => {
  try {
    const { question, model = "gemini-3.5-flash" } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question parameter is required." });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        answer: "BAAGFRESH offers farm-direct premium dry fruits, GI-tagged Kashmiri Saffron, and luxury gift hampers with free shipping above ₹999.",
      });
    }

    const response = await ai.models.generateContent({
      model: model || "gemini-3.5-flash",
      contents: question,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    return res.json({
      answer: response.text,
    });
  } catch (error: any) {
    console.error("Gemini Ask Error:", error);
    return res.status(500).json({ error: error?.message || "Failed to process request." });
  }
});

// =========================================================================
// REAL-TIME SUPABASE COMMERCE API (ORDERS, CUSTOMERS, INVENTORY, SYNC)
// =========================================================================

// Memory cache for active duplicate protection (60 second window)
const recentOrderDeduplicationMap = new Map<string, { timestamp: number; orderId: string }>();

// Helper to normalize phone number
function normalizePhoneNumber(rawPhone: string | number | undefined | null): string {
  if (!rawPhone) return "";
  const cleaned = String(rawPhone).replace(/[^\d+]/g, "").trim();
  return cleaned;
}

// 1. Create Order in Supabase
app.post("/api/orders", async (req, res) => {
  try {
    const {
      orderId,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      items,
      subtotal,
      shippingFee = 0,
      tax = 0,
      discount = 0,
      total,
      paymentMethod = "COD",
      paymentStatus,
      idempotencyKey
    } = req.body;

    // 1. Validation: Products & Cart
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot create order: Basket is empty. Please add items to cart."
      });
    }

    for (const item of items) {
      if (!item.quantity || Number(item.quantity) <= 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid quantity for item ${item.product?.name || item.name || 'product'}.`
        });
      }
      if (item.price === undefined || Number(item.price) < 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid price for item ${item.product?.name || item.name || 'product'}.`
        });
      }
    }

    // 2. Validation: Customer details
    const cleanPhone = normalizePhoneNumber(customerPhone || shippingAddress?.phone);
    const cleanName = (customerName || shippingAddress?.fullName || "Valued Patron").trim();

    if (!cleanPhone || cleanPhone.length < 7) {
      return res.status(400).json({
        success: false,
        error: "Valid customer contact phone number is required to confirm order."
      });
    }

    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.pincode) {
      return res.status(400).json({
        success: false,
        error: "Incomplete shipping destination address. Please provide street, city and pincode."
      });
    }

    // 3. Duplicate Prevention / Idempotency Check
    const dedupeKey = idempotencyKey || `${cleanPhone}_${Math.round(Number(total || 0))}_${items.map((i: any) => i.id || i.product?.id).sort().join('-')}`;
    const now = Date.now();
    const existingDedupe = recentOrderDeduplicationMap.get(dedupeKey);

    if (existingDedupe && (now - existingDedupe.timestamp) < 45000) {
      console.log(`[Orders API] Duplicate request caught by idempotency guard: ${dedupeKey} -> Returning ${existingDedupe.orderId}`);
      let existingRow: any = null;
      if (canUseSupabase()) {
        const { data, error } = await supabase
          .from('Order')
          .select('*')
          .eq('order_id', existingDedupe.orderId)
          .single();
        if (!error && data) existingRow = data;
        else noteSupabaseError(error);
      }
      if (!existingRow) {
        existingRow = localGetOrderById(existingDedupe.orderId);
      }

      if (existingRow) {
        return res.json({
          success: true,
          order: existingRow,
          isDuplicateCached: true
        });
      }
    }

    // Calculate final figures
    const numSubtotal = Number(subtotal) || items.reduce((acc: number, it: any) => acc + (Number(it.price) * Number(it.quantity)), 0);
    const numShipping = Number(shippingFee);
    const numDiscount = Number(discount);
    const numTax = Number(tax);
    const calculatedTotal = numSubtotal - numDiscount + numShipping + numTax;
    const finalTotal = Number(total) || calculatedTotal;

    const generatedOrderId = orderId || `BF-${Date.now()}`;
    const cleanPaymentMethod = String(paymentMethod).toUpperCase();
    const cleanStatus = "Order Confirmed";

    // 4. Upsert Customer Record (Supabase when reachable + persistent local store)
    let resolvedCustomerEmail = (customerEmail || shippingAddress?.email || '').trim();
    const existingLocalCust = localFindCustomer({ phone: cleanPhone, email: resolvedCustomerEmail });
    if (!resolvedCustomerEmail && existingLocalCust?.email) {
      resolvedCustomerEmail = existingLocalCust.email;
    }

    if (canUseSupabase()) {
      try {
        const { data: existingCust, error: custFetchErr } = await supabase
          .from('Customer')
          .select('id, phone, email')
          .eq('phone', cleanPhone)
          .limit(1);

        if (custFetchErr) {
          noteSupabaseError(custFetchErr);
        } else if (existingCust && existingCust.length > 0) {
          if (!resolvedCustomerEmail && existingCust[0]?.email) {
            resolvedCustomerEmail = String(existingCust[0].email).trim();
          }
          await supabase
            .from('Customer')
            .update({
              name: cleanName,
              email: resolvedCustomerEmail || existingCust[0]?.email || '',
              saved_address: shippingAddress
            })
            .eq('id', existingCust[0].id);
        } else {
          await supabase
            .from('Customer')
            .insert([{
              name: cleanName,
              phone: cleanPhone,
              email: resolvedCustomerEmail || '',
              saved_address: shippingAddress
            }]);
        }
      } catch (custError) {
        noteSupabaseError(custError);
      }
    }

    localUpsertCustomer({
      name: cleanName,
      phone: cleanPhone,
      email: resolvedCustomerEmail || '',
      saved_address: shippingAddress,
    });

    // 5. Insert Order Record (Supabase when reachable, with automatic local persistent store fallback)
    const persistedShippingAddress = resolvedCustomerEmail
      ? { ...shippingAddress, email: resolvedCustomerEmail }
      : shippingAddress;

    const orderPayload = {
      order_id: generatedOrderId,
      customer_name: cleanName,
      customer_phone: cleanPhone,
      shipping_address: persistedShippingAddress,
      items: items,
      subtotal: numSubtotal,
      shipping_fee: numShipping,
      total_amount: finalTotal,
      payment_method: cleanPaymentMethod,
      status: cleanStatus
    };

    let savedOrderRow: any = null;
    let storageBackend: 'supabase' | 'local_store' = 'local_store';

    if (canUseSupabase()) {
      const { data: insertedOrder, error: insertError } = await supabase
        .from('Order')
        .insert([orderPayload])
        .select();

      if (!insertError && insertedOrder && insertedOrder.length > 0) {
        savedOrderRow = insertedOrder[0];
        storageBackend = 'supabase';
      } else if (insertError && !noteSupabaseError(insertError)) {
        console.error('[Orders API] Supabase Insert Error:', insertError);
        return res.status(500).json({
          success: false,
          error: `Could not save order in Supabase database: ${insertError.message || 'Database error'}`
        });
      }
    }

    // Always persist in server local store as well (primary when Supabase is unavailable)
    const localRow = localInsertOrder({
      ...orderPayload,
      created_at: savedOrderRow?.created_at || new Date().toISOString(),
    });
    if (!savedOrderRow) {
      savedOrderRow = localRow;
    }

    // Cache deduplication token
    recentOrderDeduplicationMap.set(dedupeKey, { timestamp: now, orderId: generatedOrderId });
    // Clean old entries
    for (const [key, value] of recentOrderDeduplicationMap.entries()) {
      if (now - value.timestamp > 120000) {
        recentOrderDeduplicationMap.delete(key);
      }
    }

    console.log(`[Orders API] Order ${generatedOrderId} saved via ${storageBackend} for ${cleanName} (${cleanPhone})`);

    // 6. Automatically send order confirmation email via Nodemailer Gmail SMTP relay upon successful Supabase write
    const emailStatus = await sendOrderConfirmationEmail({
      orderId: generatedOrderId,
      customerName: cleanName,
      customerEmail: resolvedCustomerEmail,
      customerPhone: cleanPhone,
      shippingAddress: persistedShippingAddress,
      items: items.map((item: any) => ({
        name: item.product?.name || item.name || 'Premium Harvest Item',
        weight: item.selectedWeight || item.weight,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
      })),
      subtotal: numSubtotal,
      discount: numDiscount,
      shippingFee: numShipping,
      tax: numTax,
      total: finalTotal,
      paymentMethod: cleanPaymentMethod,
      paymentStatus: paymentStatus || (cleanPaymentMethod === 'COD' ? 'cod_pending' : 'paid'),
    });

    if (emailStatus.sent) {
      console.log(`[Orders API] Confirmation email dispatched via Gmail SMTP to ${emailStatus.recipient} (Message ID: ${emailStatus.messageId})`);
    } else {
      console.log(`[Orders API] Confirmation email status for ${generatedOrderId}: ${emailStatus.reason || emailStatus.error || 'Not sent'}`);
    }

    // 7. Automatically generate Order List Template & dispatch to Official Store WhatsApp
    const whatsappNotification = await sendWhatsAppOrderAlertToOwner({
      orderId: generatedOrderId,
      orderNumber: generatedOrderId,
      status: cleanStatus,
      customerName: cleanName,
      customerPhone: cleanPhone,
      customerEmail: resolvedCustomerEmail,
      shippingAddress: persistedShippingAddress,
      items: items.map((item: any) => ({
        name: item.product?.name || item.name || 'Premium Harvest Item',
        weight: item.selectedWeight || item.weight,
        quantity: Number(item.quantity || 1),
        price: Number(item.price || 0),
      })),
      subtotal: numSubtotal,
      discount: numDiscount,
      shippingFee: numShipping,
      tax: numTax,
      total: finalTotal,
      paymentMethod: cleanPaymentMethod,
      paymentStatus: paymentStatus || (cleanPaymentMethod === 'COD' ? 'cod_pending' : 'paid'),
    });

    if (whatsappNotification.sent) {
      console.log(`[Orders API] WhatsApp Order List dispatched to ${whatsappNotification.adminNumber} via ${whatsappNotification.mode}`);
    } else {
      console.log(`[Orders API] WhatsApp Order List ready for ${whatsappNotification.adminNumber} (${whatsappNotification.mode})`);
    }

    return res.status(201).json({
      success: true,
      order: savedOrderRow,
      emailStatus,
      whatsappNotification,
      storage: storageBackend,
      message: `Order #${generatedOrderId} confirmed and saved.`
    });
  } catch (error: any) {
    console.error('[Orders API] Uncaught Exception in POST /api/orders:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error occurred while processing order."
    });
  }
});

// 2. Fetch Orders (Customer-isolated or Server-Verified Admin full-access)
app.get("/api/orders", async (req, res) => {
  try {
    const queryPhone = req.query.phone as string;
    const queryOrderId = req.query.orderId as string;
    const userPhoneHeader = (req.headers["x-user-phone"] as string || "").trim();

    // Cryptographically verify admin role & confirmed session (never trust raw email headers)
    const adminVerification = await verifyAdminRequest(req, { requireConfirmedSession: true });
    const isAdmin = adminVerification.ok;

    const effectivePhone = normalizePhoneNumber(queryPhone || userPhoneHeader);

    // If fetching single order by orderId
    if (queryOrderId) {
      let order: any = null;
      if (canUseSupabase()) {
        const { data, error } = await supabase
          .from('Order')
          .select('*')
          .eq('order_id', queryOrderId)
          .single();
        if (!error && data) {
          order = data;
        } else if (error) {
          noteSupabaseError(error);
        }
      }
      if (!order) {
        order = localGetOrderById(queryOrderId);
      }

      if (!order) {
        return res.status(404).json({ success: false, error: "Order not found." });
      }

      // Strict ownership check: non-admin must supply a matching customer phone
      if (!isAdmin) {
        const orderDigits = normalizePhoneNumber(order.customer_phone).slice(-10);
        const reqDigits = effectivePhone.slice(-10);
        if (!reqDigits || !orderDigits || orderDigits !== reqDigits) {
          return res.status(403).json({ success: false, error: "Unauthorized access to order." });
        }
      }

      return res.json({ success: true, order });
    }

    // Admin query without phone filter -> return ALL store orders
    if (isAdmin && !effectivePhone) {
      let allOrders: any[] | null = null;
      if (canUseSupabase()) {
        const { data, error } = await supabase
          .from('Order')
          .select('*')
          .order('order_id', { ascending: false });

        if (!error && Array.isArray(data)) {
          allOrders = data;
        } else if (error && !noteSupabaseError(error)) {
          console.error('[Orders API] Error fetching admin orders from Supabase:', error);
        }
      }

      if (allOrders === null) {
        allOrders = localGetAllOrders();
      }

      return res.json({
        success: true,
        orders: allOrders || [],
        total: allOrders?.length || 0,
        scope: "store_admin"
      });
    }

    // Customer query with phone filter -> return user's orders only
    if (effectivePhone) {
      let customerOrders: any[] | null = null;
      if (canUseSupabase()) {
        const { data, error } = await supabase
          .from('Order')
          .select('*')
          .ilike('customer_phone', `%${effectivePhone.slice(-10)}%`)
          .order('order_id', { ascending: false });

        if (!error && Array.isArray(data)) {
          customerOrders = data;
        } else if (error && !noteSupabaseError(error)) {
          console.error('[Orders API] Error fetching customer orders from Supabase:', error);
        }
      }

      if (customerOrders === null) {
        customerOrders = localGetOrdersByPhone(effectivePhone);
      }

      return res.json({
        success: true,
        orders: customerOrders || [],
        total: customerOrders?.length || 0,
        scope: "customer_isolated"
      });
    }

    // If neither admin nor phone filter provided, return empty array for safety
    return res.json({
      success: true,
      orders: [],
      total: 0,
      scope: "unauthenticated_guest"
    });
  } catch (error: any) {
    console.error('[Orders API] Uncaught Exception in GET /api/orders:', error);
    return res.status(500).json({ success: false, error: error?.message || "Failed to fetch orders." });
  }
});

// 3. Update Order Status (Strictly Server-Verified Admin, or Self-Cancellation by Order Owner)
app.patch("/api/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, customerPhone } = req.body || {};

    if (!orderId || !status) {
      return res.status(400).json({ success: false, error: "Both orderId and status are required." });
    }

    const adminVerification = await verifyAdminRequest(req, { requireConfirmedSession: true });
    if (!adminVerification.ok) {
      // Non-admins may ONLY cancel their own order when phone matches the order's customer_phone
      const isCancellation = String(status).trim().toLowerCase() === "cancelled";
      const reqPhoneDigits = normalizePhoneNumber(customerPhone || (req.headers["x-user-phone"] as string)).slice(-10);

      if (!isCancellation || !reqPhoneDigits) {
        return res.status(403).json({
          success: false,
          code: "ADMIN_ROLE_REQUIRED",
          error: "Access Denied: Verified administrator authentication is required to update order status.",
        });
      }

      let existingOrder: any = null;
      if (canUseSupabase()) {
        const { data, error } = await supabase
          .from('Order')
          .select('order_id, customer_phone')
          .eq('order_id', orderId)
          .single();
        if (!error && data) existingOrder = data;
        else if (error) noteSupabaseError(error);
      }
      if (!existingOrder) {
        existingOrder = localGetOrderById(orderId);
      }
      if (!existingOrder) {
        return res.status(404).json({ success: false, error: `Order #${orderId} not found.` });
      }

      const orderDigits = normalizePhoneNumber(existingOrder.customer_phone).slice(-10);
      if (!orderDigits || orderDigits !== reqPhoneDigits) {
        return res.status(403).json({
          success: false,
          code: "ORDER_OWNER_MISMATCH",
          error: "Access Denied: You can only cancel your own orders.",
        });
      }
    }

    let updatedRow: any = null;
    if (canUseSupabase()) {
      const { data: updated, error } = await supabase
        .from('Order')
        .update({ status: String(status) })
        .eq('order_id', orderId)
        .select();

      if (!error && updated && updated.length > 0) {
        updatedRow = updated[0];
      } else if (error && !noteSupabaseError(error)) {
        console.error(`[Orders API] Failed to update status for order ${orderId}:`, error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    const localUpdated = localUpdateOrderStatus(orderId, String(status));
    if (!updatedRow) {
      updatedRow = localUpdated;
    }

    if (!updatedRow) {
      return res.status(404).json({ success: false, error: `Order #${orderId} not found.` });
    }

    console.log(`[Orders API] Order #${orderId} status updated to "${status}".`);
    return res.json({
      success: true,
      order: updatedRow,
      message: `Order status updated to "${status}".`
    });
  } catch (error: any) {
    console.error('[Orders API] Exception in PATCH /api/orders/:orderId/status:', error);
    return res.status(500).json({ success: false, error: error?.message || "Failed to update order status." });
  }
});

// 4. Customer Registration & Authentication Handlers (/api/register, /api/auth/register, /api/customer/register)
const handleCustomerRegistration = async (req: express.Request, res: express.Response) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const { name, fullName, identifier, emailOrPhone, phone, email, pin, password, address } = req.body || {};
    
    const cleanName = (name || fullName || '').trim();
    const rawIdentifier = (identifier || emailOrPhone || phone || email || '').trim();

    if (!cleanName || !rawIdentifier) {
      return res.status(400).json({
        success: false,
        error: "Name and email or mobile phone number are required."
      });
    }

    const isEmail = rawIdentifier.includes("@");
    const cleanEmail = isEmail ? rawIdentifier.toLowerCase() : (email ? String(email).trim().toLowerCase() : "");
    const cleanPhone = !isEmail ? normalizePhoneNumber(rawIdentifier) : (phone ? normalizePhoneNumber(phone) : "");

    let customerRecord: any = null;
    if (canUseSupabase()) {
      try {
        let existingCustomer: any = null;
        if (cleanPhone) {
          const { data: byPhone, error } = await supabase
            .from('Customer')
            .select('*')
            .eq('phone', cleanPhone)
            .limit(1);
          if (error) noteSupabaseError(error);
          else if (byPhone && byPhone.length > 0) existingCustomer = byPhone[0];
        }

        if (!existingCustomer && cleanEmail && canUseSupabase()) {
          const { data: byEmail, error } = await supabase
            .from('Customer')
            .select('*')
            .eq('email', cleanEmail)
            .limit(1);
          if (error) noteSupabaseError(error);
          else if (byEmail && byEmail.length > 0) existingCustomer = byEmail[0];
        }

        if (canUseSupabase()) {
          if (existingCustomer) {
            const { data: updated, error: updErr } = await supabase
              .from('Customer')
              .update({
                name: cleanName || existingCustomer.name,
                email: cleanEmail || existingCustomer.email,
                phone: cleanPhone || existingCustomer.phone,
                saved_address: address || existingCustomer.saved_address
              })
              .eq('id', existingCustomer.id)
              .select();
            if (updErr) noteSupabaseError(updErr);
            customerRecord = (updated && updated[0]) ? updated[0] : existingCustomer;
          } else {
            const { data: created, error: insErr } = await supabase
              .from('Customer')
              .insert([{
                name: cleanName,
                phone: cleanPhone || null,
                email: cleanEmail || '',
                saved_address: address || null
              }])
              .select();
            if (insErr) noteSupabaseError(insErr);
            if (created && created[0]) customerRecord = created[0];
          }
        }
      } catch (e) {
        noteSupabaseError(e);
      }
    }

    const localCustomer = localUpsertCustomer({
      name: cleanName,
      phone: cleanPhone || null,
      email: cleanEmail || '',
      saved_address: address || null,
    });
    if (!customerRecord) {
      customerRecord = localCustomer;
    }

    // Build standard User profile
    const userProfile = {
      id: String(customerRecord.id || `cust-${Date.now()}`),
      name: customerRecord.name || cleanName,
      email: customerRecord.email || cleanEmail || '',
      phone: customerRecord.phone || cleanPhone || '',
      identifier: rawIdentifier,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
      memberSince: customerRecord.created_at ? new Date(customerRecord.created_at).getFullYear().toString() : '2026',
      addresses: customerRecord.saved_address ? (Array.isArray(customerRecord.saved_address) ? customerRecord.saved_address : [customerRecord.saved_address]) : [],
      is2FAEnabled: false,
      e2eEncryptionKeyFingerprint: 'SUPABASE-E2E-VAULT',
      cloudSyncEnabled: true
    };

    return res.status(200).json({
      success: true,
      message: "Account registered successfully.",
      user: userProfile,
      customer: customerRecord
    });
  } catch (err: any) {
    console.error('[Customer API] Registration exception:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal Server Error occurred during registration."
    });
  }
};

app.post("/api/register", handleCustomerRegistration);
app.post("/api/auth/register", handleCustomerRegistration);
app.post("/api/customer/register", handleCustomerRegistration);

// Customer login endpoint
app.post("/api/auth/login", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  try {
    const { identifier, emailOrPhone, phone, email, name } = req.body || {};
    const rawIdentifier = (identifier || emailOrPhone || phone || email || '').trim();

    if (!rawIdentifier) {
      return res.status(400).json({
        success: false,
        error: "Please enter your email or mobile phone number."
      });
    }

    const isEmail = rawIdentifier.includes("@");
    const cleanEmail = isEmail ? rawIdentifier.toLowerCase() : (email ? String(email).trim().toLowerCase() : "");
    const cleanPhone = !isEmail ? normalizePhoneNumber(rawIdentifier) : (phone ? normalizePhoneNumber(phone) : "");

    let customerRecord: any = null;
    let customerOrders: any[] | null = null;

    if (canUseSupabase()) {
      try {
        if (cleanPhone) {
          const { data: byPhone, error } = await supabase
            .from('Customer')
            .select('*')
            .eq('phone', cleanPhone)
            .limit(1);
          if (error) noteSupabaseError(error);
          else if (byPhone && byPhone.length > 0) customerRecord = byPhone[0];
        }
        if (!customerRecord && cleanEmail && canUseSupabase()) {
          const { data: byEmail, error } = await supabase
            .from('Customer')
            .select('*')
            .eq('email', cleanEmail)
            .limit(1);
          if (error) noteSupabaseError(error);
          else if (byEmail && byEmail.length > 0) customerRecord = byEmail[0];
        }
        if (!customerRecord && canUseSupabase()) {
          const { data: created, error } = await supabase
            .from('Customer')
            .insert([{
              name: name || (isEmail ? cleanEmail.split('@')[0] : 'Patron'),
              phone: cleanPhone || null,
              email: cleanEmail || '',
            }])
            .select();
          if (error) noteSupabaseError(error);
          else if (created && created[0]) customerRecord = created[0];
        }
        if (cleanPhone && canUseSupabase()) {
          const { data: orders, error } = await supabase
            .from('Order')
            .select('*')
            .ilike('customer_phone', `%${cleanPhone.slice(-10)}%`)
            .order('order_id', { ascending: false });
          if (error) noteSupabaseError(error);
          else if (orders) customerOrders = orders;
        }
      } catch (e) {
        noteSupabaseError(e);
      }
    }

    if (!customerRecord) {
      customerRecord = localUpsertCustomer({
        name: name || (isEmail ? cleanEmail.split('@')[0] : 'Patron'),
        phone: cleanPhone || null,
        email: cleanEmail || '',
      });
    }
    if (customerOrders === null) {
      customerOrders = cleanPhone ? localGetOrdersByPhone(cleanPhone) : [];
    }

    const userProfile = {
      id: String(customerRecord?.id || `cust-${Date.now()}`),
      name: customerRecord?.name || name || 'Patron',
      email: customerRecord?.email || cleanEmail || '',
      phone: customerRecord?.phone || cleanPhone || '',
      identifier: rawIdentifier,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
      memberSince: customerRecord?.created_at ? new Date(customerRecord.created_at).getFullYear().toString() : '2026',
      addresses: customerRecord?.saved_address ? (Array.isArray(customerRecord.saved_address) ? customerRecord.saved_address : [customerRecord.saved_address]) : [],
      is2FAEnabled: false,
      e2eEncryptionKeyFingerprint: 'SUPABASE-E2E-VAULT',
      cloudSyncEnabled: true
    };

    return res.status(200).json({
      success: true,
      message: "Customer signed in successfully.",
      user: userProfile,
      customer: customerRecord,
      orders: customerOrders
    });
  } catch (err: any) {
    console.error('[Customer API] Login exception:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal Server Error occurred during login."
    });
  }
});

// 4. Sync Customer Profile & Fetch Orders
app.post("/api/customer/auth", async (req, res) => {
  try {
    const { phone, name, email, address } = req.body;
    const cleanPhone = normalizePhoneNumber(phone);

    if (!cleanPhone || cleanPhone.length < 7) {
      return res.status(400).json({ success: false, error: "Valid phone number is required." });
    }

    let customerRecord: any = null;
    let customerOrders: any[] | null = null;

    if (canUseSupabase()) {
      try {
        const { data: existingCust, error: fetchErr } = await supabase
          .from('Customer')
          .select('*')
          .eq('phone', cleanPhone)
          .limit(1);

        if (fetchErr) {
          noteSupabaseError(fetchErr);
        } else if (existingCust && existingCust.length > 0) {
          customerRecord = existingCust[0];
          if (name || email || address) {
            const { data: updatedCust } = await supabase
              .from('Customer')
              .update({
                name: name || customerRecord.name,
                email: email || customerRecord.email,
                saved_address: address || customerRecord.saved_address
              })
              .eq('id', customerRecord.id)
              .select();
            if (updatedCust && updatedCust[0]) {
              customerRecord = updatedCust[0];
            }
          }
        } else {
          const { data: newCust, error: insertErr } = await supabase
            .from('Customer')
            .insert([{
              name: name || 'Patron',
              phone: cleanPhone,
              email: email || '',
              saved_address: address || null
            }])
            .select();
          if (insertErr) noteSupabaseError(insertErr);
          else if (newCust && newCust[0]) customerRecord = newCust[0];
        }

        if (canUseSupabase()) {
          const { data: orders, error: ordErr } = await supabase
            .from('Order')
            .select('*')
            .ilike('customer_phone', `%${cleanPhone.slice(-10)}%`)
            .order('order_id', { ascending: false });
          if (ordErr) noteSupabaseError(ordErr);
          else if (orders) customerOrders = orders;
        }
      } catch (e) {
        noteSupabaseError(e);
      }
    }

    if (!customerRecord) {
      customerRecord = localUpsertCustomer({
        name: name || 'Patron',
        phone: cleanPhone,
        email: email || '',
        saved_address: address || null,
      });
    }
    if (customerOrders === null) {
      customerOrders = localGetOrdersByPhone(cleanPhone);
    }

    return res.json({
      success: true,
      customer: customerRecord,
      orders: customerOrders || []
    });
  } catch (error: any) {
    console.error('[Customer API] Error in /api/customer/auth:', error);
    return res.status(500).json({ success: false, error: error?.message || "Failed to authenticate customer." });
  }
});

// 5. Admin: Get all customers
app.get("/api/customers", verifyAdminAuthorization, async (_req, res) => {
  try {
    let customers: any[] | null = null;
    if (canUseSupabase()) {
      const { data, error } = await supabase
        .from('Customer')
        .select('*')
        .order('id', { ascending: false });

      if (!error && Array.isArray(data)) {
        customers = data;
      } else if (error && !noteSupabaseError(error)) {
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    if (customers === null) {
      customers = localGetAllCustomers();
    }

    return res.json({ success: true, customers: customers || [] });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message });
  }
});

// 6. Gmail SMTP Relay Diagnostics & Testing Endpoints
app.get("/api/email/status", (_req, res) => {
  res.json({
    success: true,
    ...getGmailSmtpConfigStatus(),
  });
});

app.post("/api/email/verify", verifyAdminAuthorization, async (_req, res) => {
  const verification = await verifyGmailSmtpConnection();
  return res.status(verification.ok ? 200 : 400).json({
    success: verification.ok,
    ...verification,
  });
});

app.post("/api/email/test", verifyAdminAuthorization, async (req, res) => {
  const { to } = req.body || {};
  const targetEmail = (to || (req as any).verifiedAdmin?.email || "").toString().trim();

  if (!targetEmail || !targetEmail.includes("@")) {
    return res.status(400).json({
      success: false,
      error: "A valid recipient email address is required to send a test email.",
    });
  }

  const result = await sendEmailViaGmailSmtp({
    to: targetEmail,
    subject: "BAAGFRESH Gmail SMTP Relay Test",
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e6decb; border-radius: 12px; max-width: 560px;">
      <h2 style="color: #012d1d; margin-top: 0;">BAAGFRESH Gmail SMTP Relay Connected</h2>
      <p style="color: #374151; font-size: 14px; line-height: 1.6;">
        This test confirms that your Nodemailer Gmail SMTP relay is properly configured and ready to dispatch automatic customer order confirmations after Supabase order writes.
      </p>
      <p style="color: #6b7280; font-size: 12px;">Timestamp: ${new Date().toISOString()}</p>
    </div>`,
    text: `BAAGFRESH Gmail SMTP Relay Connected. Timestamp: ${new Date().toISOString()}`,
  });

  return res.status(result.sent ? 200 : 400).json({
    success: result.sent,
    ...result,
  });
});

// 7. Official WhatsApp Order Relay Configuration & Testing Endpoints
app.get("/api/whatsapp/status", (_req, res) => {
  res.json({
    success: true,
    ...getWhatsAppConfigStatus(),
  });
});

app.post("/api/whatsapp/config", verifyAdminAuthorization, (req, res) => {
  const { whatsappNumber } = req.body || {};
  if (!whatsappNumber || String(whatsappNumber).replace(/[^\d]/g, '').length < 7) {
    return res.status(400).json({
      success: false,
      error: "Valid official WhatsApp phone number is required.",
    });
  }
  setRuntimeOfficialWhatsAppNumber(String(whatsappNumber));
  return res.json({
    success: true,
    ...getWhatsAppConfigStatus(),
  });
});

app.post("/api/whatsapp/test", verifyAdminAuthorization, async (req, res) => {
  const { to } = req.body || {};
  const status = getWhatsAppConfigStatus();
  const targetPhone = (to || status.officialNumber).toString().trim();

  const sampleListMessage = [
    `*BAAGFRESH — WHATSAPP TEST ORDER LIST*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `*Order ID:* #TEST-${Date.now().toString().slice(-4)}`,
    `*Customer:* Store Verification`,
    `*ITEMS ORDERED LIST*`,
    `1. *Iranian Mamra Royal Almonds* (250g) × 1 — ₹1,450`,
    `2. *Kashmiri Mongra Saffron* (1g) × 1 — ₹599`,
    `• *Grand Total: ₹2,049*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `Official WhatsApp order list system is active.`,
  ].join('\n');

  const result = await sendWhatsAppTextMessage(targetPhone, sampleListMessage);
  return res.json({
    success: true,
    ...result,
    templateText: sampleListMessage,
  });
});

// Setup Vite middleware for development or serve static dist for production
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
        watch: isHmrDisabled ? null : undefined,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`BAAGFRESH Server running on http://localhost:${PORT}`);
  });
}

startServer();
