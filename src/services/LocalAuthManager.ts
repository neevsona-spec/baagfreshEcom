import { UserProfile, Address } from '../types';

export interface CustomerAccount {
  id: string;
  name: string;
  emailOrPhone: string;
  email?: string;
  phone?: string;
  pinOrPassword?: string;
  avatar: string;
  memberSince: string;
  addresses: Address[];
  is2FAEnabled: boolean;
  e2eEncryptionKeyFingerprint: string;
  cloudSyncEnabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  message?: string;
}

const STORAGE_KEYS = {
  ACCOUNTS: 'baagfresh_users',
  SESSION: 'baagfresh_current_user',
  SETTINGS: 'baagfresh_customer_settings',
};

const DEFAULT_SEEDED_ACCOUNT: CustomerAccount = {
  id: 'usr-patron-01',
  name: 'Neev Sona',
  emailOrPhone: 'neevsona@gmail.com',
  email: 'neevsona@gmail.com',
  phone: '+91 87076 71319',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  memberSince: 'October 2024',
  addresses: [
    {
      id: 'addr-1',
      type: 'Home',
      fullName: 'Neev Sona',
      phone: '+91 87076 71319',
      street: '42 Assi Ghat Road, Bhelupur',
      apartment: 'House #4B, Gangotri Villa',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      pincode: '221005',
      isDefault: true,
    },
    {
      id: 'addr-2',
      type: 'Work',
      fullName: 'Anil kumar Keshari (Central Hub)',
      phone: '+91 87076 71319',
      street: 'Plot 18, Ring Road IT Hub, Shivpur',
      apartment: 'Suite 302',
      city: 'Varanasi',
      state: 'Uttar Pradesh',
      pincode: '221003',
      isDefault: false,
    }
  ],
  is2FAEnabled: false,
  e2eEncryptionKeyFingerprint: 'BF-LOCAL-94A8-11FE',
  cloudSyncEnabled: true,
  createdAt: new Date().toISOString(),
};

/**
 * LocalAuthManager
 * Independent customer authentication service using browser localStorage.
 * Completely decoupled from Firebase, ensuring instantaneous, barrier-free sign-up, sign-in,
 * profile updating, and address management for store patrons.
 */
