const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H;
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = THEME.bg; ctx.fillRect(0, 0, W, H);
}

const $ = id => document.getElementById(id);
const mouse = { x: -1e4, y: -1e4, down: false };
const ripples = [];

const THEMES = {
  neon: {
    bg: 'rgba(5,6,15,1)', fade: 'rgba(5,6,15,0.22)', tail: 4, width: 1.6, gravity: 0,
    color: (b, t) => `hsl(${(Math.atan2(b.vy, b.vx) * 57.3 + t / 40) % 360},100%,${60 + b.flash * 35}%)`,
  },
  aurora: {
    bg: 'rgba(2,10,14,1)', fade: 'rgba(2,10,14,0.07)', tail: 7, width: 1.2, gravity: 0,
    color: (b, t) => `hsl(${140 + 130 * (0.5 + 0.5 * Math.sin(Math.atan2(b.vy, b.vx) + t / 2500))},90%,${58 + b.flash * 35}%)`,
  },
  ember: {
    bg: 'rgba(12,4,2,1)', fade: 'rgba(12,4,2,0.16)', tail: 5, width: 1.8, gravity: -0.025,
    color: (b, t) => `hsl(${8 + 45 * Math.min(1, Math.hypot(b.vx, b.vy) / 3.4)},100%,${52 + b.flash * 40}%)`,
  },
};
let THEME = THEMES.neon;

const MAX_SPEED = 3.2, VISION = 55, SEP_DIST = 22, FEAR = 150;
let boids = [];
const hunter = { x: 0, y: 0, vx: 1, vy: 0, phase: 0, rest: false, trail: [] };

function spawn(n) {
  while (boids.length < n) {
    const a = Math.random() * Math.PI * 2;
    boids.push({ x: Math.random() * W, y: Math.random() * H, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2, flash: 0 });
  }
  boids.length = n;
}

function stepHunter(dt) {
  if (!$('hunter').checked) return;
  hunter.phase += dt;
  if (hunter.phase > (hunter.rest ? 3 : 7)) { hunter.rest = !hunter.rest; hunter.phase = 0; }
  let best = null, bd = Infinity;
  for (const b of boids) {
    const d = (b.x - hunter.x) ** 2 + (b.y - hunter.y) ** 2;
    if (d < bd) { bd = d; best = b; }
  }
  if (best && !hunter.rest) {
    // lead the target a little so the chase curves
    const tx = best.x + best.vx * 10, ty = best.y + best.vy * 10;
    const dx = tx - hunter.x, dy = ty - hunter.y, d = Math.hypot(dx, dy) || 1;
    hunter.vx += dx / d * 0.16; hunter.vy += dy / d * 0.16;
  }
  const sp = Math.hypot(hunter.vx, hunter.vy), max = hunter.rest ? 1.2 : 3.7;
  if (sp > max) { hunter.vx = hunter.vx / sp * max; hunter.vy = hunter.vy / sp * max; }
  hunter.x = (hunter.x + hunter.vx + W) % W; hunter.y = (hunter.y + hunter.vy + H) % H;
  hunter.trail.push(hunter.x, hunter.y);
  if (hunter.trail.length > 36) hunter.trail.splice(0, 2);
}

