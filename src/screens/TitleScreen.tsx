// =============================================================================
// TitleScreen.tsx — Lon : sélection de classe + nom du personnage
// =============================================================================

import { useState } from 'react';
import { useGame } from '../engine/GameContext';
import { CLASS_NAMES, CLASS_LABELS, CLASS_DESCRIPTIONS } from '../combat/CombatSystem';
import type { ClassName } from '../combat/types';
import { useSoundFX } from '../hooks/useSoundFX';
import PixelSprite, { getHeroSpriteName } from '../components/PixelSprite';

const CLASS_ICONS: Record<ClassName, string> = {
  barbare:      '⚔️',
  mage_chaos:   '🔮',
  voleur:       '🗡️',
  necromancien: '💀',
};

const CLASS_META: Record<ClassName, { hp: string; spd: string; style: string }> = {
  barbare:      { hp: '████████░░', spd: '████░░░░░░', style: 'Tanky' },
  mage_chaos:   { hp: '████░░░░░░', spd: '██████░░░░', style: 'Random' },
  voleur:       { hp: '███░░░░░░░', spd: '█████████░', style: 'Rapide' },
  necromancien: { hp: '███░░░░░░░', spd: '██████░░░░', style: 'Invocateur' },
};

export default function TitleScreen() {
  const { startGame } = useGame();
  const sfx = useSoundFX();
  const [selected, setSelected]   = useState<ClassName | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [step, setStep]            = useState<'title' | 'class' | 'name'>('title');

  const handleStart = () => {
    if (!selected) return;
    sfx.playSparkle();
    sessionStorage.setItem('playerClassName', selected);
    sessionStorage.setItem('playerName', playerName.trim() || CLASS_LABELS[selected].replace(/^[^ ]+ /, ''));
    startGame();
  };

  if (step === 'title') return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8">
      <div className="text-center space-y-3">
        <h1 className="font-pixel text-4xl text-primary">⚔️ CrawlVenture</h1>
        <p className="text-muted-foreground text-sm">Un donjon vous attend. Osez-vous entrer ?</p>
      </div>
      <button onClick={() => { sfx.playMenu(); setStep('class'); }}
        className="px-8 py-4 rounded-md bg-primary text-primary-foreground font-pixel text-sm hover:opacity-90 transition-all hover:scale-105 active:scale-95">
        ▶ Choisir sa classe
      </button>
      <div className="text-xs text-muted-foreground text-center space-y-1 mt-4">
        <p>4 classes uniques · 20 niveaux · Cartes de progression</p>
        <p>Combat AFK — regardez votre héros se battre !</p>
      </div>
    </div>
  );

  if (step === 'class') return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
      <h2 className="font-pixel text-2xl text-primary">Choisissez votre classe</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {CLASS_NAMES.map(cls => (
          <button key={cls} onClick={() => { sfx.playSparkle(); setSelected(selected === cls ? null : cls); }}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selected === cls ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border bg-card hover:border-primary/50'
            }`}>
            <div className="flex items-center gap-3 mb-2">
              <PixelSprite name={getHeroSpriteName(cls)} scale={4} />
              <div>
                <p className="font-pixel text-sm text-primary">{CLASS_LABELS[cls]}</p>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded">{CLASS_META[cls].style}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">{CLASS_DESCRIPTIONS[cls]}</p>
            <div className="space-y-1 text-xs font-mono text-muted-foreground">
              <div>PV&nbsp;&nbsp; {CLASS_META[cls].hp}</div>
              <div>SPD&nbsp; {CLASS_META[cls].spd}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-4">
        <button onClick={() => setStep('title')} className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-secondary">← Retour</button>
        <button disabled={!selected} onClick={() => setStep('name')}
          className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-pixel text-sm hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          Suivant →
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-6">
      <div className="text-center">
        {selected && <PixelSprite name={getHeroSpriteName(selected)} scale={6} />}
        <h2 className="font-pixel text-xl text-primary mt-3">{selected ? CLASS_LABELS[selected] : ''}</h2>
      </div>
      <div className="w-full max-w-sm space-y-4">
        <div>
          <label className="text-xs text-muted-foreground font-pixel block mb-2">Nom du personnage</label>
          <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && selected) handleStart(); }}
            placeholder="Entrez un nom..." maxLength={20}
            className="w-full px-4 py-2 rounded-md border border-border bg-card text-foreground text-sm font-pixel focus:outline-none focus:border-primary" />
        </div>
        <div className="flex gap-3">
          <button onClick={() => setStep('class')} className="flex-1 px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-secondary">← Classe</button>
          <button onClick={handleStart} disabled={!selected}
            className="flex-1 px-6 py-2 rounded-md bg-primary text-primary-foreground font-pixel text-sm hover:opacity-90 disabled:opacity-30 transition-all">
            ▶ Entrer dans le donjon
          </button>
        </div>
      </div>
    </div>
  );
}
