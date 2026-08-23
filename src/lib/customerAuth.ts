import { UserProfile, Address } from '../types';
import { LocalAuthManager, CustomerAccount, AuthResponse } from '../services/LocalAuthManager';

export type { CustomerAccount, AuthResponse };
export { LocalAuthManager };

export function getSavedCustomerAccounts(): CustomerAccount[] {
  return LocalAuthManager.getAccounts();
}

export function saveCustomerAccounts(accounts: CustomerAccount[]): void {
  LocalAuthManager.saveAccounts(accounts);
}

export function getCurrentCustomerSession(): UserProfile | null {
  return LocalAuthManager.getCurrentUser();
}

export function saveCustomerSession(profile: UserProfile): void {
  LocalAuthManager.setSession(profile);
}

export function clearCustomerSession(): void {
  LocalAuthManager.clearSession();
}

export function registerCustomer(params: {
  name: string;
  emailOrPhone: string;
  password?: string;
}): AuthResponse {
  return LocalAuthManager.register(params);
}

export function loginCustomer(params: {
  emailOrPhone: string;
  password?: string;
}): AuthResponse {
  return LocalAuthManager.login(params);
}
