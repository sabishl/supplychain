import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabasePublicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
  || '';

const isValidUrl = (str) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const finalUrl = isValidUrl(supabaseUrl) ? supabaseUrl : 'https://placeholder-project-url.supabase.co';
const finalKey = supabasePublicKey || 'placeholder-publishable-key';

export const isSupabaseConfigured = 
  isValidUrl(supabaseUrl) && 
  supabasePublicKey &&
  !supabaseUrl.includes('your_supabase_project_url_here') &&
  !supabasePublicKey.includes('your_publishable_key') &&
  !supabasePublicKey.includes('your_legacy_anon_key');

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase URL or publishable key is missing or invalid in your .env file.\n' +
    'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY correctly.\n' +
    'Operations requiring database or storage access will fail.'
  );
}

export const supabase = createClient(finalUrl, finalKey);
