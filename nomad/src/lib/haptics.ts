// haptics.ts — retour tactile fire-and-forget (§5 du skill terrain).
// Exception CLAUDE.md : le catch {} vide est OK ici (fire-and-forget intentionnel).

import * as Haptics from 'expo-haptics';

export function tapLight() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
}

export function tapMedium() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
}

export function tapHeavy() {
  try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
}

export function selectionTick() {
  try { Haptics.selectionAsync(); } catch {}
}

export function notifySuccess() {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
}

export function notifyWarning() {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch {}
}

export function notifyError() {
  try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); } catch {}
}

/** Séquence de célébration (voyage réussi, gros palier). */
export async function celebrate() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((r) => setTimeout(r, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((r) => setTimeout(r, 80));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise((r) => setTimeout(r, 100));
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}