export class LocalAuthManagerService {
  private static instance: LocalAuthManagerService;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): LocalAuthManagerService {
    if (!LocalAuthManagerService.instance) {
      LocalAuthManagerService.instance = new LocalAuthManagerService();
    }
    return LocalAuthManagerService.instance;
  }

  /**
   * Seed default account if storage is pristine
   */
  private ensureInitialized(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify([DEFAULT_SEEDED_ACCOUNT]));
      }
    } catch (e) {
      console.warn('LocalAuthManager: storage init error', e);
    }
  }

  /**
   * Get all registered accounts from localStorage
   */
  public getAccounts(): CustomerAccount[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('LocalAuthManager: Failed to read accounts', err);
    }
    return [DEFAULT_SEEDED_ACCOUNT];
  }

  /**
   * Save accounts list to localStorage
   */
  public saveAccounts(accounts: CustomerAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (err) {
      console.error('LocalAuthManager: Failed to write accounts', err);
    }
  }

  /**
   * Get the current active session
   */
  public getCurrentUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.id) {
          return parsed as UserProfile;
        }
      }
    } catch (err) {
      console.warn('LocalAuthManager: Failed to read session', err);
    }
    return null;
  }

  /**
   * Check if a customer is currently logged in
   */
  public isLoggedIn(): boolean {
    const user = this.getCurrentUser();
    return Boolean(user && user.id && user.id !== 'usr-guest-00' && user.email);
  }

  /**
   * Set active customer session
   */
  public setSession(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(profile));
    } catch (err) {
      console.error('LocalAuthManager: Failed to save session', err);
    }
  }

  /**
   * Clear active customer session (Sign Out)
   */
  public clearSession(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (err) {
      console.warn('LocalAuthManager: Failed to clear session', err);
    }
  }

  /**
   * Register a new customer
   */
  public register(params: {
    name: string;
    emailOrPhone: string;
    password?: string;
  }): AuthResponse {
    const cleanName = params.name.trim();
    const cleanContact = params.emailOrPhone.trim().toLowerCase();
    const cleanPass = params.password?.trim();

    if (!cleanName) {
      return { success: false, message: 'Please enter your name.' };
    }
    if (!cleanContact) {
      return { success: false, message: 'Please enter your mobile number or email.' };
    }

    const accounts = this.getAccounts();
    const existing = accounts.find(
      (a) =>
        a.emailOrPhone.toLowerCase() === cleanContact ||
        (a.email && a.email.toLowerCase() === cleanContact) ||
        (a.phone && a.phone.replace(/\D/g, '') === cleanContact.replace(/\D/g, ''))
    );

    if (existing) {
      return {
        success: false,
        message: 'An account with this email or mobile number already exists. Please sign in directly.',
      };
    }

    const isEmail = cleanContact.includes('@');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const now = new Date();
    const memberSince = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    const newAccount: CustomerAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      emailOrPhone: cleanContact,
      email: isEmail ? cleanContact : `${cleanContact}@baagfresh.in`,
      phone: !isEmail ? cleanContact : '+91 87076 71319',
      pinOrPassword: cleanPass || '',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      memberSince,
      addresses: [],
      is2FAEnabled: false,
      e2eEncryptionKeyFingerprint: `BF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
      cloudSyncEnabled: true,
      createdAt: now.toISOString(),
      lastLoginAt: now.toISOString(),
    };

    const updatedAccounts = [newAccount, ...accounts];
    this.saveAccounts(updatedAccounts);

    const profile: UserProfile = {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email || cleanContact,
      phone: newAccount.phone || '',
      avatar: newAccount.avatar,
      memberSince: newAccount.memberSince,
      addresses: newAccount.addresses,
      is2FAEnabled: false,
      e2eEncryptionKeyFingerprint: newAccount.e2eEncryptionKeyFingerprint,
      cloudSyncEnabled: true,
    };

    this.setSession(profile);
    return { success: true, user: profile };
  }

  /**
   * Sign in customer with email or phone + optional PIN/password
   */
  public login(params: {
    emailOrPhone: string;
    password?: string;
  }): AuthResponse {
    const cleanContact = params.emailOrPhone.trim().toLowerCase();
    const cleanPass = params.password?.trim();

    if (!cleanContact) {
      return { success: false, message: 'Please enter your mobile number or email.' };
    }

    const accounts = this.getAccounts();
    const found = accounts.find(
      (a) =>
        a.emailOrPhone.toLowerCase() === cleanContact ||
        (a.email && a.email.toLowerCase() === cleanContact) ||
        (a.phone && a.phone.replace(/\D/g, '') === cleanContact.replace(/\D/g, ''))
    );

    const now = new Date();

    if (!found) {
      // Auto-create customer account on the fly for frictionless checkout/login
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const isEmail = cleanContact.includes('@');
      const derivedName = isEmail ? cleanContact.split('@')[0] : 'Royal Patron';

      const autoAccount: CustomerAccount = {
        id: `usr-${Date.now()}`,
        name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
        emailOrPhone: cleanContact,
        email: isEmail ? cleanContact : `${cleanContact}@baagfresh.in`,
        phone: !isEmail ? cleanContact : '+91 87076 71319',
        pinOrPassword: cleanPass || '',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        memberSince: `${monthNames[now.getMonth()]} ${now.getFullYear()}`,
        addresses: [],
        is2FAEnabled: false,
        e2eEncryptionKeyFingerprint: `BF-QUICK-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        cloudSyncEnabled: true,
        createdAt: now.toISOString(),
        lastLoginAt: now.toISOString(),
      };

      this.saveAccounts([autoAccount, ...accounts]);

      const profile: UserProfile = {
        id: autoAccount.id,
        name: autoAccount.name,
        email: autoAccount.email || cleanContact,
        phone: autoAccount.phone || '',
        avatar: autoAccount.avatar,
        memberSince: autoAccount.memberSince,
        addresses: autoAccount.addresses,
        is2FAEnabled: false,
        e2eEncryptionKeyFingerprint: autoAccount.e2eEncryptionKeyFingerprint,
        cloudSyncEnabled: true,
      };

      this.setSession(profile);
      return { success: true, user: profile };
    }

    // Verify PIN / Password if one was previously configured
    if (found.pinOrPassword && cleanPass && found.pinOrPassword !== cleanPass) {
      return { success: false, message: 'Incorrect PIN or password for this account.' };
    }

    // Update last login
    found.lastLoginAt = now.toISOString();
    this.saveAccounts(accounts);

    const profile: UserProfile = {
      id: found.id,
      name: found.name,
      email: found.email || found.emailOrPhone,
      phone: found.phone || '',
      avatar: found.avatar,
      memberSince: found.memberSince,
      addresses: found.addresses || [],
      is2FAEnabled: found.is2FAEnabled || false,
      e2eEncryptionKeyFingerprint: found.e2eEncryptionKeyFingerprint,
      cloudSyncEnabled: found.cloudSyncEnabled ?? true,
    };

    this.setSession(profile);
    return { success: true, user: profile };
  }

  /**
   * Update active user profile and persist changes to accounts list
   */
  public updateProfile(updates: Partial<UserProfile>): UserProfile | null {
    const current = this.getCurrentUser();
    if (!current) return null;

    const updated: UserProfile = {
      ...current,
      ...updates,
    };

    this.setSession(updated);

    const accounts = this.getAccounts();
    const idx = accounts.findIndex((a) => a.id === updated.id);
    if (idx !== -1) {
      accounts[idx] = {
        ...accounts[idx],
        name: updated.name || accounts[idx].name,
        email: updated.email || accounts[idx].email,
        phone: updated.phone || accounts[idx].phone,
        avatar: updated.avatar || accounts[idx].avatar,
        addresses: updated.addresses || accounts[idx].addresses,
      };
      this.saveAccounts(accounts);
    }

    return updated;
  }
}

export const LocalAuthManager = LocalAuthManagerService.getInstance();
