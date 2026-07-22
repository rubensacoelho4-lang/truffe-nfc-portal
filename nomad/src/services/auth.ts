// auth.ts — auth Supabase sans friction (anonyme). Un idle n'a pas besoin de
// login : on crée une session anonyme pour le cloud save, upgradable plus tard.

import { supabase } from './supabase';

/**
 * Garantit une session (anonyme si besoin) et retourne l'user id, ou null si
 * Supabase n'est pas configuré / l'auth échoue.
 */
export async function ensureAuth(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user) return sessionData.session.user.id;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('[Nomad] Auth anonyme échouée', error);
      return null;
    }
    return data.user?.id ?? null;
  } catch (e) {
    console.warn('[Nomad] Auth indisponible', e);
    return null;
  }
}

/** User id courant sans forcer de connexion, ou null. */
export async function getUserId(): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch (e) {
    console.warn('[Nomad] getUserId échoué', e);
    return null;
  }
}

/** Définit / met à jour le pseudo public du joueur (profiles). Code 23505 = déjà pris. */
export async function setUsername(username: string): Promise<'ok' | 'taken' | 'error'> {
  if (!supabase) return 'error';
  try {
    const uid = await ensureAuth();
    if (!uid) return 'error';
    const { error } = await supabase.from('profiles').upsert({ id: uid, username });
    if (error) {
      if (error.code === '23505') return 'taken';
      console.warn('[Nomad] setUsername échoué', error);
      return 'error';
    }
    return 'ok';
  } catch (e) {
    console.warn('[Nomad] setUsername exception', e);
    return 'error';
  }
}
