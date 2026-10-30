import * as THREE from 'three';

const N = 140000;
const rnd = Math.random;
const gauss = () => {
  let u = 0;
  while (!u) u = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd());
};
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const WARM = [1, 0.78, 0.5], PALE = [1, 0.86, 0.64], WHITE = [0.9, 0.93, 1];
const BLUE = [0.42, 0.62, 1], PINK = [1, 0.35, 0.65], ICE = [0.65, 0.8, 1];

function build(kind) {
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N);
  let i = 0;
  const put = (x, y, z, c, k, s) => {
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    col[i * 3] = c[0] * k; col[i * 3 + 1] = c[1] * k; col[i * 3 + 2] = c[2] * k;
    size[i] = s; i++;
  };

  if (kind === 'milky') {
    const nBulge = N * 0.2 | 0, nArms = N * 0.56 | 0, nDisc = N * 0.17 | 0;
    const bar = 0.5, cb = Math.cos(bar), sb = Math.sin(bar);
    for (let n = 0; n < nBulge; n++) {
      const x = gauss() * 1.15, y = gauss() * 0.3, z = gauss() * 0.36;
      put(x * cb - z * sb, y, x * sb + z * cb, lerp3(WARM, PALE, rnd()), 0.28, 0.025 + rnd() * 0.03);
    }
    for (let n = 0; n < nArms; n++) {
      const arm = rnd() * 4 | 0, r = 0.9 + Math.pow(rnd(), 0.75) * 5.6;
      const width = 0.26 + 0.05 * r;
      const th = arm * Math.PI / 2 + 2.1 * Math.log(r / 0.9) + bar + gauss() * width / r;
      let c = lerp3(lerp3(WARM, WHITE, Math.min(1, r / 3)), BLUE, Math.max(0, (r - 3) / 4));
      let s = 0.02 + rnd() * 0.03, k = 0.6;
      const q = rnd();
      if (q < 0.06) { c = PINK; s = 0.07; k = 0.7; }
      else if (q < 0.15) { c = BLUE; s = 0.045; k = 0.85; }
      put(Math.cos(th) * r, gauss() * 0.05 * (1 + r * 0.08), Math.sin(th) * r, c, k, s);
    }
    for (let n = 0; n < nDisc; n++) {
      const r = Math.min(7, 0.5 - Math.log(1 - rnd() * 0.98) * 2.1), th = rnd() * 6.2832;
      put(Math.cos(th) * r, gauss() * 0.08, Math.sin(th) * r, lerp3(PALE, WHITE, rnd()), 0.28, 0.02);
    }
    while (i < N) {
      const x = gauss() * 3.4, y = gauss() * 2, z = gauss() * 3.4;
      put(x, y, z, WARM, 0.22, 0.016);
    }
  } else {
    const nBulge = N * 0.27 | 0, nArms = N * 0.33 | 0, nRing = N * 0.15 | 0, nDisc = N * 0.13 | 0;
    for (let n = 0; n < nBulge; n++) {
      put(gauss() * 1.1, gauss() * 0.62, gauss() * 1.1, lerp3(PALE, WARM, rnd()), 0.42, 0.025 + rnd() * 0.03);
    }
    for (let n = 0; n < nArms; n++) {
      const arm = rnd() * 2 | 0, r = 1.3 + Math.pow(rnd(), 0.8) * 6.4;
      const th = arm * Math.PI + 2.5 * Math.log(r / 1.3) + gauss() * (0.4 + 0.05 * r) / r;
      let c = lerp3(PALE, ICE, Math.min(1, r / 7)), s = 0.02 + rnd() * 0.03, k = 0.6;
      if (rnd() < 0.08) { c = PINK; s = 0.06; k = 0.6; }
      put(Math.cos(th) * r, gauss() * 0.06, Math.sin(th) * r, c, k, s);
    }
    for (let n = 0; n < nRing; n++) {
      const r = 4.4 + gauss() * 0.3, th = rnd() * 6.2832;
      const hot = rnd() < 0.12;
      put(Math.cos(th) * r, gauss() * 0.05, Math.sin(th) * r, hot ? PINK : ICE, hot ? 0.7 : 0.6, hot ? 0.06 : 0.03);
    }
    for (let n = 0; n < nDisc; n++) {
      const r = Math.min(8, 0.8 - Math.log(1 - rnd() * 0.98) * 2.6), th = rnd() * 6.2832;
      put(Math.cos(th) * r, gauss() * 0.1, Math.sin(th) * r, lerp3(PALE, WHITE, rnd()), 0.26, 0.02);
    }
    // M32 and M110, Andromeda's companion galaxies
    for (let n = 0; n < 2000; n++) put(3.4 + gauss() * 0.16, 0.5 + gauss() * 0.16, -2.6 + gauss() * 0.16, PALE, 0.5, 0.03);
    for (let n = 0; n < 2600; n++) put(-4.6 + gauss() * 0.5, -0.4 + gauss() * 0.18, 3.6 + gauss() * 0.26, WARM, 0.3, 0.025);
    while (i < N) put(gauss() * 4.6, gauss() * 2.2, gauss() * 4.6, WARM, 0.2, 0.016);
  }
  return { pos, col, size };
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
const px = Math.min(devicePixelRatio, 2);
renderer.setPixelRatio(px);
renderer.setSize(innerWidth, innerHeight);
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
const FOV = 60;
const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 200);

const A = build('milky'), B = build('andromeda');
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(A.pos, 3));
geo.setAttribute('posB', new THREE.BufferAttribute(B.pos, 3));
geo.setAttribute('colA', new THREE.BufferAttribute(A.col, 3));
geo.setAttribute('colB', new THREE.BufferAttribute(B.col, 3));
geo.setAttribute('sizeA', new THREE.BufferAttribute(A.size, 1));
geo.setAttribute('sizeB', new THREE.BufferAttribute(B.size, 1));

