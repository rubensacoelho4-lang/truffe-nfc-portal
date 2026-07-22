// purchases.ts — IAP via RevenueCat (abstraction). Gérer les reçus Apple/Google à
// la main est un cauchemar : RevenueCat abstrait ça.
//
// ÉTAT : implémentation DEV (mock) qui "achète" instantanément et renvoie la
// récompense. `react-native-purchases` ne tourne pas dans Expo Go (module natif).
//
// SWAP RÉEL (monetization-agent, Phase 4) :
//   1. npm install --legacy-peer-deps react-native-purchases
//   2. Purchases.configure({ apiKey }) au démarrage (clé PUBLIC SDK, jamais secrète).
//   3. Mapper PRODUCTS.id sur les identifiants de produits App Store / Play.
//   4. Remplacer purchaseProduct() par Purchases.purchasePackage() + parse du
//      customerInfo ; restore par Purchases.restorePurchases().
//   5. Passer IAP_READY à true. L'UI (shop) ne change pas.

export const IAP_READY = false;

export type ProductKind = 'gems' | 'noads';

export interface Product {
  id: string;
  title: string;
  description: string;
  priceLabel: string;
  kind: ProductKind;
  /** Gemmes accordées (pour kind 'gems'). */
  gems?: number;
}

/** Catalogue (miroir des produits configurés côté RevenueCat / stores). */
export const PRODUCTS: Product[] = [
  { id: 'gems_small', title: 'Poignée de gemmes', description: '100 gemmes', priceLabel: '1,99 €', kind: 'gems', gems: 100 },
  { id: 'gems_medium', title: 'Sac de gemmes', description: '550 gemmes', priceLabel: '8,99 €', kind: 'gems', gems: 550 },
  { id: 'gems_large', title: 'Coffre de gemmes', description: '1 300 gemmes', priceLabel: '18,99 €', kind: 'gems', gems: 1_300 },
  { id: 'no_ads', title: 'Sans pub', description: 'Retire les pubs (garde les bonus pub)', priceLabel: '4,99 €', kind: 'noads' },
];

export interface PurchaseResult {
  ok: boolean;
  product?: Product;
  /** true si l'utilisateur a annulé (pas une vraie erreur). */
  cancelled?: boolean;
}

/** Lance l'achat d'un produit. En dev : succès simulé. */
export async function purchaseProduct(id: string): Promise<PurchaseResult> {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) return { ok: false };
  if (!IAP_READY) {
    console.warn(`[Nomad] Achat simulé (dev) : ${product.title} — brancher RevenueCat pour le vrai.`);
    await new Promise((r) => setTimeout(r, 500));
    return { ok: true, product };
  }
  // TODO(monetization-agent) : Purchases.purchasePackage(...) réel ici.
  return { ok: false, product };
}

/** Restaure les achats non-consommables (ex. "sans pub"). En dev : no-op. */
export async function restorePurchases(): Promise<boolean> {
  if (!IAP_READY) {
    console.warn('[Nomad] Restore simulé (dev).');
    return true;
  }
  // TODO(monetization-agent) : Purchases.restorePurchases() réel ici.
  return false;
}
