import { createClient } from '@supabase/supabase-js';

// NOTE: This client-side client uses the public 'anon' key. 
// For sensitive database operations, we use API routes in server.ts
// to maintain full-stack security as per project guidelines.

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://yarbuasdzujbtrwcfdwb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_TKF3pz5CdryPzu7v_YQ9sA_0A6d5x_E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
