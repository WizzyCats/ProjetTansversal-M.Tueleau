/**
 * ============================================================
 *  CRYSTAL DUNGEON — UIManager.js
 *  Membre 4 — UI & Pixel Art
 *
 *  Exporte un objet global : window.UIManager
 *
 *  API publique :
 *    UIManager.init(canvas, gameState)
 *    UIManager.setState(gameState)
 *    UIManager.showScreen(name)   // 'title' | 'classSelect' | 'game' | 'gameOver' | 'victory'
 *    UIManager.showDamage(value, type, x, y)  // type: 'player'|'enemy'|'crit'|'heal'|'miss'
 *    UIManager.addLog(text, type)             // type: 'dmg'|'heal'|'loot'|'spell'|'sys'
 *    UIManager.playSound(name)
 *    UIManager.drawHUD()
 *    UIManager.drawSprite(name, x, y, scale)
 *    UIManager.update()           // appeler dans la boucle de jeu
 * ============================================================
 */

const UIManager = (() => {

  /* ──────────────────────────────────────────
     PALETTE
  ────────────────────────────────────────── */
  const C = {
    rose:      '#ff8fab',
    roseDeep:  '#e05c82',
    rosePale:  '#ffd6e7',
    lav:       '#c77dff',
    lavPale:   '#e9d8fd',
    mint:      '#80ffdb',
    mintDk:    '#48bfa8',
    gold:      '#ffd166',
    peche:     '#ffb347',
    bg:        '#0d0510',
    bg2:       '#160820',
    bg3:       '#1e0d2e',
    border:    'rgba(255,143,171,0.18)',
    border2:   'rgba(199,125,255,0.22)',
  };

  /* ──────────────────────────────────────────
     ÉTAT INTERNE
  ────────────────────────────────────────── */
  let _canvas = null;
  let _ctx    = null;
  let _state  = {
    hp: 100, maxHp: 100,
    mp: 100, maxMp: 100,
    xp: 0,   maxXp: 100,
    gold: 0,
    level: 1,
    floor: 1,
    class: 'fee',   // 'fee' | 'rose' | 'ombre'
    skills: ['⚔','🌸','❄','⚡'],
    items:  ['💎','🌟','🧪','💜','🗝',''],
    bossHp: 100, bossMaxHp: 100,
    bossName: 'REINE DES OMBRES',
    showBoss: false,
  };

  let _screen       = 'title';   // écran courant
  let _floatingNums = [];        // damage numbers flottants
  let _log          = [];        // combat log (max 6 lignes)
  let _effects      = [];        // effets visuels temporaires
  let _selectedClass = 0;        // index 0-2
  let _menuIndex    = 0;
  let _audioCtx     = null;
  let _titleAnim    = 0;         // compteur pour animations titre
  let _sparkles     = [];        // particules titre

  /* ──────────────────────────────────────────
     SPRITES PIXEL ART
     Format : tableau de chaînes (1 char = 1 pixel)
     '.' = transparent
  ────────────────────────────────────────── */
  const SPRITES = {

    // ── Héros ──
    fee: {
      pal: { P:'#c77dff', W:'#ffe0f0', D:'#e9d8fd', R:'#ff8fab', Y:'#ffd166', S:'#a855c8' },
      rows: [
        '...RRR..',
        'RRRRRRR.',
        '.PWWWWP.',
        'PP.WW.PP',
        '..PPPP..',
        '.DDDDDD.',
        '..DDDD..',
        '..D..D..',
      ]
    },
    rose: {
      pal: { R:'#ff8fab', W:'#ffe0f0', P:'#e05c82', A:'#c0392b', S:'#ffd6e7' },
      rows: [
        '...RRR..',
        '.RWWWWR.',
        '.RWWWWR.',
        '...RRR..',
        'PPPPPPPP',
        '.PPPPPP.',
        '..PP.PP.',
        '..PP.PP.',
      ]
    },
    ombre: {
      pal: { N:'#2a1230', W:'#f0c8d8', D:'#1a0628', V:'#c77dff', G:'#4a2060' },
      rows: [
        '..NNN...',
        '.NWWWN..',
        '.NWWWN..',
        '..NNN...',
        '.DDDDD..',
        'GDDDDDDG',
        '..DD.DD.',
        '..DD.DD.',
      ]
    },

    // ── Boss ──
    boss: {
      pal: { R:'#e05c82', C:'#ffffff', D:'#3a0028', B:'#1a0016', P:'#c77dff', G:'#ff8fab' },
      rows: [
        '.G.....G.',
        '..GGGGG..',
        '.RRRRRRR.',
        'RRRCRRRR.',
        'RRRRRRRR.',
        '.RRRRRRR.',
        '..BBBBB..',
        'B.......B',
      ]
    },

    // ── Ennemis ──
    slime: {
      pal: { G:'#c77dff', W:'#ffffff', D:'#9b59b6', L:'#e9d8fd' },
      rows: [
        '..GGG...',
        '.GLLLLG.',
        'GLLLWLLG',
        'GLLLLLLG',
        'GLLLLLG.',
        '.GGGGG..',
        '..GGG...',
      ]
    },
    skull: {
      pal: { B:'#8b1a2e', W:'#ffd6e7', D:'#5a0020', E:'#ff8fab' },
      rows: [
        '..BBB...',
        '.BWWWB..',
        'BWWEWWB.',
        'BWBWBWB.',
        '.BWWWB..',
        '..BBBBB.',
        '.BBBBB..',
        '..B.B...',
      ]
    },

    // ── NPC ──
    fairy: {
      pal: { Y:'#ffd166', W:'#fff5e0', O:'#ffb347', P:'#ff8fab' },
      rows: [
        '..YYYYY.',
        '.YWWWWY.',
        'YWWWWWWY',
        '.YWWWWY.',
        '..YYYYY.',
        '..Y...Y.',
      ]
    },

    // ── Tiles ──
    tileFloor: {
      pal: { A:'#160820', B:'#1e0d2e', C:'#0d0510', D:'#200a30' },
      rows: [
        'ABABABAB',
        'BABABABA',
        'ABABABAB',
        'BABABABA',
        'ABABABAB',
        'BABABABA',
        'ABABABAB',
        'BABABABA',
      ]
    },
    tileWall: {
      pal: { A:'#2e1240', B:'#1e0d2e', R:'#e05c82', S:'#3e1a50' },
      rows: [
        'RAAAAAAA',
        'ASASASAS',
        'AAAAAAAA',
        'ASASASAS',
        'AAAAAAAA',
        'ASASASAS',
        'AAAAAAAA',
        'ASASASAS',
      ]
    },
    tileDoor: {
      pal: { A:'#7a3a1a', B:'#5a2a0a', G:'#ffd166', D:'#3a1a0a', F:'#c77dff' },
      rows: [
        'DDDDDDDD',
        'DABBBBAD',
        'DABFABAD',
        'DABABBAD',
        'DABABBAD',
        'DABFABAD',
        'DABBBBAD',
        'DDGGGGDD',
      ]
    },
    tileChest: {
      pal: { A:'#7a4a1a', B:'#5a3a0a', G:'#ffd166', L:'#ff8fab', D:'#3a2a0a' },
      rows: [
        'DDDDDDDD',
        'DAAAAGAD',
        'DAAAAGAD',
        'DGGGGGLD',
        'DAAAAAD.',
        'DAAAAAD.',
        'DDDDDD..',
      ]
    },
    tileCrystal: {
      pal: { C:'#c77dff', L:'#e9d8fd', D:'#8b4ddb', R:'#ff8fab', W:'#ffffff' },
      rows: [
        '...C....',
        '..CLC...',
        '.CLLLC..',
        'CLLWLLLC',
        '.CLLLC..',
        '..CLC...',
        '...C....',
      ]
    },

    // ── Items ──
    potion: {
      pal: { R:'#ff8fab', D:'#e05c82', W:'#ffe0f0', G:'#888', B:'#aaa' },
      rows: [
        '..BB....',
        '..BB....',
        '.GWWWG..',
        'GWWWWWG.',
        'GRRRRRG.',
        'GRRRRRG.',
        '.GDDDDG.',
        '..GGGG..',
      ]
    },
    sword: {
      pal: { S:'#c8d8e8', D:'#7a3a1a', G:'#ffd166', H:'#888' },
      rows: [
        '......S.',
        '.....SS.',
        '....SS..',
        '...SS...',
        '..SS....',
        '.GG.....',
        'GDG.....',
        'DDD.....',
      ]
    },
  };

  /* ──────────────────────────────────────────
     RENDU SPRITE GÉNÉRIQUE
  ────────────────────────────────────────── */
  function drawSprite(name, x, y, scale = 1) {
    if (!_ctx || !SPRITES[name]) return;
    const s = SPRITES[name];
    const px = Math.max(1, Math.round(4 * scale));
    s.rows.forEach((row, ry) => {
      [...row].forEach((ch, rx) => {
        if (ch !== '.' && s.pal[ch]) {
          _ctx.fillStyle = s.pal[ch];
          _ctx.fillRect(
            Math.round(x + rx * px),
            Math.round(y + ry * px),
            px, px
          );
        }
      });
    });
  }

  /* ──────────────────────────────────────────
     RENDU SPRITE SUR CANVAS OFFSCREEN
     (pour UI panels, class select, etc.)
  ────────────────────────────────────────── */
  function renderSpriteToCanvas(canvas, name, scale = 1) {
    if (!canvas || !SPRITES[name]) return;
    const s = SPRITES[name];
    const px = Math.max(1, Math.round(4 * scale));
    canvas.width  = s.rows[0].length * px;
    canvas.height = s.rows.length    * px;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    s.rows.forEach((row, ry) => {
      [...row].forEach((ch, rx) => {
        if (ch !== '.' && s.pal[ch]) {
          ctx.fillStyle = s.pal[ch];
          ctx.fillRect(rx * px, ry * px, px, px);
        }
      });
    });
  }

  /* ──────────────────────────────────────────
     HUD
  ────────────────────────────────────────── */
  function drawHUD() {
    if (!_ctx || _screen !== 'game') return;
    const W = _canvas.width;
    const H = _canvas.height;

    // ── Fond HUD bas ──
    const grad = _ctx.createLinearGradient(0, H - 90, 0, H);
    grad.addColorStop(0, 'rgba(13,5,16,0)');
    grad.addColorStop(1, 'rgba(13,5,16,0.97)');
    _ctx.fillStyle = grad;
    _ctx.fillRect(0, H - 90, W, 90);

    // ── Panel gauche : avatar + barres ──
    _drawPanel(6, H - 84, 230, 78);

    // Avatar
    const avatarKey = _state.class || 'fee';
    drawSprite(avatarKey, 12, H - 80, 0.8);

    // Barres HP / MP / XP
    _drawBar(48, H - 80, 180, 10, _state.hp / _state.maxHp, C.roseDeep, C.rose, 'HP', `${_state.hp}/${_state.maxHp}`);
    _drawBar(48, H - 65, 180, 10, _state.mp / _state.maxMp, '#5b2d8e', C.lav,  'MP', `${_state.mp}/${_state.maxMp}`);
    _drawBar(48, H - 50, 180,  7, _state.xp / _state.maxXp, C.mintDk,  C.mint, 'XP', '');

    // Level / Floor / Gold
    _drawText(`LV${_state.level}`, 48, H - 36, C.gold, 10);
    _drawText(`FLOOR ${_state.floor}`, 85, H - 36, 'rgba(255,214,231,0.5)', 6);
    _drawText(`♥ ${_state.gold}G`, 160, H - 36, C.gold, 6);

    // ── Panel central : skills ──
    _drawPanel(W/2 - 90, H - 50, 180, 44);
    _drawText('SKILLS', W/2 - 82, H - 38, 'rgba(255,214,231,0.3)', 5);
    const skillKeys = _state.skills || ['⚔','🌸','❄','⚡'];
    const kbLabels  = ['Q','W','E','R'];
    skillKeys.forEach((sk, i) => {
      const sx = W/2 - 84 + i * 44;
      const sy = H - 32;
      _drawSlot(sx, sy, 36, 36, false);
      _ctx.font = '16px serif';
      _ctx.fillText(sk, sx + 9, sy + 24);
      _drawText(kbLabels[i], sx + 2, sy + 9, 'rgba(255,214,231,0.35)', 5);
    });

    // ── Panel droit : items ──
    _drawPanel(W - 206, H - 50, 200, 44);
    _drawText('ITEMS', W - 198, H - 38, 'rgba(255,214,231,0.3)', 5);
    const items = _state.items || [];
    items.slice(0, 6).forEach((it, i) => {
      const ix = W - 200 + i * 32;
      const iy = H - 32;
      _drawSlot(ix, iy, 28, 28, !!it);
      if (it) {
        _ctx.font = '13px serif';
        _ctx.fillText(it, ix + 6, iy + 20);
      }
    });

    // ── Boss bar (si combat boss actif) ──
    if (_state.showBoss) _drawBossBar();
  }

  function _drawBar(x, y, w, h, pct, c1, c2, label, valText) {
    // fond
    _ctx.fillStyle = 'rgba(255,143,171,0.05)';
    _ctx.fillRect(x, y, w, h);
    _ctx.strokeStyle = C.border;
    _ctx.lineWidth = 1;
    _ctx.strokeRect(x, y, w, h);
    // remplissage
    const fillW = Math.max(0, Math.min(w, w * pct));
    const grad = _ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    _ctx.fillStyle = grad;
    _ctx.fillRect(x, y, fillW, h);
    // label gauche
    _drawText(label, x - 22, y + h - 1, 'rgba(255,214,231,0.6)', 5);
    // valeur droite
    if (valText) _drawText(valText, x + w - valText.length * 5 - 2, y + h - 1, 'rgba(255,214,231,0.45)', 4);
  }

  function _drawSlot(x, y, w, h, hasItem) {
    _ctx.fillStyle = C.bg3;
    _ctx.fillRect(x, y, w, h);
    _ctx.strokeStyle = hasItem ? C.border2 : C.border;
    _ctx.lineWidth = 1;
    _ctx.strokeRect(x, y, w, h);
  }

  function _drawPanel(x, y, w, h) {
    _ctx.fillStyle = 'rgba(22,8,32,0.88)';
    _ctx.fillRect(x, y, w, h);
    _ctx.strokeStyle = C.border;
    _ctx.lineWidth = 1;
    _ctx.strokeRect(x, y, w, h);
  }

  function _drawBossBar() {
    const W = _canvas.width;
    const bw = Math.min(500, W - 40);
    const bx = (W - bw) / 2;
    const by = 12;

    _ctx.fillStyle = 'rgba(13,5,16,0.9)';
    _ctx.fillRect(bx - 4, by - 4, bw + 8, 36);
    _ctx.strokeStyle = 'rgba(224,92,130,0.3)';
    _ctx.strokeRect(bx - 4, by - 4, bw + 8, 36);

    _drawText(_state.bossName, bx, by + 9, C.rose, 6);

    const pct = _state.bossHp / _state.bossMaxHp;
    _ctx.fillStyle = 'rgba(255,143,171,0.07)';
    _ctx.fillRect(bx, by + 14, bw, 12);
    const bgrad = _ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bgrad.addColorStop(0, C.roseDeep);
    bgrad.addColorStop(0.6, C.rose);
    bgrad.addColorStop(1, C.lav);
    _ctx.fillStyle = bgrad;
    _ctx.fillRect(bx, by + 14, bw * pct, 12);
    _ctx.strokeStyle = 'rgba(224,92,130,0.25)';
    _ctx.strokeRect(bx, by + 14, bw, 12);
  }

  /* ──────────────────────────────────────────
     ÉCRAN TITRE
  ────────────────────────────────────────── */
  function _drawTitle(t) {
    const W = _canvas.width, H = _canvas.height;

    // BG radial
    const bg = _ctx.createRadialGradient(W/2, H*0.45, 20, W/2, H*0.45, H*0.7);
    bg.addColorStop(0, '#2a0820');
    bg.addColorStop(0.5, '#0d0510');
    bg.addColorStop(1, '#000000');
    _ctx.fillStyle = bg;
    _ctx.fillRect(0, 0, W, H);

    // Sparkles
    _sparkles.forEach(s => {
      const pulse = (Math.sin(t * 0.003 + s.phase) + 1) / 2;
      _ctx.fillStyle = `rgba(255,214,231,${0.1 + pulse * 0.8})`;
      const sz = s.size * (0.6 + pulse * 0.6);
      _ctx.fillRect(s.x, s.y, sz, sz);
    });

    // Cristal flottant
    const floatY = Math.sin(t * 0.003) * 8;
    _ctx.font = `${Math.round(H * 0.1)}px serif`;
    _ctx.fillText('💎', W/2 - H*0.05, H*0.25 + floatY);

    // Titre
    const titleSize = Math.max(12, Math.round(W * 0.045));
    _ctx.font = `${titleSize}px 'Press Start 2P', monospace`;
    _ctx.fillStyle = C.rose;
    _ctx.shadowColor = C.rose;
    _ctx.shadowBlur = 18;
    _ctx.textAlign = 'center';
    _ctx.fillText('CRYSTAL', W/2, H*0.4 + floatY);
    _ctx.fillText('DUNGEON', W/2, H*0.4 + titleSize * 1.6 + floatY);
    _ctx.shadowBlur = 0;

    // Sous-titre
    _ctx.font = `6px 'Press Start 2P', monospace`;
    _ctx.fillStyle = C.lav;
    _ctx.fillText('— PIXEL QUEST —', W/2, H*0.53 + floatY);

    // Menu
    const menuItems = ['♥ NEW GAME', '♦ CONTINUE', '♣ SETTINGS', '♠ QUIT'];
    menuItems.forEach((item, i) => {
      const my = H * 0.62 + i * 34;
      const isSelected = i === _menuIndex;
      const mw = 200, mh = 24;
      const mx = W/2 - mw/2;
      _ctx.fillStyle = isSelected ? 'rgba(255,143,171,0.1)' : 'rgba(13,5,16,0.6)';
      _ctx.fillRect(mx, my, mw, mh);
      _ctx.strokeStyle = isSelected ? C.rose : C.border;
      _ctx.lineWidth = 1;
      _ctx.strokeRect(mx, my, mw, mh);
      _ctx.font = `6px 'Press Start 2P', monospace`;
      _ctx.fillStyle = isSelected ? C.rose : 'rgba(255,214,231,0.6)';
      _ctx.textAlign = 'center';
      _ctx.fillText(item, W/2, my + 16);
    });

    // Bas de page
    const blink = Math.sin(t * 0.005) > 0;
    if (blink) {
      _ctx.font = `5px 'Press Start 2P', monospace`;
      _ctx.fillStyle = 'rgba(255,214,231,0.2)';
      _ctx.fillText('PRESS ♥ TO START', W/2, H - 16);
    }
    _ctx.textAlign = 'left';
  }

  /* ──────────────────────────────────────────
     ÉCRAN SÉLECTION DE CLASSE
  ────────────────────────────────────────── */
  function _drawClassSelect(t) {
    const W = _canvas.width, H = _canvas.height;

    _ctx.fillStyle = '#0a0212';
    _ctx.fillRect(0, 0, W, H);

    _ctx.font = `8px 'Press Start 2P', monospace`;
    _ctx.fillStyle = C.lav;
    _ctx.textAlign = 'center';
    _ctx.fillText('✿ CHOISIR TA CLASSE ✿', W/2, 50);
    _ctx.textAlign = 'left';

    const classes = [
      { key: 'fee',   name: 'FÉE MAGE',  desc: 'Sorts & cristaux', hp: 45, mp: 95, spd: 70 },
      { key: 'rose',  name: 'ROSE',       desc: 'Épée & bouclier',  hp: 90, mp: 30, spd: 55 },
      { key: 'ombre', name: 'OMBRE',      desc: 'Furtivité & poison', hp: 60, mp: 60, spd: 98 },
    ];

    const cardW = 160, cardH = 240, gap = 20;
    const totalW = classes.length * cardW + (classes.length - 1) * gap;
    const startX = (W - totalW) / 2;

    classes.forEach((cl, i) => {
      const cx = startX + i * (cardW + gap);
      const cy = 80;
      const isSel = i === _selectedClass;
      const hover = isSel ? -6 : 0;

      // Card
      _ctx.fillStyle = isSel ? 'rgba(30,13,46,0.95)' : 'rgba(22,8,32,0.85)';
      _ctx.fillRect(cx, cy + hover, cardW, cardH);
      _ctx.strokeStyle = isSel ? C.rose : C.border;
      _ctx.lineWidth = isSel ? 1.5 : 1;
      _ctx.strokeRect(cx, cy + hover, cardW, cardH);

      // Sprite centré
      const sprKey = cl.key;
      const sp = SPRITES[sprKey];
      if (sp) {
        const scale = 2.5;
        const px = 4 * scale;
        const sw = sp.rows[0].length * px;
        const sh = sp.rows.length * px;
        const ox = cx + (cardW - sw) / 2;
        const oy = cy + 20 + hover;
        sp.rows.forEach((row, ry) => {
          [...row].forEach((ch, rx) => {
            if (ch !== '.' && sp.pal[ch]) {
              _ctx.fillStyle = sp.pal[ch];
              _ctx.fillRect(Math.round(ox + rx * px), Math.round(oy + ry * px), px, px);
            }
          });
        });
      }

      // Nom
      _ctx.font = `6px 'Press Start 2P', monospace`;
      _ctx.fillStyle = isSel ? C.rose : 'rgba(255,214,231,0.7)';
      _ctx.textAlign = 'center';
      _ctx.fillText(cl.name, cx + cardW/2, cy + 130 + hover);

      // Description
      _ctx.font = `5px 'Press Start 2P', monospace`;
      _ctx.fillStyle = 'rgba(255,214,231,0.4)';
      _ctx.fillText(cl.desc, cx + cardW/2, cy + 145 + hover);

      // Stat bars
      [
        { label: 'HP',  val: cl.hp,  c: C.rose },
        { label: 'MP',  val: cl.mp,  c: C.lav  },
        { label: 'SPD', val: cl.spd, c: C.mint  },
      ].forEach((st, si) => {
        const bx = cx + 16, by = cy + 160 + si * 18 + hover;
        const bw = cardW - 32;
        _ctx.font = `4px 'Press Start 2P', monospace`;
        _ctx.fillStyle = 'rgba(255,214,231,0.4)';
        _ctx.textAlign = 'left';
        _ctx.fillText(st.label, bx, by + 7);
        _ctx.fillStyle = 'rgba(255,143,171,0.07)';
        _ctx.fillRect(bx + 22, by, bw - 22, 6);
        _ctx.fillStyle = st.c;
        _ctx.fillRect(bx + 22, by, (bw - 22) * st.val / 100, 6);
        _ctx.strokeStyle = C.border;
        _ctx.strokeRect(bx + 22, by, bw - 22, 6);
      });
      _ctx.textAlign = 'left';
    });

    // Bouton confirmer
    const bx = W/2 - 90, by = H - 70;
    _ctx.fillStyle = C.rose;
    _ctx.fillRect(bx, by, 180, 30);
    _ctx.font = `7px 'Press Start 2P', monospace`;
    _ctx.fillStyle = '#0d0510';
    _ctx.textAlign = 'center';
    _ctx.fillText('✿ CONFIRMER', W/2, by + 20);
    _ctx.textAlign = 'left';
  }

  /* ──────────────────────────────────────────
     GAME OVER
  ────────────────────────────────────────── */
  function _drawGameOver(t) {
    const W = _canvas.width, H = _canvas.height;

    const bg = _ctx.createRadialGradient(W/2, H/2, 10, W/2, H/2, H*0.7);
    bg.addColorStop(0, '#1a0000');
    bg.addColorStop(1, '#000000');
    _ctx.fillStyle = bg;
    _ctx.fillRect(0, 0, W, H);

    // Icône
    _ctx.font = `${Math.round(H * 0.1)}px serif`;
    _ctx.textAlign = 'center';
    _ctx.fillText('💔', W/2, H*0.35);

    // Titre flickering
    const flicker = Math.sin(t * 0.04) > 0 ? 1 : 0.7;
    _ctx.globalAlpha = flicker;
    _ctx.font = `${Math.max(10, Math.round(W * 0.04))}px 'Press Start 2P', monospace`;
    _ctx.fillStyle = C.rose;
    _ctx.shadowColor = C.rose;
    _ctx.shadowBlur = 14;
    _ctx.fillText('GAME OVER', W/2, H*0.5);
    _ctx.shadowBlur = 0;
    _ctx.globalAlpha = 1;

    _ctx.font = `5px 'Press Start 2P', monospace`;
    _ctx.fillStyle = 'rgba(255,143,171,0.5)';
    _ctx.fillText('YOU FELL IN THE DUNGEON', W/2, H*0.58);

    _ctx.font = `5px 'Press Start 2P', monospace`;
    _ctx.fillStyle = 'rgba(255,214,231,0.4)';
    _ctx.fillText(`FLOOR: ${_state.floor}`, W/2, H*0.65);

    // Boutons
    ['RETRY', 'MENU'].forEach((label, i) => {
      const bx = W/2 - 100 + i * 110, by = H * 0.72;
      _ctx.fillStyle = i === 0 ? C.rose : 'transparent';
      _ctx.fillRect(bx, by, 90, 26);
      _ctx.strokeStyle = i === 0 ? C.rose : C.border;
      _ctx.strokeRect(bx, by, 90, 26);
      _ctx.font = `5px 'Press Start 2P', monospace`;
      _ctx.fillStyle = i === 0 ? '#0d0510' : 'rgba(255,214,231,0.6)';
      _ctx.fillText(label, bx + 30, by + 17);
    });
    _ctx.textAlign = 'left';
  }

  /* ──────────────────────────────────────────
     VICTOIRE
  ────────────────────────────────────────── */
  function _drawVictory(t) {
    const W = _canvas.width, H = _canvas.height;

    const bg = _ctx.createRadialGradient(W/2, H*0.4, 10, W/2, H*0.4, H*0.7);
    bg.addColorStop(0, '#061220');
    bg.addColorStop(1, '#000000');
    _ctx.fillStyle = bg;
    _ctx.fillRect(0, 0, W, H);

    // Sparkles victoire
    _sparkles.forEach(s => {
      const pulse = (Math.sin(t * 0.004 + s.phase) + 1) / 2;
      _ctx.fillStyle = `rgba(128,255,219,${0.1 + pulse * 0.6})`;
      _ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // Icône flottant
    const floatY = Math.sin(t * 0.004) * 10;
    _ctx.font = `${Math.round(H * 0.1)}px serif`;
    _ctx.textAlign = 'center';
    _ctx.fillText('🌸', W/2, H*0.3 + floatY);

    // Titre
    _ctx.font = `${Math.max(10, Math.round(W * 0.04))}px 'Press Start 2P', monospace`;
    _ctx.fillStyle = C.mint;
    _ctx.shadowColor = C.mint;
    _ctx.shadowBlur = 16;
    _ctx.fillText('VICTORY!', W/2, H*0.48);
    _ctx.shadowBlur = 0;

    _ctx.font = `5px 'Press Start 2P', monospace`;
    _ctx.fillStyle = 'rgba(128,255,219,0.6)';
    _ctx.fillText('DUNGEON CONQUERED!', W/2, H*0.56);

    // Étoiles
    _ctx.font = '20px serif';
    _ctx.fillText('★★★', W/2, H*0.63);

    _ctx.font = `5px 'Press Start 2P', monospace`;
    _ctx.fillStyle = C.gold;
    _ctx.fillText('FINAL SCORE: 9420', W/2, H*0.7);

    // Bouton
    const bx = W/2 - 50, by = H*0.76;
    _ctx.fillStyle = C.mintDk;
    _ctx.fillRect(bx, by, 100, 26);
    _ctx.font = `5px 'Press Start 2P', monospace`;
    _ctx.fillStyle = '#000';
    _ctx.fillText('MENU', W/2 - 18, by + 17);
    _ctx.textAlign = 'left';
  }

  /* ──────────────────────────────────────────
     DAMAGE NUMBERS FLOTTANTS
  ────────────────────────────────────────── */
  function showDamage(value, type, x, y) {
    const colors = {
      player: C.rose,
      enemy:  C.gold,
      crit:   '#ff5500',
      heal:   C.mint,
      miss:   'rgba(255,214,231,0.35)',
    };
    const sizes = { crit: 14, miss: 7, player: 10, enemy: 10, heal: 10 };
    const texts = {
      player: `-${value}`,
      enemy:  `-${value}`,
      crit:   `CRIT! -${value}`,
      heal:   `+${value} HP`,
      miss:   'MISS',
    };
    _floatingNums.push({
      text:  texts[type]  || String(value),
      color: colors[type] || C.rosePale,
      size:  sizes[type]  || 10,
      x, y,
      vy: -1.2,
      life: 1.0,   // 0→1, on décrémente
      decay: 0.018,
    });
  }

  function _updateFloatingNums() {
    _floatingNums = _floatingNums.filter(n => n.life > 0);
    _floatingNums.forEach(n => {
      n.y  += n.vy;
      n.vy *= 0.97;
      n.life -= n.decay;
    });
  }

  function _drawFloatingNums() {
    _floatingNums.forEach(n => {
      _ctx.globalAlpha = Math.max(0, n.life);
      _ctx.font = `${n.size}px 'Press Start 2P', monospace`;
      _ctx.fillStyle = n.color;
      _ctx.fillText(n.text, n.x, n.y);
    });
    _ctx.globalAlpha = 1;
  }

  /* ──────────────────────────────────────────
     COMBAT LOG
  ────────────────────────────────────────── */
  function addLog(text, type = 'sys') {
    _log.unshift({ text, type, life: 1.0 });
    if (_log.length > 6) _log.pop();
  }

  function _drawLog() {
    if (!_canvas || _screen !== 'game') return;
    const W = _canvas.width, H = _canvas.height;
    const colors = {
      dmg:   '#ffb3cb',
      heal:  '#b3ffe5',
      loot:  '#ffe5a0',
      spell: '#e0aaff',
      sys:   'rgba(255,214,231,0.4)',
    };
    const borders = {
      dmg:   C.rose,
      heal:  C.mint,
      loot:  C.gold,
      spell: C.lav,
      sys:   'rgba(255,214,231,0.15)',
    };

    const startY = H - 100;
    _log.forEach((entry, i) => {
      const ey = startY - i * 18;
      if (ey < 0) return;
      _ctx.globalAlpha = Math.min(1, entry.life) * (1 - i * 0.15);
      _ctx.fillStyle = 'rgba(13,5,16,0.75)';
      _ctx.fillRect(6, ey - 12, 240, 14);
      _ctx.fillStyle = borders[entry.type] || C.border;
      _ctx.fillRect(6, ey - 12, 2, 14);
      _ctx.font = `5px 'Press Start 2P', monospace`;
      _ctx.fillStyle = colors[entry.type] || 'rgba(255,214,231,0.5)';
      _ctx.fillText(entry.text, 12, ey - 1);
    });
    _ctx.globalAlpha = 1;

    // Fade log lentement
    _log.forEach(e => { e.life -= 0.002; });
    _log = _log.filter(e => e.life > 0);
  }

  /* ──────────────────────────────────────────
     EFFETS VISUELS (sorts, coups)
  ────────────────────────────────────────── */
  function addEffect(type, x, y) {
    _effects.push({ type, x, y, t: 0, maxT: 40 });
  }

  function _updateEffects() {
    _effects = _effects.filter(e => e.t < e.maxT);
    _effects.forEach(e => e.t++);
  }

  function _drawEffects() {
    _effects.forEach(e => {
      const p = e.t / e.maxT;
      _ctx.globalAlpha = 1 - p;

      if (e.type === 'slash') {
        _ctx.strokeStyle = C.rosePale;
        _ctx.lineWidth = 3;
        _ctx.beginPath();
        _ctx.moveTo(e.x - 24, e.y - p * 30);
        _ctx.lineTo(e.x + 30, e.y + 10 - p * 30);
        _ctx.stroke();
        _ctx.strokeStyle = C.rose;
        _ctx.lineWidth = 1.5;
        _ctx.beginPath();
        _ctx.moveTo(e.x - 18, e.y + 5 - p * 30);
        _ctx.lineTo(e.x + 22, e.y + 15 - p * 30);
        _ctx.stroke();
      }

      else if (e.type === 'petal') {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + p * 3;
          const r = 26 * p;
          _ctx.fillStyle = C.rose;
          _ctx.fillRect(
            e.x + Math.cos(angle) * r - 3,
            e.y + Math.sin(angle) * r - 34 * p - 3,
            5, 5
          );
        }
      }

      else if (e.type === 'ice') {
        _ctx.strokeStyle = '#c8f0ff';
        _ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          _ctx.beginPath();
          _ctx.moveTo(e.x, e.y - 36 * p);
          _ctx.lineTo(e.x + Math.cos(a) * 22 * p, e.y - 36 * p + Math.sin(a) * 22 * p);
          _ctx.stroke();
        }
      }

      else if (e.type === 'lightning') {
        _ctx.strokeStyle = C.lavPale;
        _ctx.lineWidth = 2;
        let lx = e.x;
        _ctx.beginPath();
        _ctx.moveTo(lx, e.y - 55);
        for (let i = 0; i < 8; i++) {
          lx += (Math.random() - 0.5) * 20;
          _ctx.lineTo(lx, e.y - 55 + i * 8);
        }
        _ctx.stroke();
      }

      else if (e.type === 'heal') {
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 + p * 2;
          const r = 20 * p;
          _ctx.fillStyle = C.mint;
          _ctx.fillRect(
            e.x + Math.cos(angle) * r - 2,
            e.y + Math.sin(angle) * r - 28 * p - 2,
            4, 4
          );
        }
      }

      else if (e.type === 'explosion') {
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const r = 40 * p;
          _ctx.fillStyle = i % 2 === 0 ? C.rose : C.gold;
          _ctx.fillRect(
            e.x + Math.cos(angle) * r - 3,
            e.y + Math.sin(angle) * r - 3,
            5, 5
          );
        }
      }
    });
    _ctx.globalAlpha = 1;
    _ctx.lineWidth = 1;
  }

  /* ──────────────────────────────────────────
     MINIMAP
  ────────────────────────────────────────── */
  function drawMinimap(rooms, playerPos, x, y, size = 120) {
    if (!_ctx) return;
    _ctx.fillStyle = '#000';
    _ctx.fillRect(x, y, size, size);
    _ctx.strokeStyle = C.border;
    _ctx.strokeRect(x, y, size, size);

    if (!rooms) return;
    const scale = size / 10;
    rooms.forEach(room => {
      const rx = x + room.x * scale;
      const ry = y + room.y * scale;
      const rw = room.w * scale;
      const rh = room.h * scale;
      _ctx.fillStyle = room.type === 'boss'  ? '#3a0828' :
                       room.type === 'shop'  ? '#1a2a0a' :
                       room.type === 'start' ? '#0a1a2a' : '#2e1240';
      _ctx.fillRect(rx, ry, rw, rh);
      _ctx.strokeStyle = room.type === 'boss'  ? C.rose :
                         room.type === 'shop'  ? C.mint :
                         room.type === 'start' ? C.lav  : '#4a1e60';
      _ctx.strokeRect(rx, ry, rw, rh);
      if (room.type === 'boss') _drawText('B', rx + 3, ry + 10, C.rose, 5);
      if (room.type === 'shop') _drawText('$', rx + 3, ry + 10, C.mint, 5);
    });

    // Joueur
    if (playerPos) {
      const px2 = x + playerPos.x * scale;
      const py2 = y + playerPos.y * scale;
      _ctx.fillStyle = C.rose;
      _ctx.fillRect(px2 - 2, py2 - 2, 4, 4);
      _ctx.strokeStyle = C.rosePale;
      _ctx.strokeRect(px2 - 2, py2 - 2, 4, 4);
    }
  }

  /* ──────────────────────────────────────────
     WEB AUDIO
  ────────────────────────────────────────── */
  function playSound(name) {
    try {
      if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = _audioCtx;
      const g = ctx.createGain();
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.12, ctx.currentTime);

      if (name === 'slash') {
        const o = ctx.createOscillator(); o.connect(g); o.type = 'sawtooth';
        o.frequency.setValueAtTime(440, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        o.start(); o.stop(ctx.currentTime + 0.15);
      }

      else if (name === 'heal' || name === 'petal' || name === 'levelup') {
        const freqs = name === 'levelup' ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047];
        freqs.forEach((f, i) => {
          const o = ctx.createOscillator(), gi = ctx.createGain();
          o.connect(gi); gi.connect(ctx.destination);
          o.type = 'sine'; o.frequency.value = f;
          gi.gain.setValueAtTime(0, ctx.currentTime + i * 0.07);
          gi.gain.linearRampToValueAtTime(0.08, ctx.currentTime + i * 0.07 + 0.06);
          gi.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.5);
          o.start(ctx.currentTime + i * 0.07); o.stop(ctx.currentTime + i * 0.07 + 0.52);
        });
      }

      else if (name === 'ice') {
        [880, 1320, 1760].forEach((f, i) => {
          const o = ctx.createOscillator(), gi = ctx.createGain();
          o.connect(gi); gi.connect(ctx.destination);
          o.type = 'triangle'; o.frequency.value = f;
          gi.gain.setValueAtTime(0, ctx.currentTime + i * 0.04);
          gi.gain.linearRampToValueAtTime(0.07, ctx.currentTime + i * 0.04 + 0.06);
          gi.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.04 + 0.35);
          o.start(ctx.currentTime + i * 0.04); o.stop(ctx.currentTime + i * 0.04 + 0.36);
        });
      }

      else if (name === 'lightning') {
        const o = ctx.createOscillator(); o.connect(g); o.type = 'square';
        o.frequency.setValueAtTime(220, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.04);
        o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.22);
        g.gain.setValueAtTime(0.15, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        o.start(); o.stop(ctx.currentTime + 0.26);
      }

      else if (name === 'sparkle' || name === 'menu') {
        [1046, 1318, 1568].forEach((f, i) => {
          const o = ctx.createOscillator(), gi = ctx.createGain();
          o.connect(gi); gi.connect(ctx.destination);
          o.type = 'sine'; o.frequency.value = f;
          gi.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
          gi.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.05 + 0.04);
          gi.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.25);
          o.start(ctx.currentTime + i * 0.05); o.stop(ctx.currentTime + i * 0.05 + 0.26);
        });
      }

      else if (name === 'hit') {
        const o = ctx.createOscillator(); o.connect(g); o.type = 'square';
        o.frequency.setValueAtTime(300, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        o.start(); o.stop(ctx.currentTime + 0.1);
      }

      else if (name === 'death') {
        const o = ctx.createOscillator(); o.connect(g); o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.6);
        g.gain.setValueAtTime(0.2, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
        o.start(); o.stop(ctx.currentTime + 0.7);
      }

      else if (name === 'loot') {
        [880, 1100].forEach((f, i) => {
          const o = ctx.createOscillator(), gi = ctx.createGain();
          o.connect(gi); gi.connect(ctx.destination);
          o.type = 'sine'; o.frequency.value = f;
          gi.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.12);
          gi.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
          o.start(ctx.currentTime + i * 0.12); o.stop(ctx.currentTime + i * 0.12 + 0.31);
        });
      }
    } catch (e) { /* audio bloqué, ignore */ }
  }

  /* ──────────────────────────────────────────
     UTILITAIRES
  ────────────────────────────────────────── */
  function _drawText(text, x, y, color, size = 7) {
    _ctx.font = `${size}px 'Press Start 2P', monospace`;
    _ctx.fillStyle = color;
    _ctx.fillText(text, x, y);
  }

  function _initSparkles(count = 40) {
    _sparkles = [];
    if (!_canvas) return;
    for (let i = 0; i < count; i++) {
      _sparkles.push({
        x:     Math.random() * _canvas.width,
        y:     Math.random() * _canvas.height,
        size:  Math.ceil(Math.random() * 3),
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  /* ──────────────────────────────────────────
     BOUCLE DE MISE À JOUR
  ────────────────────────────────────────── */
  function update() {
    if (!_canvas || !_ctx) return;
    _titleAnim++;
    _updateFloatingNums();
    _updateEffects();

    const t = _titleAnim;

    if (_screen === 'title')       _drawTitle(t);
    else if (_screen === 'classSelect') _drawClassSelect(t);
    else if (_screen === 'game') {
      // Le rendu du jeu lui-même est géré par les autres membres.
      // UIManager se superpose :
      drawHUD();
      _drawLog();
      _drawEffects();
      _drawFloatingNums();
    }
    else if (_screen === 'gameOver')  _drawGameOver(t);
    else if (_screen === 'victory')   _drawVictory(t);
  }

  /* ──────────────────────────────────────────
     API PUBLIQUE
  ────────────────────────────────────────── */
  function init(canvas, initialState = {}) {
    _canvas = canvas;
    _ctx    = canvas.getContext('2d');
    Object.assign(_state, initialState);
    _initSparkles(50);
    _screen = 'title';
  }

  function setState(newState) {
    Object.assign(_state, newState);
  }

  function showScreen(name) {
    _screen = name;
    if (name === 'title' || name === 'victory') _initSparkles(50);
  }

  function setMenuIndex(i) { _menuIndex = i; }
  function setSelectedClass(i) { _selectedClass = i; }
  function getSelectedClass() {
    return ['fee', 'rose', 'ombre'][_selectedClass];
  }

  /* ──────────────────────────────────────────
     EXPORT
  ────────────────────────────────────────── */
  return {
    // Init
    init,
    setState,
    showScreen,
    setMenuIndex,
    setSelectedClass,
    getSelectedClass,

    // Rendu
    update,
    drawHUD,
    drawSprite,
    renderSpriteToCanvas,
    drawMinimap,

    // Combat
    showDamage,
    addLog,
    addEffect,

    // Audio
    playSound,

    // Données sprites (pour les autres membres)
    SPRITES,
    C,
  };
})();

// Rendre global (compatibilité)
if (typeof window !== 'undefined') window.UIManager = UIManager;

// Export ESM pour React
export default UIManager;
