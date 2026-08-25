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

