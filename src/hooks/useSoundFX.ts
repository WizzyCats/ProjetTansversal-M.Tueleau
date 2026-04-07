// =============================================================================
// useSoundFX.ts — Hook pour jouer les sons de Noura depuis n'importe quel composant
// Sons disponibles : slash, heal, petal, ice, lightning, hit, death, loot, levelup, sparkle, menu
// =============================================================================

import { useCallback } from 'react';
import UIManager from '../ui/UIManager';

export function useSoundFX() {
  const play = useCallback((name: string) => {
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