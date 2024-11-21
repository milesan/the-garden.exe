import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Timezone': 'Europe/Lisbon'
    },
    fetch: (url, options = {}) => {
      return fetch(url, {
        ...options,
        // Add retry logic
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }).catch(async error => {
        console.warn('Fetch failed, retrying...', error);
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetch(url, options);
      });
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});