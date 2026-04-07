// =============================================================================
// useSoundFX.ts — Hook pour jouer les sons de Noura depuis n'importe quel composant
// =============================================================================

import { useCallback } from 'react';
import UIManager from '../ui/UIManager';

function isMuted(): boolean {
  return sessionStorage.getItem('muted') === 'true';
}

export function setMuted(val: boolean) {
  sessionStorage.setItem('muted', val ? 'true' : 'false');
}

export function getMuted(): boolean {
  return isMuted();
}

export function useSoundFX() {
  const play = useCallback((name: string) => {
    if (isMuted()) return;
    UIManager.playSound(name);
  }, []);

  return {
    playSlash:     () => play('slash'),
    playHeal:      () => play('heal'),
    playHit:       () => play('hit'),
    playDeath:     () => play('death'),
    playLoot:      () => play('loot'),
    playLevelUp:   () => play('levelup'),
    playIce:       () => play('ice'),
    playLightning: () => play('lightning'),
    playSparkle:   () => play('sparkle'),
    playMenu:      () => play('menu'),
    play,
  };
}