function step() {
  const coh = $('coh').value / 5000, sep = $('sep').value / 100, ali = $('ali').value / 1000;
  const useHunter = $('hunter').checked;
  const cell = VISION, cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
  const grid = new Array(cols * rows);
  for (const b of boids) {
    const i = (b.y / cell | 0) * cols + (b.x / cell | 0);
    (grid[i] || (grid[i] = [])).push(b);
  }
  for (const b of boids) {
    let cx = 0, cy = 0, ax = 0, ay = 0, sx = 0, sy = 0, n = 0;
    const gx = b.x / cell | 0, gy = b.y / cell | 0;
    for (let j = Math.max(0, gy - 1); j <= Math.min(rows - 1, gy + 1); j++)
      for (let i = Math.max(0, gx - 1); i <= Math.min(cols - 1, gx + 1); i++) {
        const list = grid[j * cols + i];
        if (!list) continue;
        for (const o of list) {
          if (o === b) continue;
          const dx = o.x - b.x, dy = o.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 > VISION * VISION) continue;
          n++; cx += o.x; cy += o.y; ax += o.vx; ay += o.vy;
          if (d2 < SEP_DIST * SEP_DIST && d2 > 0) { sx -= dx / d2 * SEP_DIST; sy -= dy / d2 * SEP_DIST; }
        }
      }
    if (n) {
      b.vx += (cx / n - b.x) * coh + (ax / n - b.vx) * ali + sx * sep;
      b.vy += (cy / n - b.y) * coh + (ay / n - b.vy) * ali + sy * sep;
    }
    b.vy += THEME.gravity;

    const mx = mouse.x - b.x, my = mouse.y - b.y, md = Math.hypot(mx, my);
    if (md < 250 && md > 1 && !mouse.down) { const f = 0.04 * (1 - md / 250); b.vx += mx / md * f; b.vy += my / md * f; }

    let max = MAX_SPEED;
    if (useHunter) {
      const hx = b.x - hunter.x, hy = b.y - hunter.y, hd = Math.hypot(hx, hy);
      if (hd < FEAR && hd > 1) {
        const f = (1 - hd / FEAR) * 0.9;
        b.vx += hx / hd * f; b.vy += hy / hd * f;
        b.flash = Math.min(1, b.flash + 0.25); max = MAX_SPEED + 1.2;
      }
    }
    b.flash *= 0.93;
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > max) { b.vx = b.vx / sp * max; b.vy = b.vy / sp * max; }
    b.x = (b.x + b.vx + W) % W; b.y = (b.y + b.vy + H) % H;
  }
  for (let k = ripples.length - 1; k >= 0; k--) {
    const r = ripples[k];
    r.r += 9; r.life -= 0.025;
    for (const b of boids) {
      const dx = b.x - r.x, dy = b.y - r.y, d = Math.hypot(dx, dy);
      if (Math.abs(d - r.r) < 14 && d > 1) { b.vx += dx / d * 1.6; b.vy += dy / d * 1.6; b.flash = 1; }
    }
    if (r.life <= 0) ripples.splice(k, 1);
  }
}

function draw(t) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = THEME.fade;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineWidth = THEME.width;
  ctx.lineCap = 'round';
  for (const b of boids) {
    ctx.strokeStyle = THEME.color(b, t);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * THEME.tail, b.y - b.vy * THEME.tail);
    ctx.stroke();
  }
  for (const r of ripples) {
    ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, r.life) * 0.6})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.2832); ctx.stroke();
  }
  if ($('hunter').checked) {
    ctx.lineWidth = 3;
    for (let k = 2; k < hunter.trail.length; k += 2) {
      ctx.strokeStyle = `rgba(255,70,90,${k / hunter.trail.length * 0.8})`;
      ctx.beginPath(); ctx.moveTo(hunter.trail[k - 2], hunter.trail[k - 1]); ctx.lineTo(hunter.trail[k], hunter.trail[k + 1]); ctx.stroke();
    }
    const g = ctx.createRadialGradient(hunter.x, hunter.y, 0, hunter.x, hunter.y, 26);
    g.addColorStop(0, hunter.rest ? 'rgba(255,160,160,.8)' : 'rgba(255,255,255,.95)');
    g.addColorStop(0.3, 'rgba(255,60,80,.7)'); g.addColorStop(1, 'rgba(255,60,80,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(hunter.x, hunter.y, 26, 0, 6.2832); ctx.fill();
  }
  ctx.lineWidth = 1.6;
}

addEventListener('resize', resize);
addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
addEventListener('pointerdown', e => {
  if (e.target.closest('#ui')) return;
  mouse.down = true;
  ripples.push({ x: e.clientX, y: e.clientY, r: 10, life: 1 });
});
addEventListener('pointerup', () => { mouse.down = false; });

document.querySelectorAll('[data-theme]').forEach(btn => btn.addEventListener('click', () => {
  THEME = THEMES[btn.dataset.theme];
  document.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('on', b === btn));
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = THEME.bg; ctx.fillRect(0, 0, W, H);
}));

resize();
hunter.x = W / 2; hunter.y = H / 2;
let last = performance.now();
function loop(t) {
  const dt = Math.min(0.05, (t - last) / 1000); last = t;
  spawn(+$('count').value);
  step();
  stepHunter(dt);
  draw(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
