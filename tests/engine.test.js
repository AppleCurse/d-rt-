// DÜRTÜ oyun motoru regresyon testleri — saf Node, bağımlılıksız.
// Kullanım:  node tests/engine.test.js   (CI: .github/workflows/test.yml)
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- 1) index.html içinden <script> gövdesini sökmek ---------- */
const html = fs.readFileSync(path.join(__dirname, '..', 'durtu', 'index.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('❌ <script> bloğu bulunamadı'); process.exit(1); }
const appJs = m[1];

/* ---------- 2) Minimal DOM / tarayıcı taklidi ---------- */
const els = {};
function mkEl(id) {
  return {
    id, style: {}, dataset: {}, disabled: false, value: '', textContent: '', innerHTML: '',
    classList: {
      _s: new Set(),
      add(...c) { c.forEach(x => this._s.add(x)); },
      remove(...c) { c.forEach(x => this._s.delete(x)); },
      toggle(c, f) { f ? this._s.add(c) : this._s.delete(c); },
      contains(c) { return this._s.has(c); }
    },
    insertAdjacentHTML() {}, appendChild() {}, addEventListener() {}, removeEventListener() {},
    querySelectorAll() { return []; }, querySelector() { return null; }, getElementsByClassName() { return []; },
    getContext() {
      const grad = { addColorStop() {} };
      return new Proxy({}, {
        get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient') ? (() => grad) : () => {},
        set() { return true; }
      });
    },
    getBoundingClientRect() { return { width: 660, height: 330, left: 0, top: 0 }; },
    setAttribute() {}, focus() {}, scrollIntoView() {}
  };
}
const document = {
  getElementById: id => els[id] || (els[id] = mkEl(id)),
  querySelectorAll: () => [], querySelector: () => null,
  getElementsByClassName: () => [], createElement: () => mkEl('tmp'),
  addEventListener() {}, body: mkEl('body'), documentElement: mkEl('html')
};
const ACStub = function () {
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect() { return node(); }, start() {}, stop() {}, frequency: param(), gain: param(), Q: param(), detune: param(), type: '', buffer: null, loop: false });
  return { currentTime: 0, state: 'running', createOscillator: node, createGain: node, createBiquadFilter: node, createBufferSource: node,
    createBuffer: () => ({ getChannelData: () => new Float32Array(8) }), destination: {}, resume: () => Promise.resolve() };
};
const localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
let NOW = 1000; let RAFQ = [];
const performance = { now: () => NOW };
const requestAnimationFrame = cb => { RAFQ.push(cb); return RAFQ.length; };
const cancelAnimationFrame = () => {};
const IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
const MutationObserver = class { observe() {} disconnect() {} };
const fetch = () => Promise.reject(new Error('ağ yok (test)'));
const navigator = { maxTouchPoints: 0, vibrate() { return true; } };
const window = { addEventListener() {}, AudioContext: ACStub, webkitAudioContext: ACStub, devicePixelRatio: 1, innerWidth: 1200, scrollTo() {}, requestAnimationFrame };
globalThis.setTimeout = () => 0; globalThis.setInterval = () => 0; globalThis.clearInterval = () => {};

/* ---------- 3) Uygulamayı bu bağlamda çalıştır ---------- */
const run = new Function('document', 'window', 'localStorage', 'navigator', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame', 'IntersectionObserver', 'MutationObserver', 'fetch', 'AudioContext', 'webkitAudioContext',
  appJs + '; return { state, CR, BJ, ROU, ST: st, crStart, crCash, crQuit, crEnd: (typeof crEnd!=="undefined")?crEnd:null, openCrash, bjTotal: (typeof bjTotal!=="undefined")?bjTotal:null, bjSettle, bjOpen, rouPays, logRound, minesMul: typeof mnMul !== \"undefined\" ? mnMul : null }');
let app;
try {
  app = run(document, window, localStorage, navigator, performance, requestAnimationFrame, cancelAnimationFrame, IntersectionObserver, MutationObserver, fetch, ACStub, ACStub);
} catch (e) {
  console.error('❌ Uygulama test bağlamında yüklenemedi:', e.stack);
  process.exit(1);
}

/* ---------- 4) Test altyapısı ---------- */
let pass = 0, fail = 0;
function T(name, cond, extra) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (extra ? '  →  ' + extra : '')); }
}
function stepFrames(n) { for (let i = 0; i < n; i++) { const q = RAFQ; RAFQ = []; q.forEach(cb => cb(NOW)); NOW += 50; } }
function stepUntil(cond) { let g = 0; while (RAFQ.length && g++ < 4000 && !cond()) stepFrames(1); }

const { state, CR, BJ, ST, bjTotal } = app;

