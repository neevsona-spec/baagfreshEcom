import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type express from 'express';

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// Server-only secret for signing short-lived approval challenges
const SERVER_HMAC_SECRET =
  (process.env.ADMIN_SESSION_SECRET || '').trim() ||
  crypto.randomBytes(32).toString('hex');

const ADMIN_COOKIE_NAME = 'bf_admin_session';
const APPROVAL_CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const ADMIN_SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_FAILURES = 5;
const RATE_LIMIT_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes

export interface VerifiedFirebaseToken {
  uid: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
  authTime: number;
  exp: number;
  iat: number;
  signInProvider?: string;
}

export interface ConfirmedAdminSession {
  sessionToken: string;
  uid: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  lastVerifiedAt: number;
}

interface PendingChallengeRecord {
  uid: string;
  email: string;
  expiresAt: number;
}

interface RateLimitEntry {
  failures: number;
  firstFailureAt: number;
  lockedUntil: number;
}

let cachedProjectId: string | null = null;
let cachedCerts: Record<string, string> = {};
let certsExpiresAt = 0;

const pendingChallenges = new Map<string, PendingChallengeRecord>();
const confirmedSessions = new Map<string, ConfirmedAdminSession>();
const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Load Firebase projectId from firebase-applet-config.json (or env override)
 */
export function getFirebaseProjectId(): string {
  if (cachedProjectId) return cachedProjectId;

  const envProj = (process.env.FIREBASE_PROJECT_ID || '').trim();
  if (envProj) {
    cachedProjectId = envProj;
    return cachedProjectId;
  }

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (parsed?.projectId) {
        cachedProjectId = String(parsed.projectId).trim();
        return cachedProjectId;
      }
    }
  } catch (err) {
    console.error('[ServerAuth] Failed to read firebase-applet-config.json:', err);
  }

  return '';
}

/**
 * Server-side authoritative list of owner administrator emails.
 * Never exposed to the client or derived from request headers.
 */
export function getAuthorizedOwnerEmails(): string[] {
  const fromEnv = (process.env.ADMIN_OWNER_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (fromEnv.length > 0) {
    return Array.from(new Set(fromEnv));
  }

  // Default strictly to the verified store owner account
  return ['neevsona@gmail.com'];
}

export function isAuthorizedOwnerEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  if (!clean) return false;
  return getAuthorizedOwnerEmails().includes(clean);
}

/**
 * Fetch and cache Google's official Firebase Auth public X.509 certificates
 */
async function getGooglePublicCerts(forceRefresh = false): Promise<Record<string, string>> {
  const now = Date.now();
  if (!forceRefresh && Object.keys(cachedCerts).length > 0 && now < certsExpiresAt) {
    return cachedCerts;
  }

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw new Error(`Unable to fetch Google Auth public keys (HTTP ${response.status}).`);
  }

  const certs = (await response.json()) as Record<string, string>;
  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
  const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;

  cachedCerts = certs;
  certsExpiresAt = now + Math.max(60, maxAgeSec) * 1000;
  return cachedCerts;
}

function base64UrlDecodeToBuffer(segment: string): Buffer {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLength), 'base64');
}

/**
 * Cryptographically verify a Firebase ID Token (RS256 JWT) using Google's official X.509 certificates.
 * Requires no IAM privileges and works across all Firebase projects.
 */
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Authentication token is required.');
  }

  const parts = idToken.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid authentication token format.');
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string; kid?: string };
  let payload: Record<string, any>;
  try {
    header = JSON.parse(base64UrlDecodeToBuffer(headerB64).toString('utf-8'));
    payload = JSON.parse(base64UrlDecodeToBuffer(payloadB64).toString('utf-8'));
  } catch {
    throw new Error('Malformed authentication token payload.');
  }

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Unsupported authentication token algorithm.');
  }

  const projectId = getFirebaseProjectId();
  if (!projectId) {
    throw new Error('Firebase project configuration missing on server.');
  }

  // Fetch matching Google X.509 certificate (refresh once if key rotated)
  let certs = await getGooglePublicCerts(false);
  let certPem = certs[header.kid];
  if (!certPem) {
    certs = await getGooglePublicCerts(true);
    certPem = certs[header.kid];
  }
  if (!certPem) {
    throw new Error('Authentication token signing key is not recognized.');
  }

  // Verify RS256 cryptographic signature
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();

  const signatureBuf = base64UrlDecodeToBuffer(signatureB64);
  const isSignatureValid = verifier.verify(certPem, signatureBuf);
  if (!isSignatureValid) {
    throw new Error('Authentication token cryptographic signature verification failed.');
  }

  // Validate standard Firebase ID token claims
  const nowSec = Math.floor(Date.now() / 1000);
  const expectedIssuer = `https://securetoken.google.com/${projectId}`;

  if (payload.aud !== projectId) {
    throw new Error('Authentication token audience mismatch.');
  }
  if (payload.iss !== expectedIssuer) {
    throw new Error('Authentication token issuer mismatch.');
  }
  if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length > 128) {
    throw new Error('Authentication token subject (UID) is invalid.');
  }
  if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
    throw new Error('Authentication session has expired. Please sign in again.');
  }
  if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
    throw new Error('Authentication token issue time is invalid.');
  }
  if (typeof payload.auth_time === 'number' && payload.auth_time > nowSec + 300) {
    throw new Error('Authentication timestamp is invalid.');
  }

  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const emailVerified = payload.email_verified === true;

  if (!email) {
    throw new Error('Authenticated account does not contain a verified email address.');
  }

  return {
    uid: payload.sub,
    email,
    emailVerified,
    name: typeof payload.name === 'string' ? payload.name : undefined,
    picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    authTime: Number(payload.auth_time || payload.iat || nowSec),
    exp: payload.exp,
    iat: payload.iat,
    signInProvider: payload.firebase?.sign_in_provider,
  };
}

