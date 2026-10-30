const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let W, H;
function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = innerWidth; H = innerHeight;
  canvas.width = W * dpr; canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

const $ = id => document.getElementById(id);
const mouse = { x: -1e4, y: -1e4, down: false };
addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
addEventListener('pointerdown', e => { if (!e.target.closest('#ui')) mouse.down = true; });
addEventListener('pointerup', () => { mouse.down = false; });

const MAX_SPEED = 3.2, VISION = 55, SEP_DIST = 22;
let boids = [];

function spawn(n) {
  while (boids.length < n) {
    const a = Math.random() * Math.PI * 2;
    boids.push({ x: Math.random() * W, y: Math.random() * H, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2 });
  }
  boids.length = n;
}

function step() {
  const coh = $('coh').value / 5000, sep = $('sep').value / 100, ali = $('ali').value / 1000;
  // spatial grid keeps neighbor lookups fast with ~1000 boids
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
    const mx = mouse.x - b.x, my = mouse.y - b.y, md = Math.hypot(mx, my);
    if (md < 250 && md > 1) {
      const f = (mouse.down ? -1.2 : 0.04) * (1 - md / 250);
      b.vx += mx / md * f * (mouse.down ? 3 : 1); b.vy += my / md * f * (mouse.down ? 3 : 1);
    }
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > MAX_SPEED) { b.vx = b.vx / sp * MAX_SPEED; b.vy = b.vy / sp * MAX_SPEED; }
    b.x = (b.x + b.vx + W) % W; b.y = (b.y + b.vy + H) % H;
  }
}

function draw(t) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(5,6,15,0.22)';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  for (const b of boids) {
    const ang = Math.atan2(b.vy, b.vx);
    const hue = (ang * 57.3 + t / 40) % 360;
    ctx.strokeStyle = `hsl(${hue},100%,60%)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 4, b.y - b.vy * 4);
    ctx.stroke();
  }
}

function loop(t) {
  spawn(+$('count').value);
  step();
  draw(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
