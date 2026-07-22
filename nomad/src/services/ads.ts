// ads.ts — pubs RÉCOMPENSÉES (le levier n°1 du genre : doubler l'offline, boost).
//
// ÉTAT : implémentation DEV (mock) qui simule le visionnage d'une pub et accorde
// la récompense. Les vraies pubs AdMob ne tournent PAS dans Expo Go (module natif)
// → on branche `react-native-google-mobile-ads` au passage en dev client / EAS.
//
// SWAP RÉEL (monetization-agent, Phase 4) :
//   1. npm install --legacy-peer-deps react-native-google-mobile-ads
//   2. Configurer les app IDs AdMob dans app.json (plugin) + ATT iOS.
//   3. Remplacer le corps de showRewardedAd() par le chargement/affichage réel :
//        const { RewardedAd, RewardedAdEventType, TestIds } = require('react-native-google-mobile-ads');
//        const ad = RewardedAd.createForAdRequest(unitId); ... await earnedReward.
//   4. Passer ADS_READY à true.
//
// L'abstraction ci-dessous NE change pas : l'UI appelle showRewardedAd() et reçoit
// un booléen (récompense méritée ou non). Rien d'autre à toucher côté jeu.

/** Passe à true une fois le SDK natif câblé (sinon : mock dev). */
export const ADS_READY = false;

export type AdPlacement = 'double_offline' | 'boost_2x' | 'free_gems';

/**
 * Affiche une pub récompensée. Retourne true si l'utilisateur a mérité la
 * récompense (pub regardée jusqu'au bout). En dev : simulé (toujours true).
 */
export async function showRewardedAd(placement: AdPlacement): Promise<boolean> {
  if (!ADS_READY) {
    // Mock : simule ~0.7s de "visionnage" puis accorde la récompense.
    console.warn(`[Nomad] Pub simulée (dev) pour "${placement}" — brancher AdMob pour la vraie.`);
    await new Promise((r) => setTimeout(r, 700));
    return true;
  }
  // TODO(monetization-agent) : implémentation AdMob réelle ici.
  return false;
}

/** Une pub récompensée est-elle disponible (préchargée) ? En dev : toujours oui. */
export function isRewardedReady(): boolean {
  return true;
}