/**
 * Extract Bearer JWT from Authorization header (explicitly rejects raw email strings)
 */
export function extractBearerJwt(req: express.Request): string | null {
  const authHeader = (req.headers['authorization'] || '').toString().trim();
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  // A Firebase ID token is a 3-segment JWT; reject plaintext emails or short strings
  if (!token || token.split('.').length !== 3) {
    return null;
  }
  return token;
}

/**
 * Parse a specific cookie value from req.headers.cookie without extra dependencies
 */
export function getCookieValue(req: express.Request, name: string): string | null {
  const rawCookie = req.headers.cookie;
  if (!rawCookie) return null;
  const pairs = rawCookie.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    if (key === name) {
      return decodeURIComponent(pair.slice(idx + 1).trim());
    }
  }
  return null;
}

export function extractAdminSessionToken(req: express.Request): string | null {
  const fromHeader = (req.headers['x-admin-approval-token'] || '').toString().trim();
  if (fromHeader && fromHeader.length >= 32) {
    return fromHeader;
  }
  const fromCookie = getCookieValue(req, ADMIN_COOKIE_NAME);
  if (fromCookie && fromCookie.length >= 32) {
    return fromCookie;
  }
  return null;
}

/**
 * Set or clear the HttpOnly admin confirmation cookie
 */
