// format.ts — formatage des grands nombres (le cœur visuel d'un idle).
// Pur TS. 1234 → "1.23K", 4.5e6 → "4.50M", etc.

// Suffixes courts standard du genre idle (K, M, B, T, puis aa, ab, ...).
const SHORT_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

/**
 * Formate un montant d'argent pour l'affichage.
 *  - < 1000 : entier ("742")
 *  - >= 1000 : 3 chiffres significatifs + suffixe ("1.23K", "45.6M")
 *  - très grand : notation "aa/ab" au-delà de la table de suffixes.
 */
export function formatMoney(n: number): string {
  if (!isFinite(n)) return '∞';
  if (n < 0) return '-' + formatMoney(-n);
  if (n < 1000) return Math.floor(n).toString();

  const tier = Math.floor(Math.log10(n) / 3);
  const scaled = n / Math.pow(10, tier * 3);

  const suffix = tier < SHORT_SUFFIXES.length ? SHORT_SUFFIXES[tier] : letterSuffix(tier);
  // 3 chiffres significatifs : 1.23 / 12.3 / 123
  const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
  return `${scaled.toFixed(digits)}${suffix}`;
}

/** Suffixe alphabétique pour les tiers hors table : aa, ab, ... az, ba, ... */
function letterSuffix(tier: number): string {
  const idx = tier - SHORT_SUFFIXES.length; // 0-based au-delà de la table
  const first = Math.floor(idx / 26);
  const second = idx % 26;
  return String.fromCharCode(97 + first) + String.fromCharCode(97 + second);
}

/** Entier avec séparateurs (pour miles/gemmes qui restent petits). */
export function formatCount(n: number): string {
  return Math.floor(n).toLocaleString('fr-FR');
}

/** Durée en secondes → "2h 14m", "3m 05s", "42s". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${sec.toString().padStart(2, '0')}s`;
  return `${sec}s`;
}
