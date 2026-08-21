/**
 * Google & Firebase Authentication Lifecycle Logger Service
 * Provides detailed, color-coded, time-stamped console tracking and diagnostics
 * for Google credential verification, popup states, domain authorization, and role elevation.
 */

export interface AuthLogEntry {
  timestamp: string;
  phase: string;
  step: number;
  message: string;
  data?: any;
  status: 'info' | 'success' | 'warn' | 'error' | 'pending';
  durationMs?: number;
}

class AuthLoggerService {
  private startTime: number = 0;
  private stepCounter: number = 0;
  private logHistory: AuthLogEntry[] = [];
  private isEnabled: boolean = true;

  private styles = {
    badge: 'background: #012d1d; color: #fed65b; font-weight: bold; padding: 2px 8px; border-radius: 4px;',
    phase: 'background: #1e3a8a; color: #93c5fd; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    success: 'background: #065f46; color: #6ee7b7; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    warn: 'background: #78350f; color: #fde68a; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    error: 'background: #881337; color: #fecdd3; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
    timestamp: 'color: #94a3b8; font-family: monospace; font-size: 11px;',
    data: 'color: #38bdf8; font-family: monospace;',
    timing: 'background: #312e81; color: #c7d2fe; padding: 1px 5px; border-radius: 3px; font-weight: bold;'
  };

  /**
   * Start tracking a new authentication session
   */
  startSession(authMethod: string = 'Google Sign-In'): void {
    this.startTime = performance.now();
    this.stepCounter = 1;
    this.logHistory = [];

    console.group(`%c🔒 [AUTH-LIFECYCLE] Initializing ${authMethod} Session`, this.styles.badge);
    
    this.log({
      phase: 'SESSION_START',
      step: this.stepCounter++,
      message: `New authentication sequence initiated for [${authMethod}]`,
      data: {
        method: authMethod,
        initiatedAt: new Date().toISOString(),
        url: window.location.href,
        inIframe: window.self !== window.top,
        protocol: window.location.protocol,
        hostname: window.location.hostname
      },
      status: 'info'
    });

    this.checkEnvironment();
  }

  /**
   * Run environment and sandbox diagnostics
   */
  checkEnvironment(): void {
    const isIframe = window.self !== window.top;
    const isHttps = window.location.protocol === 'https:';
    const isCookiesEnabled = navigator.cookieEnabled;
    const isLocalStorageAvailable = typeof localStorage !== 'undefined';

    const envDiagnostic = {
      isIframe,
      isHttps,
      isCookiesEnabled,
      isLocalStorageAvailable,
      origin: window.location.origin,
      referrer: document.referrer || 'None',
      userAgent: navigator.userAgent
    };

    if (isIframe) {
      this.log({
        phase: 'ENV_DIAGNOSTIC',
        step: this.stepCounter++,
        message: '⚠️ App is running inside an IFRAME container. Popup windows or third-party cookies may be restricted by browser sandbox policies.',
        data: envDiagnostic,
        status: 'warn'
      });
    } else {
      this.log({
        phase: 'ENV_DIAGNOSTIC',
        step: this.stepCounter++,
        message: '✅ Environment check passed: Running in standalone top-level window context.',
        data: envDiagnostic,
        status: 'success'
      });
    }
  }

  /**
   * Log Google Auth Provider configuration and parameters
   */
  logProviderConfig(providerName: string, customParams: Record<string, any>, scopes: string[]): void {
    this.log({
      phase: 'PROVIDER_SETUP',
      step: this.stepCounter++,
      message: `Configured OAuth Provider: ${providerName}`,
      data: {
        provider: providerName,
        customParameters: customParams,
        scopes: scopes.length > 0 ? scopes : ['email (standard)', 'profile (standard)', 'openid (standard)'],
        promptPolicy: customParams.prompt || 'default'
      },
      status: 'info'
    });
  }

  /**
   * Log initiation of popup dispatch
   */
  logPopupLaunch(): void {
    this.log({
      phase: 'POPUP_DISPATCH',
      step: this.stepCounter++,
      message: '🚀 Dispatching signInWithPopup() — Waiting for Google credential handoff...',
      data: {
        waitingForUserInteraction: true,
        dispatchedAtMs: Math.round(performance.now() - this.startTime)
      },
      status: 'pending'
    });
  }

  /**
   * Log successful retrieval of Firebase UserCredential from Google
   */
  logPopupSuccess(userCredential: any): void {
    const user = userCredential?.user || userCredential;
    const elapsed = Math.round(performance.now() - this.startTime);

    this.log({
      phase: 'CREDENTIAL_RECEIVED',
      step: this.stepCounter++,
      message: `🎉 Google credential verified successfully in ${elapsed}ms`,
      durationMs: elapsed,
      data: {
        uid: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified,
        displayName: user?.displayName,
        photoURL: user?.photoURL ? 'Available (Photo loaded)' : 'None',
        providerId: user?.providerId || 'google.com',
        creationTime: user?.metadata?.creationTime,
        lastSignInTime: user?.metadata?.lastSignInTime
      },
      status: 'success'
    });
  }

  /**
   * Log privilege & role evaluation (Checking against ADMIN_EMAILS & Firestore)
   */
  logPrivilegeCheck(email: string, isWhitelistedAdmin: boolean, isFirestoreAdminDoc: boolean): void {
    const role = isWhitelistedAdmin || isFirestoreAdminDoc ? 'superadmin' : 'customer';
    
    this.log({
      phase: 'ROLE_EVALUATION',
      step: this.stepCounter++,
      message: `Account role evaluated: [${role.toUpperCase()}] for ${email}`,
      data: {
        email,
        isMasterAdminEmail: isWhitelistedAdmin,
        isFirestoreAdminDoc,
        assignedRole: role,
        permissionLevel: role === 'superadmin' ? 'FULL_MASTER_ACCESS' : 'STANDARD_CUSTOMER'
      },
      status: role === 'superadmin' ? 'success' : 'info'
    });
  }

