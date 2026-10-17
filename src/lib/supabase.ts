import { createClient } from '@supabase/supabase-js';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(configuredUrl && configuredAnonKey);
export const supabaseUrl = configuredUrl || 'https://placeholder.supabase.co';
export const supabaseAnonKey = configuredAnonKey || 'preview-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
