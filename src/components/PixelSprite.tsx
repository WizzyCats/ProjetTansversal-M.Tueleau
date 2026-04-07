// =============================================================================
// PixelSprite.tsx — Rendu des sprites pixel art de Noura en React
// Chaque sprite est un mini canvas qui dessine les pixels
// =============================================================================

import { useEffect, useRef } from 'react';

// Tous les sprites de Noura (extraits de UIManager.js)
const SPRITES: Record<string, { pal: Record<string, string>; rows: string[] }> = {
  // Héros
  fee: {
    pal: { P:'#c77dff', W:'#ffe0f0', D:'#e9d8fd', R:'#ff8fab', Y:'#ffd166', S:'#a855c8' },
    rows: ['...RRR..','RRRRRRR.','.PWWWWP.','PP.WW.PP','..PPPP..','.DDDDDD.','..DDDD..','..D..D..'],
  },
  rose: {
    pal: { R:'#ff8fab', W:'#ffe0f0', P:'#e05c82', A:'#c0392b', S:'#ffd6e7' },
    rows: ['...RRR..','.RWWWWR.','.RWWWWR.','...RRR..','PPPPPPPP','.PPPPPP.','..PP.PP.','..PP.PP.'],
  },
  ombre: {
    pal: { N:'#2a1230', W:'#f0c8d8', D:'#1a0628', V:'#c77dff', G:'#4a2060' },
    rows: ['..NNN...','.NWWWN..','.NWWWN..','..NNN...','.DDDDD..','GDDDDDDG','..DD.DD.','..DD.DD.'],
  },
  // Boss
  boss: {
    pal: { R:'#e05c82', C:'#ffffff', D:'#3a0028', B:'#1a0016', P:'#c77dff', G:'#ff8fab' },
    rows: ['.G.....G.','..GGGGG..','.RRRRRRR.','RRRCRRRR.','RRRRRRRR.','.RRRRRRR.','..BBBBB..','B.......B'],
  },
  // Ennemis
  slime: {
    pal: { G:'#c77dff', W:'#ffffff', D:'#9b59b6', L:'#e9d8fd' },
    rows: ['..GGG...','.GLLLLG.','GLLLWLLG','GLLLLLLG','GLLLLLG.','.GGGGG..','..GGG...'],
  },
  skull: {
    pal: { B:'#8b1a2e', W:'#ffd6e7', D:'#5a0020', E:'#ff8fab' },
    rows: ['..BBB...','.BWWWB..','BWWEWWB.','BWBWBWB.','.BWWWB..','..BBBBB.','.BBBBB..','..B.B...'],
  },
  // NPC
  fairy: {
    pal: { Y:'#ffd166', W:'#fff5e0', O:'#ffb347', P:'#ff8fab' },
    rows: ['..YYYYY.','.YWWWWY.','YWWWWWWY','.YWWWWY.','..YYYYY.','..Y...Y.'],
  },
  // Tiles
  tileFloor: {
    pal: { A:'#160820', B:'#1e0d2e', C:'#0d0510', D:'#200a30' },
    rows: ['ABABABAB','BABABABA','ABABABAB','BABABABA','ABABABAB','BABABABA','ABABABAB','BABABABA'],
  },
  tileWall: {
    pal: { A:'#2e1240', B:'#1e0d2e', R:'#e05c82', S:'#3e1a50' },
    rows: ['RAAAAAAA','ASASASAS','AAAAAAAA','ASASASAS','AAAAAAAA','ASASASAS','AAAAAAAA','ASASASAS'],
  },
  tileDoor: {
    pal: { A:'#7a3a1a', B:'#5a2a0a', G:'#ffd166', D:'#3a1a0a', F:'#c77dff' },
    rows: ['DDDDDDDD','DABBBBAD','DABFABAD','DABABBAD','DABABBAD','DABFABAD','DABBBBAD','DDGGGGDD'],
  },
  tileChest: {
    pal: { A:'#7a4a1a', B:'#5a3a0a', G:'#ffd166', L:'#ff8fab', D:'#3a2a0a' },
    rows: ['DDDDDDDD','DAAAAGAD','DAAAAGAD','DGGGGGLD','DAAAAAD.','DAAAAAD.','DDDDDD..'],
  },
  tileCrystal: {
    pal: { C:'#c77dff', L:'#e9d8fd', D:'#8b4ddb', R:'#ff8fab', W:'#ffffff' },
    rows: ['...C....','..CLC...','.CLLLC..','CLLWLLLC','.CLLLC..','..CLC...','...C....'],
  },
  // Items
  potion: {
    pal: { R:'#ff8fab', D:'#e05c82', W:'#ffe0f0', G:'#888', B:'#aaa' },
    rows: ['..BB....','..BB....','.GWWWG..','GWWWWWG.','GRRRRRG.','GRRRRRG.','.GDDDDG.','..GGGG..'],
  },
  sword: {
    pal: { S:'#c8d8e8', D:'#7a3a1a', G:'#ffd166', H:'#888' },
    rows: ['......S.','.....SS.','....SS..','...SS...','..SS....','.GG.....','GDG.....','DDD.....'],
  },
};

// Mapping classe → sprite héros
const CLASS_SPRITE: Record<string, string> = {
  barbare: 'rose',
  voleur: 'ombre',
  mage_chaos: 'fee',
  necromancien: 'skull',
};

// Mapping ennemi → sprite (par nom partiel)
const ENEMY_SPRITE_MAP: [string, string][] = [
  ['dragon', 'boss'],
  ['liche', 'boss'],
  ['démon', 'boss'],
  ['chevalier', 'skull'],
  ['ogre', 'boss'],
  ['nécromancien', 'skull'],
  ['minotaure', 'boss'],
  ['rat', 'slime'],
  ['slime', 'slime'],
  ['chauve', 'fairy'],
  ['squelette', 'skull'],
  ['gobelin', 'skull'],
];

export function getEnemySpriteName(enemyName: string): string {
  const lower = enemyName.toLowerCase();
  for (const [keyword, sprite] of ENEMY_SPRITE_MAP) {
    if (lower.includes(keyword)) return sprite;
  }
  return 'slime'; // fallback
}

export function getHeroSpriteName(className: string): string {
  return CLASS_SPRITE[className] ?? 'fee';
}

// ---------------------------------------------------------------------------
// COMPOSANT
// ---------------------------------------------------------------------------

interface PixelSpriteProps {
  name: string;
  scale?: number;
  className?: string;
}

export default function PixelSprite({ name, scale = 4, className = '' }: PixelSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const sprite = SPRITES[name];
    if (!canvas || !sprite) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const px = Math.max(1, Math.round(scale));
    const maxCols = Math.max(...sprite.rows.map(r => r.length));
    canvas.width = maxCols * px;
    canvas.height = sprite.rows.length * px;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sprite.rows.forEach((row, ry) => {
      [...row].forEach((ch, rx) => {
        if (ch !== '.' && sprite.pal[ch]) {
          ctx.fillStyle = sprite.pal[ch];
          ctx.fillRect(rx * px, ry * px, px, px);
        }
      });
    });
  }, [name, scale]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// Export la liste des sprites disponibles
export const SPRITE_NAMES = Object.keys(SPRITES);
