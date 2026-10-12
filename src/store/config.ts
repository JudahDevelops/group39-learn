/**
 * Which store the app uses. SupabaseStore needs both variables; with either one missing the app
 * runs on LocalStore, which accepts any password and keeps data in this browser only.
 * Vite inlines VITE_* values at build time, so these are set in .env.local and in Vercel
 * (docs/supabase-setup.md), never in the code.
 */
const env = import.meta.env as unknown as Record<string, string | undefined>;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function supabaseConfig(): SupabaseConfig | null {
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();
  if (url && anonKey) return { url, anonKey };
  if (url || anonKey) {
    console.warn(
      'Only one of VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY is set, so the app is using local dev mode.',
    );
  }
  return null;
}

/** True when sign-in goes to Supabase; false in local dev mode. */
export function isSupabaseConfigured(): boolean {
  return supabaseConfig() !== null;
}
