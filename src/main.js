import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createAvatar } from './avatar.js';
import { buildSky, buildWorld } from './world.js';

const N = 15;
const $ = (s) => document.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sections = [...document.querySelectorAll('.ch')];
const loader = $('#loader');
window.__ready = false;

/* ---------- UI that works without WebGL ---------- */
const dots = $('#dots');
sections.forEach((s, i) => {
  const b = document.createElement('button');
  b.setAttribute('aria-label', s.dataset.title);
  b.innerHTML = `<span>${s.dataset.title}</span>`;
  b.onclick = () => s.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  dots.appendChild(b);
});
const dotEls = [...dots.children];
const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && e.target.classList.add('in')), { threshold: 0.25 });
sections.forEach((s) => io.observe(s));
const counted = new WeakSet();
function runCounters(sec) {
  sec.querySelectorAll('[data-n]').forEach((el) => {
    if (counted.has(el)) return; counted.add(el);
    const to = +el.dataset.n, suf = el.dataset.suf || '', t0 = performance.now();
    const f = (t) => { const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString() + suf; if (k < 1) requestAnimationFrame(f); };
    reduced ? (el.textContent = to.toLocaleString() + suf) : requestAnimationFrame(f);
  });
}
sections.forEach((s) => new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && runCounters(s)), { threshold: 0.4 }).observe(s));

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
if (!hasWebGL()) {
  document.body.classList.add('nogl');
  sections.forEach((s) => s.classList.add('in'));
  sections.forEach(runCounters);
  loader.classList.add('done'); $('#hint').remove();
  throw new Error('no-webgl');
}

/* ---------- renderer / scene ---------- */
const coarse = matchMedia('(pointer: coarse)').matches;
const lowPower = coarse || innerWidth < 800;
const canvas = $('#bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: 'high-performance' });
const dprCap = lowPower ? 1.5 : 2;
renderer.setPixelRatio(Math.min(devicePixelRatio, dprCap));
renderer.setSize(innerWidth, innerHeight, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x24164d, 38, 95);
scene.add(new THREE.HemisphereLight(0xcdbdff, 0x2a1a55, 1.5));
const key = new THREE.DirectionalLight(0xfff0e0, 2.2); key.position.set(4, 8, 9); scene.add(key);
const rim = new THREE.DirectionalLight(0x7cf5e0, 1.1); rim.position.set(-6, 4, -5); scene.add(rim);
const fill = new THREE.DirectionalLight(0xf9a8d4, 0.6); fill.position.set(6, 2, 4); scene.add(fill);

const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 0.1, 1200);

// story order -> world island id
const ORDER = [0, 1, 7, 8, 5, 6, 4, 12, 13, 10, 2, 3, 14, 9, 11];
const ZS = [0, -5, 2, -7, 0, -6, 2, -5, 1, -6, 2, -4, 0, -5, 2];
const anchors = [];
ORDER.forEach((id, slot) => { anchors[id] = new THREE.Vector3(slot * 16, slot * 1.1, ZS[slot]); });
const curve = new THREE.CatmullRomCurve3(ORDER.map((id) => anchors[id].clone()), false, 'catmullrom', 0.5);

const sky = buildSky(scene);
const world = buildWorld(scene, anchors, curve, { lowPower, inkSlot: ORDER.indexOf(10) });
const av = createAvatar();
scene.add(av.root);

let composer = null;
if (!lowPower && !reduced) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.6, 0.9));
  composer.addPass(new OutputPass());
}

/* ---------- scroll mapping ---------- */
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
let tops = [];
function measure() { tops = sections.map((s) => s.offsetTop); }
measure();
addEventListener('load', measure);
function scrollS() {
  const y = scrollY + 1;
  let i = 0;
  for (let k = 0; k < tops.length; k++) if (y >= tops[k]) i = k;
  if (i >= N - 1) return N - 1;
  const f = Math.min(1, Math.max(0, (y - tops[i]) / Math.max(1, tops[i + 1] - tops[i])));
  return i + smooth(0.12, 0.88, f); // walk across most of the scroll, tiny dwell at each stop
}
let sTarget = scrollS(), sCur = reduced ? sTarget : 0;
addEventListener('scroll', () => { sTarget = scrollS(); }, { passive: true });

/* ---------- pointer / click ---------- */
const pointer = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
const bubble = $('#bubble');
const lines = ['Hi! Keep scrolling, the best bit is Inkyora.', 'I debug with chai. Mostly.', 'Spring Boot by day, Three.js by night.', 'Ask me about DAuth, 30,000 students use it.', '25 days to 5 minutes. Yes, really.'];
let li = 0, bt = 0, waveT = 0;
const ray = new THREE.Raycaster();
canvas.addEventListener('pointerdown', (e) => {
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  if (ray.intersectObject(av.root, true).length) {
    bubble.textContent = lines[li++ % lines.length]; bubble.classList.add('on'); bt = 3; waveT = 1.6;
  }
});
canvas.style.pointerEvents = 'auto';
// cards sit above the canvas; allow clicks on the avatar through empty section space
document.getElementById('story').style.pointerEvents = 'none';
document.querySelectorAll('.card').forEach((c) => (c.style.pointerEvents = 'auto'));

