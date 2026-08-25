import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://yarbuasdzujbtrwcfdwb.supabase.co';
const defaultSupabaseAnonKey = 'sb_publishable_TKF3pz5CdryPzu7v_YQ9sA_0A6d5x_E';

const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL)
  ? String(import.meta.env.VITE_SUPABASE_URL).trim()
  : '';

const rawKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY)
  ? String(import.meta.env.VITE_SUPABASE_ANON_KEY).trim()
  : '';

const supabaseUrl = (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')))
  ? rawUrl
  : defaultSupabaseUrl;

const supabaseAnonKey = rawKey || defaultSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Discovered table names cache
let resolvedOrderTable: string = 'Order';
let resolvedCustomerTable: string = 'Customer';

/**
 * Execute a query with automatic fallback between capitalized ('Order') and lowercase ('orders') table names
 */
export async function queryOrderTable<T = any>(
  executor: (tableName: string) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const primaryTable = resolvedOrderTable;
  const secondaryTable = primaryTable === 'Order' ? 'orders' : 'Order';

  const res1 = await executor(primaryTable);
  if (res1.error && (res1.error.code === 'PGRST205' || res1.error.message?.includes('Could not find the table'))) {
    console.warn(`Table "${primaryTable}" not found. Retrying with "${secondaryTable}"...`);
    const res2 = await executor(secondaryTable);
    if (!res2.error) {
      resolvedOrderTable = secondaryTable;
    }
    return res2;
  }
  return res1;
}

/**
 * Execute a query with automatic fallback between 'Customer' and 'customers' table names
 */
export async function queryCustomerTable<T = any>(
  executor: (tableName: string) => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const primaryTable = resolvedCustomerTable;
  const secondaryTable = primaryTable === 'Customer' ? 'customers' : 'Customer';

  const res1 = await executor(primaryTable);
  if (res1.error && (res1.error.code === 'PGRST205' || res1.error.message?.includes('Could not find the table'))) {
    console.warn(`Table "${primaryTable}" not found. Retrying with "${secondaryTable}"...`);
    const res2 = await executor(secondaryTable);
    if (!res2.error) {
      resolvedCustomerTable = secondaryTable;
    }
    return res2;
  }
  return res1;
}

