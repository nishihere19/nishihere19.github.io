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
  dots.appendChild(b);
});
const dotEls = [...dots.children];
const counted = new WeakSet();
function runCounters(sec) {
  sec.querySelectorAll('[data-n]').forEach((el) => {
    if (counted.has(el)) return; counted.add(el);
    const to = +el.dataset.n, suf = el.dataset.suf || '', t0 = performance.now();
    const f = (t) => { const k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString() + suf; if (k < 1) requestAnimationFrame(f); };
    reduced ? (el.textContent = to.toLocaleString() + suf) : requestAnimationFrame(f);
  });
}

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
if (!hasWebGL()) {
  document.body.classList.add('nogl');
  document.body.classList.add('plain');
  sections.forEach(runCounters);
  loader.classList.add('done'); $('#hint').remove();
  throw new Error('no-webgl');
}

/* ---------- renderer / scene ---------- */
const coarse = matchMedia('(pointer: coarse)').matches;
const lowPower = coarse || innerWidth < 800;
const canvas = $('#bg');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, powerPreference: 'high-performance' });
let dprCap = lowPower ? 1.25 : 1.5;
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

/* ---------- stage model: no native scrolling, one eased tween per stage ---------- */
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
let stage = 0, sFrom = 0, sTo = 0, tStart = 0, tDur = 1, sCur = 0, sVel = 0, lockUntil = 0, showTimer = 0;
function show(i) {
  sections.forEach((s, k) => s.classList.toggle('on', k === i));
  runCounters(sections[i]);
}
function go(to, instant = false) {
  to = Math.min(N - 1, Math.max(0, to));
  if (to === stage && !instant && Math.abs(sCur - to) < 0.001) return;
  const dist = Math.abs(to - sCur);
  stage = to; sFrom = sCur; sTo = to; tStart = performance.now();
  tDur = instant || reduced ? 1 : Math.min(2400, 1250 + dist * 260);
  lockUntil = tStart + tDur * 0.82;
  sections.forEach((s) => s.classList.remove('on'));
  clearTimeout(showTimer);
  showTimer = setTimeout(() => show(to), instant || reduced ? 0 : tDur * 0.55);
  history.replaceState(null, '', '#' + sections[to].id);
}
function step(dir) { if (performance.now() < lockUntil) return; go(stage + dir); }
const goId = (id) => { const i = sections.findIndex((s) => s.id === id); if (i >= 0) go(i); };
document.querySelectorAll('a[href^="#ch"]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); goId(a.getAttribute('href').slice(1)); }));
dotEls.forEach((d, i) => { d.onclick = () => go(i); });

/* ---------- pointer / click ---------- */
const pointer = { x: 0, y: 0 }, pSm = { x: 0, y: 0 };
addEventListener('pointermove', (e) => { pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
const bubble = $('#bubble');
const lines = ['Hi! Keep going, the best bit is Inkyora.', 'I debug with chai. Mostly.', 'Spring Boot by day, Three.js by night.', 'Ask me about DAuth, 30,000 students use it.', '25 days to 5 minutes. Yes, really.'];
let li = 0, bt = 0, waveT = 0;
const ray = new THREE.Raycaster();
canvas.addEventListener('pointerdown', (e) => {
  ray.setFromCamera(new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1), camera);
  if (ray.intersectObject(av.root, true).length) {
    bubble.textContent = lines[li++ % lines.length]; bubble.classList.add('on'); bt = 3; waveT = 1.6;
  }
});

/* ---------- input: exactly one stage per gesture ---------- */
const inScrollableCard = (el, dy) => {
  const c = el && el.closest && el.closest('.card');
  if (!c || c.scrollHeight <= c.clientHeight + 2) return false;
  return dy > 0 ? c.scrollTop + c.clientHeight < c.scrollHeight - 2 : c.scrollTop > 2;
};
addEventListener('wheel', (e) => {
  if (e.ctrlKey) return;
  if (inScrollableCard(e.target, e.deltaY)) return;
  e.preventDefault();
  if (Math.abs(e.deltaY) < 8) return;
  const now = performance.now();
  if (now < lockUntil) { lockUntil = Math.max(lockUntil, now + 200); return; } // swallow trackpad inertia
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

/* ---------- resize ---------- */
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  composer && composer.setSize(innerWidth, innerHeight);
}
addEventListener('resize', resize);

/* ---------- adaptive quality: keep the frame rate smooth on slower GPUs ---------- */
let emaDt = 1 / 60, level = 0, lastCheck = 0, bad = 0;
function governor(now) {
  if (now < 5000 || now - lastCheck < 1500) return; lastCheck = now; // ignore start-up shader compiles
  bad = emaDt > 1 / 40 ? bad + 1 : 0;
  if (bad >= 2 && level < 3) {
    bad = 0; level++;
    if (level === 1 && composer) { composer = null; }
    else if (level === 2) { renderer.setPixelRatio(Math.min(devicePixelRatio, 1)); renderer.setSize(innerWidth, innerHeight, false); }
    else if (level === 3) { scene.fog = null; }
  }
}

/* ---------- loop ---------- */
const clock = new THREE.Clock();
const tgt = new THREE.Vector3(), camPos = new THREE.Vector3(), p = new THREE.Vector3();
let facing = 0.1;
function frame(now) {
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  emaDt += (dt - emaDt) * 0.05; governor(now || performance.now());

  // eased stage tween (time based, so it is identical at any frame rate)
  const k = Math.min(1, (performance.now() - tStart) / tDur);
  const prevS = sCur;
  sCur = sFrom + (sTo - sFrom) * easeInOut(k);
  const speed = Math.abs(sCur - prevS) / Math.max(dt, 1e-3);
  sVel += (speed - sVel) * Math.min(1, dt * 10);
  const walking = Math.min(1, sVel * 1.6);

  curve.getPoint(Math.min(1, Math.max(0, sCur / (N - 1))), p);
  av.root.position.copy(p);
  const want = walking > 0.12 ? 0.95 : 0.1;
  facing += (want - facing) * (1 - Math.pow(0.02, dt));
  av.root.rotation.y = facing;

  if (waveT > 0) waveT -= dt;
  if (bt > 0 && (bt -= dt) <= 0) bubble.classList.remove('on');
  const idx = Math.round(sCur);
  const nearHello = Math.abs(sCur) < 0.25;
  av.update(dt, { walk: walking, wave: waveT > 0 || (nearHello && t > 1.2 && t < 4.5) ? 1 : 0, lookX: pSm.x, lookY: pSm.y, speed: walking, calm: reduced });
  pSm.x += (pointer.x - pSm.x) * Math.min(1, dt * 4); pSm.y += (pointer.y - pSm.y) * Math.min(1, dt * 4);

  // camera is a pure function of the smooth stage value (no extra lag => no judder)
  const portrait = innerWidth / innerHeight < 0.9;
  const dist = portrait ? 27 : 16.5;
  const shiftX = portrait ? 2.6 : -Math.min(2.8, innerWidth / 500);
  const shiftY = portrait ? -5.2 : -0.6;
  tgt.set(p.x + shiftX, p.y + 2.4 + shiftY, p.z);
  camera.position.set(p.x + shiftX * 0.6 + pSm.x * 0.6, p.y + 4.2 + pSm.y * -0.4, p.z + dist);
  camera.lookAt(tgt);

  sky.update(t, camera.position);
  world.update(t, dt, sCur);

  composer ? composer.render() : renderer.render(scene, camera);

  dotEls.forEach((d, i) => d.classList.toggle('on', i === idx));
  $('#hint').style.opacity = stage > 0 ? 0 : 1;

  window.__app = { sCur, idx, stage, fps: Math.round(1 / emaDt), level };
  requestAnimationFrame(frame);
}
// start on the stage in the URL hash (e.g. #ch3), else Hello
{ const i = sections.findIndex((s) => '#' + s.id === location.hash); stage = Math.max(0, i); sFrom = sTo = sCur = stage; tStart = performance.now() - 1e6; show(stage); }
camera.position.set(0, 6.6, 13.5);
requestAnimationFrame(frame);
document.fonts.ready.then(() => {
  setTimeout(() => { loader.classList.add('done'); window.__ready = true; }, 600);
});