const mat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: {
    uMix: { value: 0 }, uTime: { value: 0 }, uTilt: { value: 0.5 }, uRoll: { value: 0 },
    uPx: { value: px }, uScale: { value: 0 },
  },
  vertexShader: `
    attribute vec3 posB; attribute vec3 colA; attribute vec3 colB;
    attribute float sizeA; attribute float sizeB;
    uniform float uMix, uTime, uTilt, uRoll, uPx, uScale;
    varying vec3 vCol;
    void main() {
      float e = uMix * uMix * (3.0 - 2.0 * uMix);
      float w = sin(3.14159 * e);
      vec3 p = mix(position, posB, e);
      float r = length(p.xz);
      // inner stars orbit slightly faster; the morph adds a swirl
      float a = uTime * (0.05 + 0.05 / (1.0 + r)) + w * 2.2 / (1.0 + 0.4 * r);
      float c = cos(a), s = sin(a);
      p = vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z);
      p.xz *= 1.0 + 0.5 * w;
      float ct = cos(uTilt), st = sin(uTilt);
      p = vec3(p.x, ct * p.y - st * p.z, st * p.y + ct * p.z);
      float cr = cos(uRoll), sr = sin(uRoll);
      p = vec3(cr * p.x - sr * p.y, sr * p.x + cr * p.y, p.z);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = clamp(mix(sizeA, sizeB, e) * uPx * uScale / -mv.z, 1.0, 36.0);
      float tw = 0.86 + 0.14 * sin(uTime * 2.0 + position.x * 37.0 + position.z * 91.0);
      vCol = mix(colA, colB, e) * tw;
    }`,
  fragmentShader: `
    varying vec3 vCol;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      float a = pow(1.0 - d * 2.0, 2.0);
      gl_FragColor = vec4(vCol * a, 1.0);
    }`,
});
scene.add(new THREE.Points(geo, mat));

const bg = new Float32Array(6000 * 3);
for (let k = 0; k < 6000; k++) {
  const v = new THREE.Vector3(gauss(), gauss(), gauss()).normalize().multiplyScalar(70 + rnd() * 20);
  bg.set([v.x, v.y, v.z], k * 3);
}
const bgGeo = new THREE.BufferGeometry();
bgGeo.setAttribute('position', new THREE.BufferAttribute(bg, 3));
scene.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({ size: 0.22, color: 0x9fb4ff, transparent: true, opacity: 0.55, depthWrite: false })));

const INFO = {
  milky: ['Milky Way', 'Barred spiral · ~100,000 light-years across · 100–400 billion stars. We live in one of the minor arms, about 26,000 light-years from the center.'],
  andromeda: ['Andromeda (M31)', 'Nearest large galaxy · 2.5 million light-years away · ~1 trillion stars. It is heading toward us and will merge with the Milky Way in about 4.5 billion years.'],
};
const VIEW = {
  milky: { tilt: 0.5, roll: 0, dist: 11 },
  andromeda: { tilt: -0.2, roll: -0.4, dist: 12.5 },
};
const title = document.getElementById('title'), desc = document.getElementById('desc'), info = document.getElementById('info');
const btns = { milky: document.getElementById('b-milky'), andromeda: document.getElementById('b-andromeda') };
let target = 0, zoom = 1;

function select(kind) {
  target = kind === 'milky' ? 0 : 1;
  for (const k in btns) btns[k].classList.toggle('on', k === kind);
  info.classList.add('swap');
  setTimeout(() => {
    title.textContent = INFO[kind][0]; desc.textContent = INFO[kind][1];
    info.classList.remove('swap');
  }, 350);
}
btns.milky.onclick = () => select('milky');
btns.andromeda.onclick = () => select('andromeda');
select('milky');

const m = { x: 0, y: 0, tx: 0, ty: 0 };
addEventListener('pointermove', e => { m.tx = e.clientX / innerWidth - 0.5; m.ty = e.clientY / innerHeight - 0.5; });
addEventListener('wheel', e => { zoom = Math.min(2, Math.max(0.35, zoom * (1 + e.deltaY * 0.001))); e.preventDefault(); }, { passive: false });
function resize() {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  mat.uniforms.uScale.value = innerHeight / (2 * Math.tan(FOV * Math.PI / 360));
}
addEventListener('resize', resize);
resize();

let last = 0;
renderer.setAnimationLoop(ms => {
  const dt = Math.min(0.05, (ms - last) / 1000); last = ms;
  const u = mat.uniforms;
  u.uMix.value += Math.sign(target - u.uMix.value) * Math.min(Math.abs(target - u.uMix.value), dt * 0.42);
  const e = u.uMix.value * u.uMix.value * (3 - 2 * u.uMix.value);
  u.uTime.value = ms / 1000;
  u.uTilt.value = VIEW.milky.tilt + (VIEW.andromeda.tilt - VIEW.milky.tilt) * e;
  u.uRoll.value = VIEW.milky.roll + (VIEW.andromeda.roll - VIEW.milky.roll) * e;
  m.x += (m.tx - m.x) * 0.05; m.y += (m.ty - m.y) * 0.05;
  const dist = (VIEW.milky.dist + (VIEW.andromeda.dist - VIEW.milky.dist) * e) * zoom;
  const az = m.x * 3.2 + ms * 0.00003, el = Math.max(0.05, Math.min(1.4, 0.45 + m.y * 1.1));
  camera.position.set(Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist);
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
});
