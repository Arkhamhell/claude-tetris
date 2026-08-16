'use strict';

// Visual skins for the Tetris board. Loaded BEFORE game.js so that
// getTheme()/getSkin()/setSkin() are available when game.js's drawing
// functions run.

const SKIN_KEY = 'tetris.skin';

function drawBlockRetro(ctx, px, py, size, color, alpha) {
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
  // highlight
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(px + 1, py + 1, size - 2, 4);
  ctx.globalAlpha = 1;
}

function drawBlockNeon(ctx, px, py, size, color, alpha) {
  // save/restore scopes shadowBlur/shadowColor to this block only, so the
  // glow can never bleed into the grid lines or neighboring blocks.
  ctx.save();
  ctx.globalAlpha = alpha ?? 1;
  ctx.shadowBlur = 12;
  ctx.shadowColor = color;
  ctx.fillStyle = color;
  ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
  ctx.restore();
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  // manual fallback for browsers without CanvasRenderingContext2D#roundRect
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBlockPastel(ctx, px, py, size, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha ?? 1;
  const x = px + 2, y = py + 2, w = size - 4, h = size - 4;
  const r = Math.max(2, Math.min(6, w / 3, h / 3));
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
  // soft highlight band
  roundedRectPath(ctx, x, y, w, Math.max(2, h * 0.35), r);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();
  ctx.restore();
}

function drawBlockPixel(ctx, px, py, size, color, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha ?? 1;
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
  // dark bevel border to sell the "chunky pixel" look
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
  // scanline texture
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  const step = Math.max(4, Math.floor(size / 6));
  for (let ly = py + step; ly < py + size - 1; ly += step * 2) {
    ctx.fillRect(px + 1, ly, size - 2, Math.max(1, Math.floor(step / 2)));
  }
  // bright pixel dot, top-left
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(px + 3, py + 3, Math.max(2, step - 2), Math.max(2, step - 2));
  ctx.restore();
}

const THEMES = {
  retro: {
    // same 8 colors as game.js's original COLORS (index 0 = empty)
    colors: [
      null,
      '#4dd0e1', // I - cyan
      '#ffd54f', // O - yellow
      '#ba68c8', // T - purple
      '#81c784', // S - green
      '#e57373', // Z - red
      '#90caf9', // J - pale blue
      '#ffb74d', // L - orange
    ],
    // getters (not plain values) so the pre-existing light/dark mode toggle
    // (`body.light`, unrelated to skins) keeps working exactly as before for
    // the default retro skin.
    get gridColor() {
      return document.body.classList.contains('light') ? '#dcdce6' : '#22222e';
    },
    get background() {
      return document.body.classList.contains('light') ? '#ffffff' : '#1a1a25';
    },
    bodyClass: 'skin-retro',
    drawBlock: drawBlockRetro,
  },
  neon: {
    colors: [
      null,
      '#00fff9', // I - electric cyan
      '#faff00', // O - electric yellow
      '#ff00ea', // T - magenta
      '#00ff85', // S - electric green
      '#ff2b2b', // Z - electric red
      '#2b6bff', // J - electric blue
      '#ff8c00', // L - electric orange
    ],
    gridColor: '#141420',
    background: '#000000',
    bodyClass: 'skin-neon',
    drawBlock: drawBlockNeon,
  },
  pastel: {
    colors: [
      null,
      '#a8d8ea', // I - pastel blue
      '#fff3b0', // O - pastel yellow
      '#d5aaff', // T - pastel purple
      '#b5ead7', // S - pastel green
      '#ffb7b2', // Z - pastel red
      '#c7ceea', // J - pastel periwinkle
      '#ffdac1', // L - pastel orange
    ],
    gridColor: '#e4dcea',
    background: '#fdf9f5',
    bodyClass: 'skin-pastel',
    drawBlock: drawBlockPastel,
  },
  pixel: {
    colors: [
      null,
      '#00e5ff', // I
      '#ffe600', // O
      '#b829e6', // T
      '#4caf50', // S
      '#f44336', // Z
      '#2979ff', // J
      '#ff9800', // L
    ],
    gridColor: '#000000',
    background: '#0d0d1a',
    bodyClass: 'skin-pixel',
    drawBlock: drawBlockPixel,
  },
};

// getTheme() is called from drawBlock() for every single block, up to ~60
// times/second while the game loop runs, so cache the resolved skin name in
// memory instead of hitting localStorage on every draw call.
let skinCache = null;

function getSkin() {
  if (skinCache && THEMES[skinCache]) return skinCache;
  const stored = localStorage.getItem(SKIN_KEY);
  skinCache = THEMES[stored] ? stored : 'retro';
  return skinCache;
}

function setSkin(name) {
  if (!THEMES[name]) return;
  localStorage.setItem(SKIN_KEY, name);
  skinCache = name;
}

function getTheme() {
  return THEMES[getSkin()];
}

function applySkinBodyClass(theme) {
  Object.keys(THEMES).forEach(key => document.body.classList.remove(THEMES[key].bodyClass));
  document.body.classList.add(theme.bodyClass);
}

function applySkin(name) {
  setSkin(name);
  const theme = getTheme();
  applySkinBodyClass(theme);
  const select = document.getElementById('skin-select');
  if (select) select.value = getSkin();
  // repaint immediately without touching game state / without calling init()
  if (typeof current !== 'undefined' && current) {
    draw();
    drawNext();
  }
}

(function initSkinUI() {
  applySkinBodyClass(getTheme());
  const select = document.getElementById('skin-select');
  if (select) {
    select.value = getSkin();
    select.addEventListener('change', () => applySkin(select.value));
  }
})();
