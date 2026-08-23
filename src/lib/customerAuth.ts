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
}

const CUSTOMER_ACCOUNTS_KEY = 'baagfresh_customer_accounts';
const CURRENT_CUSTOMER_SESSION_KEY = 'baagfresh_customer_session';

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
 * Retrieve all registered customer accounts from local storage
 */
export function getSavedCustomerAccounts(): CustomerAccount[] {
  try {
    const raw = localStorage.getItem(CUSTOMER_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not read customer accounts:', err);
  }
  return [DEFAULT_SEEDED_ACCOUNT];
}

/**
 * Persist customer accounts to local storage
 */
export function saveCustomerAccounts(accounts: CustomerAccount[]): void {
  try {
    localStorage.setItem(CUSTOMER_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.warn('Could not save customer accounts:', err);
  }
}

/**
 * Retrieve currently logged in customer profile
 */
export function getCurrentCustomerSession(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_CUSTOMER_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        return parsed as UserProfile;
      }
    }
  } catch (err) {
    console.warn('Could not load current customer session:', err);
  }
  return null;
}

/**
 * Save active customer session
 */
export function saveCustomerSession(profile: UserProfile): void {
  try {
    localStorage.setItem(CURRENT_CUSTOMER_SESSION_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Could not save customer session:', err);
  }
}

/**
 * Clear customer session on sign-out
 */
export function clearCustomerSession(): void {
  try {
    localStorage.removeItem(CURRENT_CUSTOMER_SESSION_KEY);
  } catch (err) {
    console.warn('Could not clear customer session:', err);
  }
}

/**
 * Register a new customer without Firebase requirements
 */
export function registerCustomer(params: {
  name: string;
  emailOrPhone: string;
  password?: string;
}): { success: boolean; user?: UserProfile; message?: string } {
  const cleanName = params.name.trim();
  const cleanContact = params.emailOrPhone.trim().toLowerCase();
  const cleanPass = params.password?.trim();

  if (!cleanName) {
    return { success: false, message: 'Please provide your name.' };
  }
  if (!cleanContact) {
    return { success: false, message: 'Please provide your email address or mobile number.' };
  }

  const accounts = getSavedCustomerAccounts();
  const existing = accounts.find(
    (a) => a.emailOrPhone.toLowerCase() === cleanContact ||
           (a.email && a.email.toLowerCase() === cleanContact) ||
           (a.phone && a.phone.replace(/\D/g, '') === cleanContact.replace(/\D/g, ''))
  );

  if (existing) {
    return {
      success: false,
      message: 'An account with this email or mobile number already exists. Please sign in directly.'
    };
  }

  const isEmail = cleanContact.includes('@');
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const now = new Date();
  const memberSince = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  const newAccount: CustomerAccount = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: cleanName,
    emailOrPhone: cleanContact,
    email: isEmail ? cleanContact : `${cleanContact}@baagfresh.in`,
    phone: !isEmail ? cleanContact : '+91 87076 71319',
    pinOrPassword: cleanPass || '',
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80`,
    memberSince,
    addresses: [],
    is2FAEnabled: false,
    e2eEncryptionKeyFingerprint: `BF-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`,
    cloudSyncEnabled: true,
    createdAt: now.toISOString(),
  };

  const updatedAccounts = [newAccount, ...accounts];
  saveCustomerAccounts(updatedAccounts);

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

  saveCustomerSession(profile);

  return { success: true, user: profile };
}

/**
 * Sign in customer using name/email/phone + optional PIN/Password
 */
export function loginCustomer(params: {
  emailOrPhone: string;
  password?: string;
}): { success: boolean; user?: UserProfile; message?: string } {
  const cleanContact = params.emailOrPhone.trim().toLowerCase();
  const cleanPass = params.password?.trim();

  if (!cleanContact) {
    return { success: false, message: 'Please provide your email address or mobile number.' };
  }

  const accounts = getSavedCustomerAccounts();
  const found = accounts.find(
    (a) => a.emailOrPhone.toLowerCase() === cleanContact ||
           (a.email && a.email.toLowerCase() === cleanContact) ||
           (a.phone && a.phone.replace(/\D/g, '') === cleanContact.replace(/\D/g, ''))
  );

  if (!found) {
    // If not found, allow automatic quick creation or inform user
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
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
    };

    saveCustomerAccounts([autoAccount, ...accounts]);
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
    saveCustomerSession(profile);
    return { success: true, user: profile };
  }

  // If found and password was set previously
  if (found.pinOrPassword && cleanPass && found.pinOrPassword !== cleanPass) {
    return { success: false, message: 'Incorrect PIN or password for this account.' };
  }

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

  saveCustomerSession(profile);
  return { success: true, user: profile };
}
