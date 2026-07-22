// supabase.ts — client Supabase. Dégrade proprement : si les variables d'env ne
// sont pas configurées, `supabase` est null et le jeu tourne 100% local.
//
// Sécurité (CLAUDE.md) : seule la clé ANON publique côté client. Jamais de secret.

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** True seulement si l'URL et la clé anon sont fournies via l'env. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/** Client Supabase, ou null si non configuré (mode local pur). */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