/* ---------- 5) CRASH (Aviator) — para akışı ---------- */
console.log('\n✈️  Aviator (crash) akışı:');
{
  state.entered = true; state.chips = 1000;
  app.openCrash();
  document.getElementById('crBet').value = '10';

  // A) normal çıkış
  app.crStart(); CR.crash = 50;
  stepFrames(5); stepUntil(() => CR.m >= 1.5);
  const expA = 990 + Math.round(10 * CR.m);
  app.crCash(); stepFrames(2);
  T('Bahis düşer ve çıkışta iade edilir (10 @ 1.5x)', state.chips === expA, `beklenen ${expA}, gerçek ${state.chips}`);
  T('Nakit çıkışı çifte ödeme yapmaz', (() => { const b = state.chips; app.crCash(); return state.chips === b; })());

  // B) kayıp turu hiçbir kredilendirme yapmasın
  stepUntil(() => !CR.running);
  state.chips = 1000;
  app.crStart(); CR.crash = 1.3;
  stepUntil(() => !CR.running);
  T('Patlayan tur: para yutulmaz, bakiye bahis kadar düşük kalır', state.chips === 990, `gerçek ${state.chips}`);
  T('Geç basım mesaj verir ve kredilemez', (() => { const b = state.chips; app.crCash(); return state.chips === b; })());

  // C) uçuş ortasında çıkış = otomatik tahsilat
  stepUntil(() => false) || 0;
  state.chips = 1000;
  app.crStart(); CR.crash = 60;
  stepFrames(5); stepUntil(() => CR.m >= 2.0);
  const mC = CR.m, expC = 990 + Math.round(10 * mC);
  app.crQuit();
  T('Tur ortasında pencere kapama → oto-tahsilat', state.chips === expC, `beklenen ${expC}, gerçek ${state.chips}`);
  stepUntil(() => !CR.running);
}

/* ---------- 6) BLACKJACK — puanlama ve ödemeler ---------- */
console.log('\n🂡 Blackjack:');
{
  const C = v => ({ r: '?', v, s: '♠' });
  T('A+K = 21', bjTotal([C(1), C(13)]) === 21);
  T('A+A+9 = 21 (soft hesap)', bjTotal([C(1), C(1), C(9)]) === 21);
  T('10+10+5 = 25 (batış)', bjTotal([C(10), C(10), C(5)]) === 25);
  T('A+6 = soft 17', bjTotal([C(1), C(6)]) === 17);

  // Ödeme tablosu: BJ 2.5×, kazanç 2×, beri 1×, kayıp 0
  const cases = [['bj', 100, 250], ['win', 100, 200], ['push', 100, 100], ['lose', 100, 0]];
  cases.forEach(([res, bet, cred]) => {
    BJ.bet = bet; state.chips = 1000;
    app.bjSettle(res);
    T(`ödeme ${res}: bahis ${bet} → iade ${cred}`, state.chips === 1000 + cred, `gerçek ${state.chips}`);
  });
}

/* ---------- 7) RULET — ödeme matrisi ---------- */
console.log('\n🎡 Rulet:');
{
  const P = app.rouPays; // bet-type → (n → multiplier)
  const reds = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  T('kırmızı 7 için ×2', P('red')(7) === 2);
  T('kırmızıya siyah 8 gelince 0', P('red')(8) === 0);
  T('sıfır dış bahisleri kaybeder (red 0)', P('red')(0) === 0);
  T('tek sayı ×36 (num:17 → 17)', P('num:17')(17) === 36 && P('num:17')(18) === 0);
  T('1. düzine 13 gelirse 0', P('doz1')(13) === 0 && P('doz1')(5) === 3);
  T('19–36, 18 gelince 0; 36 gelince ×2', P('high')(18) === 0 && P('high')(36) === 2);
  T('tek/çift 0 gelince 0', P('even')(0) === 0 && P('odd')(0) === 0);
  // kapsamlı: tüm 0..36 için tutarlılık ölçüsü (negatif multiplier asla yok)
  let ok = true;
  ['red','black','even','odd','low','high','doz1','doz2','doz3'].forEach(b => { for (let n = 0; n <= 36; n++) if (P(b)(n) < 0) ok = false; });
  T('Ödeme matrisi hiçbir sayıda negatif değil', ok);
}

/* ---------- 8) Geçmiş (hist) ---------- */
console.log('\n📜 Tur geçmişi:');
{
  ST().hist.length = 0;
  for (let i = 0; i < 90; i++) app.logRound('Test', 10, i % 2 ? 20 : 0, null);
  const h = ST().hist;
  T('80 turda sınanır (şişmez)', h.length === 80, `boy ${h.length}`);
  T('En yeni en başta', h[0].win === 20 && h[1].win === 0, `h0=${h[0].win} h1=${h[1].win}`);
}


/* ---------- 8.5) MINES — adil çarpan matrisi ---------- */
console.log('\n💣 Mines:');
{
  const M = app.minesMul;
  T('İlk elmas: 3 mayında ~1.10× başlar', Math.abs(M(3,1) - 1.10) < 0.02, 'geç: ' + M(3,1));
  let mono = true, prev = 0;
  for(let k = 1; k <= 22; k++){ const v = M(3,k); if(v <= prev) mono = false; prev = v; }
  T('Çarpan artan eldizilim (3 mayın, 22 güvenli)', mono);
  T('1 mayında tüm tarla: son ~24.25×', Math.abs(M(1,24) - 0.97*25) < 0.6, 'geç: ' + M(1,24));
  T('20 mayında 4 güvenli karoda yüklü çarpan', M(20,4) > 5, 'geç: ' + M(20,4).toFixed(2));
}

/* ---------- 9) Sonuç ---------- */
console.log(`\n${'='.repeat(44)}\nSONUÇ: ${pass} geçti, ${fail} kaldı`);
process.exit(fail ? 1 : 0);
