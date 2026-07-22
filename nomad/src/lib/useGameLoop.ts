// useGameLoop.ts — branche le moteur au cycle de vie de l'app.
//  - hydrate au 1er montage (calcule le gain offline)
//  - tick logique à 1s (calcul par delta de timestamps, pas de compteur naïf)
//  - AppState : persist en background, resume (gain offline) au retour
// Monté une seule fois, dans le layout racine.

import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useGameStore } from '@/store/gameStore';

const TICK_MS = 1000;
const PERSIST_MS = 10_000;
const CLOUD_SYNC_MS = 60_000;

export function useGameLoop() {
  const hydrated = useGameStore((s) => s.hydrated);
  const lastPersist = useRef(0);
  const lastCloudSync = useRef(0);

  // Hydratation initiale (une fois).
  useEffect(() => {
    void useGameStore.getState().hydrate();
  }, []);

  // Tick logique + persistance locale + sync cloud périodiques.
  useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(() => {
      const now = Date.now();
      const store = useGameStore.getState();
      store.tick(now);
      if (now - lastPersist.current >= PERSIST_MS) {
        lastPersist.current = now;
        void store.persist();
      }
      if (now - lastCloudSync.current >= CLOUD_SYNC_MS) {
        lastCloudSync.current = now;
        void store.syncNow();
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [hydrated]);

  // Cycle de vie : background → persist + sync ; active → resume (offline).
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      const store = useGameStore.getState();
      if (next === 'active') {
        store.resume(Date.now());
      } else if (next === 'background' || next === 'inactive') {
        void store.persist();
        void store.syncNow();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);
}