  /**
   * Log user context & local storage session persistence
   */
  logSessionHydration(email: string, role: string, isPersisted: boolean): void {
    this.log({
      phase: 'SESSION_HYDRATION',
      step: this.stepCounter++,
      message: `Session state hydrated into React Context and Storage for ${email}`,
      data: {
        email,
        role,
        localStorageSynced: isPersisted,
        sessionStorageSynced: isPersisted,
        isAdminContextActive: role === 'superadmin'
      },
      status: 'success'
    });
  }

  /**
   * Log error details with comprehensive failure diagnostics
   */
  logError(error: any, contextNote: string = 'Google Authentication'): void {
    const elapsed = Math.round(performance.now() - this.startTime);
    const code = error?.code || 'unknown-error';
    const message = error?.message || String(error);
    const lower = `${code} ${message}`.toLowerCase();

    // Ignore third-party wallet extension injection errors and non-app noise
    if (
      lower.includes('metamask') ||
      lower.includes('ethereum') ||
      lower.includes('web3') ||
      lower.includes('wallet') ||
      lower.includes('phantom') ||
      lower.includes('solana') ||
      lower.includes('coinbase') ||
      lower.includes('chrome-extension') ||
      lower.includes('extension context')
    ) {
      return;
    }

    let diagnosticAdvice = 'Check your network connection and retry.';
    if (code === 'auth/popup-blocked') {
      diagnosticAdvice = 'Browser popup blocker or iframe sandbox blocked the Google Sign-in window. Suggest opening in a new dedicated tab or using 1-Click Owner Auth.';
    } else if (code === 'auth/popup-closed-by-user') {
      diagnosticAdvice = 'The Google login window was closed before completing verification. Ensure popups are allowed and try clicking Continue with Google again.';
    } else if (code === 'auth/unauthorized-domain') {
      diagnosticAdvice = 'This preview domain is not listed in Firebase Console > Authentication > Settings > Authorized Domains. Add this domain in Firebase Console or use 1-Click Master Access.';
    } else if (code === 'auth/cancelled-popup-request') {
      diagnosticAdvice = 'Multiple popup requests were initiated in rapid succession. Previous pending request was aborted.';
    } else if (code === 'auth/network-request-failed') {
      diagnosticAdvice = 'Network connection interrupted or timeout reaching Google Auth endpoints.';
    }

    this.log({
      phase: 'AUTH_ERROR',
      step: this.stepCounter++,
      message: `❌ ${contextNote} failed with code [${code}]: ${message}`,
      durationMs: elapsed,
      data: {
        errorCode: code,
        errorMessage: message,
        stack: error?.stack,
        diagnosticAdvice,
        suggestedFix: diagnosticAdvice
      },
      status: 'error'
    });

    console.warn(
      `%c[AUTH-DIAGNOSTIC] ${code}: ${diagnosticAdvice}`,
      'background: #450a0a; color: #f87171; font-weight: bold; padding: 4px 8px; border-radius: 4px;'
    );
  }

  /**
   * Finalize the authentication session and log summary metrics
   */
  endSession(status: 'success' | 'failed' | 'fallback_used', summaryNote?: string): void {
    const totalDuration = Math.round(performance.now() - this.startTime);
    
    this.log({
      phase: 'SESSION_COMPLETE',
      step: this.stepCounter++,
      message: `Authentication lifecycle concluded with status [${status.toUpperCase()}] in ${totalDuration}ms. ${summaryNote || ''}`,
      durationMs: totalDuration,
      status: status === 'success' || status === 'fallback_used' ? 'success' : 'error'
    });

    console.table(
      this.logHistory.map(entry => ({
        Step: entry.step,
        Phase: entry.phase,
        Status: entry.status,
        Message: entry.message,
        'Duration (ms)': entry.durationMs !== undefined ? `${entry.durationMs}ms` : '-'
      }))
    );

    console.groupEnd();
  }

  /**
   * Internal logger router
   */
  private log(entry: Omit<AuthLogEntry, 'timestamp'>): void {
    const timestamp = new Date().toLocaleTimeString();
    const fullEntry: AuthLogEntry = { ...entry, timestamp };
    this.logHistory.push(fullEntry);

    if (!this.isEnabled) return;

    const statusStyle = 
      entry.status === 'success' ? this.styles.success :
      entry.status === 'warn' ? this.styles.warn :
      entry.status === 'error' ? this.styles.error :
      this.styles.phase;

    const prefix = `[Step ${entry.step}] [${entry.phase}]`;
    
    if (entry.status === 'error') {
      console.error(
        `%c${timestamp}%c %c${prefix}%c ${entry.message}`,
        this.styles.timestamp,
        '',
        statusStyle,
        '',
        entry.data || ''
      );
    } else if (entry.status === 'warn') {
      console.warn(
        `%c${timestamp}%c %c${prefix}%c ${entry.message}`,
        this.styles.timestamp,
        '',
        statusStyle,
        '',
        entry.data || ''
      );
    } else {
      console.log(
        `%c${timestamp}%c %c${prefix}%c ${entry.message}`,
        this.styles.timestamp,
        '',
        statusStyle,
        '',
        entry.data || ''
      );
    }
  }

  /**
   * Retrieve all captured auth lifecycle logs
   */
  getHistory(): AuthLogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear captured logs
   */
  clearHistory(): void {
    this.logHistory = [];
  }
}

export const authLogger = new AuthLoggerService();