/* ---------- stepping: exactly one stage per gesture ---------- */
let stage = 0, lockUntil = 0;
function nearest() { const y = scrollY; let b = 0, d = 1e9; tops.forEach((t, k) => { const dd = Math.abs(t - y); if (dd < d) { d = dd; b = k; } }); return b; }
function go(to) {
  to = Math.min(N - 1, Math.max(0, to));
  stage = to; lockUntil = performance.now() + (reduced ? 150 : 750);
  sections[to].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
}
function step(dir) { if (performance.now() < lockUntil) return; go((performance.now() < lockUntil + 400 ? stage : nearest()) + dir); }
const inScrollableCard = (el, dy) => {
  const c = el.closest && el.closest('.card');
  if (!c || c.scrollHeight <= c.clientHeight + 2) return false;
  return dy > 0 ? c.scrollTop + c.clientHeight < c.scrollHeight - 2 : c.scrollTop > 2;
};
addEventListener('wheel', (e) => {
  if (e.ctrlKey) return;
  if (inScrollableCard(e.target, e.deltaY)) return;
  e.preventDefault();
  if (Math.abs(e.deltaY) < 8) return;
  const now = performance.now();
  if (now < lockUntil) { lockUntil = Math.max(lockUntil, now + 260); return; } // swallow trackpad inertia
  step(e.deltaY > 0 ? 1 : -1);
}, { passive: false });
let ty = null, tEl = null;
addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; tEl = e.target; }, { passive: true });
addEventListener('touchmove', (e) => {
  if (ty === null) return;
  const dy = ty - e.touches[0].clientY;
  if (inScrollableCard(tEl, dy)) return;
  if (e.cancelable) e.preventDefault();
}, { passive: false });
addEventListener('touchend', (e) => {
  if (ty === null) return;
  const dy = ty - e.changedTouches[0].clientY; const el = tEl; ty = null;
  if (Math.abs(dy) < 40 || inScrollableCard(el, dy)) return;
  step(dy > 0 ? 1 : -1);
}, { passive: true });
addEventListener('keydown', (e) => {
  const next = ['ArrowDown', 'PageDown', 'ArrowRight', ' '].includes(e.key), prev = ['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key);
  if (!next && !prev) return;
  e.preventDefault(); step(next ? 1 : -1);
});
dotEls.forEach((d, i) => { d.onclick = () => go(i); });

/* ---------- resize ---------- */
function resize() {
  measure(); sTarget = scrollS();
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  composer && composer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);

/* ---------- loop ---------- */
const clock = new THREE.Clock();
const tgt = new THREE.Vector3(), camPos = new THREE.Vector3(), p = new THREE.Vector3(), prev = new THREE.Vector3();
let facing = 0;
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  const prevS = sCur;
  sCur += (sTarget - sCur) * (reduced ? 1 : 1 - Math.pow(0.0015, dt));
  const speed = Math.abs(sCur - prevS) / Math.max(dt, 1e-3);
  const walking = Math.min(1, speed * 2.2);

  curve.getPoint(Math.min(1, Math.max(0, sCur / (N - 1))), p);
  av.root.position.copy(p);
  // face camera when idle, three-quarter toward path when walking
  const want = walking > 0.15 ? 0.95 : 0.1;
  facing += (want - facing) * (1 - Math.pow(0.01, dt));
  av.root.rotation.y = facing;

  if (waveT > 0) waveT -= dt;
  if (bt > 0 && (bt -= dt) <= 0) bubble.classList.remove('on');
  const idx = Math.round(sCur);
  const nearHello = Math.abs(sCur) < 0.25;
  av.update(dt, { walk: walking, wave: waveT > 0 || (nearHello && t > 1.2 && t < 4.5) ? 1 : 0, lookX: pointer.x, lookY: pointer.y, speed: walking, calm: reduced });

  const portrait = innerWidth / innerHeight < 0.9;
  const dist = portrait ? 27 : 16.5;
  const shiftX = portrait ? 2.6 : -Math.min(2.8, innerWidth / 500);
  const shiftY = portrait ? -5.2 : -0.6;
  tgt.set(p.x + shiftX, p.y + 2.4 + shiftY, p.z);
  camPos.set(p.x + shiftX * 0.6 + pointer.x * 0.6, p.y + 4.2 + pointer.y * -0.4, p.z + dist);
  camera.position.lerp(camPos, 1 - Math.pow(0.002, dt));
  camera.lookAt(tgt);

  sky.update(t, camera.position);
  world.update(t, dt, sCur);

  composer ? composer.render() : renderer.render(scene, camera);

  dotEls.forEach((d, i) => d.classList.toggle('on', i === idx));
  $('#hint').style.opacity = scrollY > 60 ? 0 : 1;

  window.__app = { sCur, idx };
  requestAnimationFrame(frame);
}
camera.position.set(anchors[0].x - 1, 6.6, 13.5);
frame();
document.fonts.ready.then(() => {
  setTimeout(() => { loader.classList.add('done'); window.__ready = true; }, 600);
});