export function setAdminSessionCookie(req: express.Request, res: express.Response, sessionToken: string): void {
  const isHttps =
    req.secure ||
    (req.headers['x-forwarded-proto'] || '').toString().toLowerCase().includes('https');
  const maxAgeSec = Math.floor(ADMIN_SESSION_TTL_MS / 1000);
  const parts = [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(sessionToken)}`,
    'Path=/',
    `Max-Age=${maxAgeSec}`,
    'HttpOnly',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (isHttps) {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearAdminSessionCookie(req: express.Request, res: express.Response): void {
  const isHttps =
    req.secure ||
    (req.headers['x-forwarded-proto'] || '').toString().toLowerCase().includes('https');
  const parts = [
    `${ADMIN_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (isHttps) {
    parts.push('Secure');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function cleanupExpiredRecords(): void {
  const now = Date.now();
  for (const [key, val] of pendingChallenges.entries()) {
    if (val.expiresAt <= now) pendingChallenges.delete(key);
  }
  for (const [key, val] of confirmedSessions.entries()) {
    if (val.expiresAt <= now) confirmedSessions.delete(key);
  }
}

/**
 * Stage 1 -> Issue a signed, single-use 5-minute approval challenge bound to verified uid & email
 */
export function issueAdminApprovalChallenge(uid: string, email: string): string {
  cleanupExpiredRecords();
  const nonce = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + APPROVAL_CHALLENGE_TTL_MS;
  const payload = `${uid}|${email.toLowerCase()}|${nonce}|${expiresAt}`;
  const sig = crypto.createHmac('sha256', SERVER_HMAC_SECRET).update(payload).digest('hex');
  const token = `${nonce}.${sig}`;
  pendingChallenges.set(token, { uid, email: email.toLowerCase(), expiresAt });
  return token;
}

/**
 * Stage 2 -> Verify & consume the approval challenge, then mint a server-side confirmed admin session
 */
export function confirmAdminApprovalChallenge(
  challengeToken: string,
  uid: string,
  email: string
): ConfirmedAdminSession | null {
  cleanupExpiredRecords();
  if (!challengeToken || typeof challengeToken !== 'string') return null;

  const record = pendingChallenges.get(challengeToken);
  if (!record) return null;

  // Single-use: consume immediately
  pendingChallenges.delete(challengeToken);

  if (record.expiresAt <= Date.now()) return null;
  if (record.uid !== uid || record.email !== email.toLowerCase()) return null;

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  const session: ConfirmedAdminSession = {
    sessionToken,
    uid,
    email: email.toLowerCase(),
    createdAt: now,
    expiresAt: now + ADMIN_SESSION_TTL_MS,
    lastVerifiedAt: now,
  };
  confirmedSessions.set(sessionToken, session);
  return session;
}

export function getActiveConfirmedSession(
  req: express.Request,
  uid: string,
  email: string
): ConfirmedAdminSession | null {
  cleanupExpiredRecords();
  const token = extractAdminSessionToken(req);
  if (!token) return null;

  const session = confirmedSessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    confirmedSessions.delete(token);
    return null;
  }
  if (session.uid !== uid || session.email !== email.toLowerCase()) {
    return null;
  }

  session.lastVerifiedAt = Date.now();
  return session;
}

export function revokeAdminSession(req: express.Request): void {
  const token = extractAdminSessionToken(req);
  if (token) {
    confirmedSessions.delete(token);
  }
}

/**
 * Per-IP server-side rate limiting for failed admin auth attempts
 */
export function getClientIp(req: express.Request): string {
  const fwd = (req.headers['x-forwarded-for'] || '').toString().split(',')[0]?.trim();
  return fwd || req.socket?.remoteAddress || 'unknown';
}

export function checkAdminRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry) return { allowed: true, retryAfterSeconds: 0 };

  if (entry.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  if (now - entry.firstFailureAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.delete(ip);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedAdminAttempt(ip: string): void {
  const now = Date.now();
  const existing = rateLimitMap.get(ip);
  if (!existing || now - existing.firstFailureAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { failures: 1, firstFailureAt: now, lockedUntil: 0 });
    return;
  }

  existing.failures += 1;
  if (existing.failures >= RATE_LIMIT_MAX_FAILURES) {
    existing.lockedUntil = now + RATE_LIMIT_LOCKOUT_MS;
  }
}

export function clearFailedAdminAttempts(ip: string): void {
  rateLimitMap.delete(ip);
}

export interface AdminRequestVerificationResult {
  ok: boolean;
  statusCode: number;
  error?: string;
  code?: string;
  token?: VerifiedFirebaseToken;
  session?: ConfirmedAdminSession | null;
}

/**
 * Full server-side verification for administrative API requests.
 * Requires a cryptographically valid Firebase ID Token with email_verified === true
 * matching the server-only authorized owner list, AND (by default) an active server-confirmed session.
 */
export async function verifyAdminRequest(
  req: express.Request,
  options: { requireConfirmedSession?: boolean } = {}
): Promise<AdminRequestVerificationResult> {
  const requireConfirmed = options.requireConfirmedSession !== false;
  const idToken = extractBearerJwt(req);

  if (!idToken) {
    return {
      ok: false,
      statusCode: 401,
      error: 'Authentication required. A valid verified sign-in token is mandatory.',
      code: 'AUTH_TOKEN_MISSING',
    };
  }

  let decoded: VerifiedFirebaseToken;
  try {
    decoded = await verifyFirebaseIdToken(idToken);
  } catch (err: any) {
    return {
      ok: false,
      statusCode: 401,
      error: err?.message || 'Invalid or expired authentication token.',
      code: 'AUTH_TOKEN_INVALID',
    };
  }

  if (!decoded.emailVerified) {
    return {
      ok: false,
      statusCode: 403,
      error: 'Access Denied: Your email address must be verified before administrative access can be approved.',
      code: 'EMAIL_NOT_VERIFIED',
    };
  }

  if (!isAuthorizedOwnerEmail(decoded.email)) {
    return {
      ok: false,
      statusCode: 403,
      error: 'Access Denied: This account is not authorized for administrative access.',
      code: 'ADMIN_ROLE_FORBIDDEN',
    };
  }

  const activeSession = getActiveConfirmedSession(req, decoded.uid, decoded.email);
  if (requireConfirmed && !activeSession) {
    return {
      ok: false,
      statusCode: 403,
      error: 'Administrative approval confirmation is required before accessing protected resources.',
      code: 'ADMIN_CONFIRMATION_REQUIRED',
      token: decoded,
      session: null,
    };
  }

  return {
    ok: true,
    statusCode: 200,
    token: decoded,
    session: activeSession,
  };
}
