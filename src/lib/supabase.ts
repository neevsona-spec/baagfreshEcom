import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://yarbuasdzujbtrwcfdwb.supabase.co';
const defaultSupabaseAnonKey = 'sb_publishable_TKF3pz5CdryPzu7vd0oKlg_RHOjOhHO';

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
  ? String(import.meta.env.VITE_SUPABASE_URL).trim()
  : '';

const rawKey = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY))
  ? String(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY).trim()
  : '';

const supabaseUrl = (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')))
  ? rawUrl
  : defaultSupabaseUrl;

const supabaseAnonKey = rawKey || defaultSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const ADMIN_EMAILS = [
  'neevsona@gmail.com',
  'admin@baagfresh.in',
  'admin@baagfresh.com',
  'maan1986@gmail.com'
];

let resolvedOrderTable: string = 'Order';
export const getResolvedOrderTable = () => resolvedOrderTable;
let resolvedCustomerTable: string = 'Customer';

/**
 * Execute a query with automatic fallback between capitalized ('Order') and lowercase ('orders') table names
 */
export async function queryOrderTable<T = any>(
  executor: (tableName: string) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const possibleTables = ['Order', 'orders', 'Orders', 'OrderDetails'];
  
  let lastRes: { data: T | null; error: any } = { data: null, error: null };
  
  for (const tableName of possibleTables) {
    const res = await executor(tableName);
    if (!res.error) {
      resolvedOrderTable = tableName;
      return res;
    }
    lastRes = res;
    console.warn(`Table "${tableName}" check failed:`, res.error.message);
  }
  
  return lastRes;
}

/**
 * Execute a query with automatic fallback between 'Customer' and 'customers' table names
 */
export async function queryCustomerTable<T = any>(
  executor: (tableName: string) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const possibleTables = ['Customer', 'customers', 'Customers'];
  
  let lastRes: { data: T | null; error: any } = { data: null, error: null };
  
  for (const tableName of possibleTables) {
    const res = await executor(tableName);
    if (!res.error) {
      resolvedCustomerTable = tableName;
      return res;
    }
    lastRes = res;
    console.warn(`Table "${tableName}" check failed:`, res.error.message);
  }
  
  return lastRes;
}

/**
 * Safe Response Parser Helper
 * Prevents "Unexpected end of JSON input" errors by defensively reading text before parsing.
 */
async function safeFetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const rawText = await response.text();
  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(`Server returned invalid response (Status ${response.status})`);
  }

  if (!response.ok || (data && data.success === false)) {
    const errMsg = data?.error || data?.message || `Request failed (HTTP ${response.status})`;
    throw new Error(errMsg);
  }

  return data;
}

/**
 * Server-Side Proxy API Client for Secure Supabase Transactions
 * Bypasses public browser RLS restrictions securely through authenticated backend routes.
 */
export async function apiCreateOrder(orderPayload: any): Promise<any> {
  const data = await safeFetchJson<{ success: boolean; order: any }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  });

  return data.order;
}

export async function apiFetchOrders(params?: { phone?: string; adminEmail?: string; orderId?: string }): Promise<any[]> {
  const url = new URL('/api/orders', window.location.origin);
  if (params?.phone) url.searchParams.set('phone', params.phone);
  if (params?.orderId) url.searchParams.set('orderId', params.orderId);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (params?.adminEmail) {
    headers['x-admin-email'] = params.adminEmail;
    headers['Authorization'] = `Bearer ${params.adminEmail}`;
  }

  if (params?.phone) {
    headers['x-user-phone'] = params.phone;
  }

  const data = await safeFetchJson<{ success: boolean; order?: any; orders?: any[] }>(url.toString(), {
    method: 'GET',
    headers,
  });

  if (data.order) {
    return [data.order];
  }

  return data.orders || [];
}

export async function apiUpdateOrderStatus(orderId: string, status: string, customNote?: string): Promise<any> {
  const data = await safeFetchJson<{ success: boolean; order: any }>(`/api/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note: customNote }),
  });

  return data.order;
}

export async function apiCustomerAuth(params: { phone?: string; identifier?: string; name?: string; email?: string; address?: any }): Promise<{ customer: any; orders: any[]; user?: any }> {
  const data = await safeFetchJson<{ success: boolean; customer: any; orders?: any[]; user?: any }>('/api/customer/auth', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return { customer: data.customer, orders: data.orders || [], user: data.user };
}

export async function apiRegisterCustomer(params: {
  name: string;
  identifier?: string;
  emailOrPhone?: string;
  phone?: string;
  email?: string;
  pin?: string;
  password?: string;
  address?: any;
}): Promise<{ success: boolean; user: any; customer: any; message?: string }> {
  const data = await safeFetchJson<{ success: boolean; user: any; customer: any; message?: string }>('/api/register', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return data;
}


