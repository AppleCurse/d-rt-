'use client';
// Gerçek slot motoru — durtu/index.html prototipinden birebir port
// 5 makara × 3 satır · reel-strip mimarisi · ease-out fiziği · WILD/SCATTER ·
// ücretsiz dönüş (×2, birikimli imza çarpanı) · çarpan orbları · WebAudio sfx
import { useEffect, useRef, useState } from 'react';
import { say, fmt, buzz } from '../lib/toast';

const THEMES = {
  gates: { bg1: '#241145', bg2: '#0b0518', glow: '#a78bfa', syms: ['👑', '⚡', '💍', '🏺', '💎', '🔮'] },
  sb:    { bg1: '#45102f', bg2: '#150310', glow: '#ff6fa5', syms: ['🍭', '🍬', '🍇', '🍉', '🍎', '🍌'] },
  mt4:   { bg1: '#3a2408', bg2: '#0f0702', glow: '#f5b942', syms: ['🚂', '💰', '🤠', '🛢️', '💵', '🎰'] },
  wdw:   { bg1: '#33120e', bg2: '#0e0404', glow: '#ff7847', syms: ['💀', '🤠', '🥃', '🔫', '🌵', '🐎'] },
  sp:    { bg1: '#2a0f45', bg2: '#0d0417', glow: '#c084fc', syms: ['👸', '🌙', '💫', '🔮', '💎', '🦋'] },
  bs:    { bg1: '#2b0f14', bg2: '#0b0407', glow: '#ef4444', syms: ['🧛', '🦇', '🩸', '⚰️', '🕯️', '🧄'] },
};
const FEATS = {
  gates: { icon: '⚡', label: 'Yıldırım Çarpanı', vals: [2, 2, 3, 3, 4, 5, 6, 8, 10], base: .30, fs: .60 },
  sb:    { icon: '🍬', label: 'Şeker Bombası',   vals: [2, 3, 4, 5, 8, 10, 20],     base: .24, fs: .55 },
  mt4:   { icon: '💰', label: 'Vagon Bonusu',    vals: [2, 3, 4, 5, 6],             base: .24, fs: .50 },
  wdw:   { icon: '🔫', label: 'Düello Çarpanı',  vals: [2, 3, 4, 5, 8],             base: .24, fs: .50 },
  sp:    { icon: '💫', label: 'Prenses Işını',   vals: [2, 3, 4, 5, 6],             base: .24, fs: .50 },
  bs:    { icon: '🩸', label: 'Kan Çarpanı',     vals: [2, 3, 4, 6],                base: .24, fs: .50 },
};
const WILD = '✦', SCAT = '✨';
const PAYC = [[2, 5, 12], [1.2, 3, 8], [0.8, 2, 5], [0.5, 1.2, 3], [0.3, 0.8, 2], [0.2, 0.5, 1.5]];
const LINES = [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,1,1,0],[2,1,1,1,2],[1,1,0,1,1]];
const OX = 17, OY = 4, SW = 118, SH = 118, GAP = 9, STEP = SH + GAP, COLS = 5, ROWS = 3, LW = 660, LH = 380;

function buildStrip(theme) {
  const counts = [2, 3, 4, 5, 6, 6], arr = [];
  theme.syms.forEach((sy, i) => { for (let k = 0; k < counts[i]; k++) arr.push({ s: sy, i }); });
  arr.push({ s: WILD, i: -1 }, { s: WILD, i: -1 }, { s: SCAT, i: -2 });
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

let AC = null;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; }

export default function SlotGame({ game, spend, win, onClose }) {
  const canvasRef = useRef(null);
  const eng = useRef(null);
  const sfxRef = useRef(true);
  const [sfx, setSfx] = useState(true);
  const [ptOpen, setPtOpen] = useState(false);
  const betRef = useRef(25);
  const hud = useRef({}); // {winAmt, slotMsg, spinBtn, winHud, fsBanner, bigWin, stage}

  const theme = THEMES[game.id] || THEMES.gates;
  const feat = FEATS[game.id] || FEATS.gates;

  function tone(f, t0, dur, type, g) {
    if (!sfxRef.current) return;
    try {
      const a = ac(), o = a.createOscillator(), gn = a.createGain();
      o.type = type || 'sine'; o.frequency.value = f;
      const t = a.currentTime + t0;
      gn.gain.setValueAtTime(g || .12, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(gn); gn.connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
    } catch (e) {}
  }
  const sfxReelStop = () => { tone(82, 0, .09, 'triangle', .22); tone(48, 0, .13, 'sine', .18); buzz(8); };
  const sfxScatter = () => { tone(1318, 0, .18, 'sine', .12); tone(1760, .14, .3, 'sine', .12); };
  const sfxWinSnd = mult => {
    const sc = [523, 587, 659, 784, 880, 1047, 1175, 1319];
    const n = Math.min(sc.length, 2 + Math.ceil(mult));
    for (let i = 0; i < n; i++) tone(sc[i], i * .085, .22, 'triangle', .1);
    if (mult >= 10) for (let i = 0; i < 12; i++) tone(sc[i % sc.length] * 2, .8 + i * .06, .12, 'square', .045);
  };
  const sfxZap = () => {
    if (!sfxRef.current) return;
    try {
      const a = ac(), o = a.createOscillator(), g = a.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(1900, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(140, a.currentTime + .22);
      g.gain.setValueAtTime(.1, a.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .26);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + .3);
      tone(2500, .02, .05, 'square', .05);
    } catch (e) {}
  };
  const sfxSpinStart = () => {
    if (!sfxRef.current) return;
    try {
      const a = ac(), o = a.createOscillator(), g = a.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(140, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(640, a.currentTime + .28);
      g.gain.setValueAtTime(.07, a.currentTime);
      g.gain.exponentialRampToValueAtTime(.0001, a.currentTime + .3);
      o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + .32);
    } catch (e) {}
  };

  useEffect(() => {
    const cv = canvasRef.current, X = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = LW * dpr; cv.height = LH * dpr;
    X.setTransform(dpr, 0, 0, dpr, 0, 0);

    const E = eng.current = {
      open: true, theme, feat,
      strips: [0, 1, 2, 3, 4].map(() => buildStrip(theme)),
      pos: [0, 0, 0, 0, 0].map(() => Math.random() * 20 | 0),
      vel: [0, 0, 0, 0, 0], decel: [0, 0, 0, 0, 0], stopAt: [0, 0, 0, 0, 0], stopT: [9, 9, 9, 9, 9],
      raf: 0, lastT: performance.now(), tickIv: 0, bet: 25,
      fsPool: 0, fsMul: 1, fsAcc: 0, orbs: [], flashT: 9,
      lines: [], hlT: 0, winTarget: 0, winShown: 0, parts: [], spinning: false,
    };

    function rr(x, y, w, h, r) {
      X.beginPath();
      X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r);
      X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath();
    }
    function drawSym(sym, x, y, fast) {
      const special = sym.s === WILD || sym.s === SCAT;
      X.save(); X.translate(x + SW / 2, y + SH / 2);
      if (special) {
        const g = X.createRadialGradient(0, 0, 8, 0, 0, 52);
        g.addColorStop(0, sym.s === WILD ? 'rgba(212,175,55,.5)' : 'rgba(140,180,255,.4)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        X.fillStyle = g; X.beginPath(); X.arc(0, 4, 52, 0, 7); X.fill();
      }
      if (fast) X.scale(1, 1.22);
      X.font = (special ? 58 : 62) + 'px Georgia, serif';
      X.textAlign = 'center'; X.textBaseline = 'middle';
      if (special) { X.shadowColor = E.theme.glow; X.shadowBlur = 18; }
      X.fillText(sym.s, 0, 4);
      X.restore();
    }
    function drawReel(c) {
      const x = OX + c * (SW + GAP), winTop = OY, winH = 3 * SH + 2 * GAP, L = E.strips[c].length;
      X.save(); X.beginPath(); X.rect(x - 1, winTop, SW + 2, winH); X.clip();
      const base = Math.floor(E.pos[c]), frac = E.pos[c] - base, speed = Math.abs(E.vel[c]);
      const bounceY = E.stopT[c] < .3 ? -Math.sin(E.stopT[c] / .3 * Math.PI) * 9 : 0;
      for (let r = -1; r <= ROWS; r++) {
        const idx = ((base + r) % L + L) % L, sym = E.strips[c][idx];
        const y = winTop + (r - frac) * STEP + bounceY;
        if (y < winTop - SH || y > winTop + winH) continue;
        const fast = speed > 9;
        if (fast) {
          X.globalAlpha = .28; drawSym(sym, x, y - STEP * .5, true);
          X.globalAlpha = .6; drawSym(sym, x, y - STEP * .25, true);
          X.globalAlpha = 1;
        }
        drawSym(sym, x, y, fast);
      }
      X.restore();
    }
    function burst(x, y, n) {
      for (let i = 0; i < n; i++)
        E.parts.push({ x, y, vx: (Math.random() - .5) * 300, vy: -Math.random() * 300 - 60, g: 850, life: .85 + Math.random() * .6, r: 2.2 + Math.random() * 2.8, spark: Math.random() < .3 });
    }
    function draw() {
      const th = E.theme;
      const bg = X.createLinearGradient(0, 0, 0, LH);
      bg.addColorStop(0, th.bg1); bg.addColorStop(1, th.bg2);
      X.fillStyle = bg; X.fillRect(0, 0, LW, LH);
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
        rr(OX + c * (SW + GAP), OY + r * STEP, SW, SH, 10);
        X.fillStyle = 'rgba(255,255,255,.035)'; X.fill();
      }
      for (let c = 0; c < COLS; c++) drawReel(c);
      const sh = X.createLinearGradient(0, OY, 0, OY + 46);
      sh.addColorStop(0, 'rgba(0,0,0,.55)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
      X.fillStyle = sh; X.fillRect(0, OY, LW, 46);
      const sh2 = X.createLinearGradient(0, LH - 46, 0, LH);
      sh2.addColorStop(0, 'rgba(0,0,0,0)'); sh2.addColorStop(1, 'rgba(0,0,0,.55)');
      X.fillStyle = sh2; X.fillRect(0, LH - 46, LW, 46);
      if (E.lines.length && E.hlT < 2.2) {
        const a = .45 + .35 * Math.sin(E.hlT * 9);
        E.lines.forEach(LI => {
          X.strokeStyle = th.glow; X.globalAlpha = a; X.lineWidth = 3;
          X.shadowColor = th.glow; X.shadowBlur = 14;
          X.beginPath();
          for (let c = 0; c <= LI.count - 1; c++) {
            const px = OX + c * (SW + GAP) + SW / 2, py = OY + LI.line[c] * STEP + SH / 2;
            c ? X.lineTo(px, py) : X.moveTo(px, py);
          }
          X.stroke();
          for (let c = 0; c < LI.count; c++) { rr(OX + c * (SW + GAP), OY + LI.line[c] * STEP, SW, SH, 10); X.stroke(); }
          X.globalAlpha = 1; X.shadowBlur = 0;
        });
      }
      const now = performance.now();
      E.orbs.forEach(o => {
        const age = (now - o.born) / 1000; if (age > 2) return;
        const x = OX + o.c * (SW + GAP) + SW / 2, y = OY + o.r * STEP + SH / 2;
        const sc = Math.min(1, age / .16), fade = age > 1.3 ? Math.max(0, 1 - (age - 1.3) / .7) : 1;
        X.save(); X.globalAlpha = fade; X.translate(x, y); X.scale(sc, sc);
        X.beginPath(); X.arc(0, 0, 30, 0, 7);
        X.fillStyle = 'rgba(8,8,6,.88)'; X.fill();
        X.lineWidth = 2; X.strokeStyle = '#f6e27a'; X.shadowColor = th.glow; X.shadowBlur = 16; X.stroke();
        X.shadowBlur = 0; X.textAlign = 'center'; X.textBaseline = 'middle';
        X.font = '13px Georgia'; X.fillStyle = '#f6e27a'; X.fillText(E.feat.icon, 0, -10);
        X.font = '600 16px Georgia'; X.fillStyle = '#F5F5DC'; X.fillText('×' + o.m, 0, 9);
        X.restore();
      });
      if (E.fsPool > 0 && E.fsAcc > 0) {
        X.font = '600 13px Georgia'; X.fillStyle = '#f6e27a'; X.textAlign = 'right';
        X.shadowColor = 'rgba(212,175,55,.5)'; X.shadowBlur = 8;
        X.fillText(E.feat.icon + ' biriken ×' + E.fsAcc, LW - 24, 44); X.shadowBlur = 0;
      }
      E.parts.forEach(pt => {
        X.globalAlpha = Math.max(0, pt.life);
        X.fillStyle = pt.spark ? '#f6e27a' : '#D4AF37';
        X.beginPath(); X.arc(pt.x, pt.y, pt.r, 0, 7); X.fill();
      });
      X.globalAlpha = 1;
      if (E.flashT < .3) {
        X.fillStyle = 'rgba(246,226,122,' + (.26 * (1 - E.flashT / .3)).toFixed(3) + ')';
        X.fillRect(0, 0, LW, LH);
      }
    }

    function onSettle() {
      E.pos.forEach((pp, c) => E.pos[c] = ((pp % E.strips[c].length) + E.strips[c].length) % E.strips[c].length);
      const grid = [];
      for (let c = 0; c < COLS; c++) { grid.push([]); for (let r = 0; r < ROWS; r++) grid[c].push(E.strips[c][(E.pos[c] + r) % E.strips[c].length]); }
      const perLine = E.bet / LINES.length;
      let total = 0, scat = 0;
      grid.flat().forEach(x => { if (x.s === SCAT) scat++; });
      LINES.forEach(line => {
        const seq = line.map((r, c) => grid[c][r]);
        let symI = -1, count = 0;
        for (let c = 0; c < COLS; c++) {
          const s = seq[c];
          if (s.s === WILD) { count++; continue; }
          if (s.s === SCAT) break;
          if (symI === -1) symI = s.i;
          if (s.i === symI) count++; else break;
        }
        if (symI === -1) symI = 0;
        if (count >= 3) {
          total += perLine * PAYC[symI][count - 3] * E.fsMul;
          E.lines.push({ line, count });
        }
      });
      const fsTrig = scat >= 3;
      if (fsTrig) { if (E.fsPool === 0) E.fsAcc = 0; E.fsPool += 8; E.fsMul = 2; sfxScatter(); }

      // imza özellik: çarpan orbları
      E.orbs = [];
      let orbSum = 0;
      const inFs = E.fsMul > 1 && E.fsPool > 0, fxChance = inFs ? E.feat.fs : E.feat.base;
      if (Math.random() < fxChance) {
        const n = 1 + (Math.random() < .35 ? 1 : 0) + (Math.random() < .12 ? 1 : 0);
        const used = new Set();
        for (let k = 0; k < n; k++) {
          let c, r, key;
          do { c = Math.random() * 5 | 0; r = Math.random() * 3 | 0; key = c + '-' + r; } while (used.has(key));
          used.add(key);
          const m = E.feat.vals[Math.random() * E.feat.vals.length | 0];
          E.orbs.push({ c, r, m, born: performance.now() });
          orbSum += m;
        }
        sfxZap(); E.flashT = 0; buzz([20, 35, 55]);
      }
      let multAll = 0;
      if (total > 0) {
        if (inFs) { if (orbSum > 0) E.fsAcc += orbSum; multAll = E.fsAcc; }
        else if (orbSum > 0) multAll = orbSum;
        if (multAll > 1) {
          total = total * multAll;
          say(E.feat.icon + ' <b>' + E.feat.label + ':</b> ×' + multAll + ' çarpan devrede!');
        }
      }
      total = Math.round(total);

      const hudEls = hud.current;
      const mult = total / E.bet;
      if (total > 0) {
        win(total);
        E.winTarget = total;
        hudEls.winHud?.classList.add('hot');
        const mid = E.lines[0];
        if (mid) {
          burst(OX + 2 * (SW + GAP) + SW / 2, OY + mid.line[2] * STEP + SH / 2, mult >= 6 ? 90 : 40);
          burst(OX + SW / 2, OY + mid.line[0] * STEP + SH / 2, 22);
        }
        sfxWinSnd(mult); buzz([25, 35, 30]);
        if (hudEls.slotMsg) hudEls.slotMsg.textContent = '🎉 +' + fmt(total) + ' dürTL — ' + E.lines.length + ' çizgide kazanç' + (E.fsMul > 1 ? ' (×2)' : '');
        if (mult >= 6 && hudEls.bigWin) {
          hudEls.bigWin.innerHTML = 'BÜYÜK KAZANÇ<small>+' + fmt(total) + ' dürTL</small>';
          hudEls.bigWin.classList.remove('hiddenovl');
          hudEls.bigWin.style.display = 'flex';
          hudEls.stage?.classList.add('shake-stage');
          setTimeout(() => { hudEls.bigWin.style.display = 'none'; }, 1700);
          setTimeout(() => hudEls.stage?.classList.remove('shake-stage'), 500);
          buzz([40, 55, 40, 55, 150]);
        }
      } else if (hudEls.slotMsg) {
        hudEls.slotMsg.textContent = ['Bu tur olmadı. Dürtü sabırlı olanı sever.', 'Isınıyor…', 'Şeritler seni duyuyor, bir tur daha?'][Math.random() * 3 | 0];
      }
      if (fsTrig) say('✨ <b>Scatter!</b> 8 ücretsiz dönüş kazandın (tüm kazançlar ×2).');

      updateFsBanner();
      if (E.fsPool > 0) {
        setTimeout(() => { if (E.open && !E.spinning) doSpin(); }, 1400);
      } else {
        E.fsMul = 1;
        if (hudEls.fsBanner) hudEls.fsBanner.style.display = 'none';
        if (hudEls.spinBtn) hudEls.spinBtn.disabled = false;
      }
    }

    function updateFsBanner() {
      const b = hud.current.fsBanner; if (!b) return;
      if (E.fsPool > 0) {
        b.innerHTML = '✨ ÜCRETSİZ DÖNÜŞ ✨<small>KALAN: ' + E.fsPool + ' · ×2</small>';
        b.style.display = 'flex';
      } else b.style.display = 'none';
    }

    function doSpin() {
      if (!E.open || E.spinning) return;
      const hudEls = hud.current;
      const bet = betRef.current;
      const free = E.fsPool > 0;
      if (free) E.fsPool--;
      else if (!spend(bet)) { say('Yetersiz demo bakiyesi.'); return; }
      E.bet = bet; E.spinning = true; E.lines = []; E.hlT = 0;
      E.winTarget = 0; E.winShown = 0;
      if (hudEls.spinBtn) hudEls.spinBtn.disabled = true;
      if (hudEls.slotMsg) hudEls.slotMsg.textContent = free ? '✨ Ücretsiz dönüş (×2) — kalan: ' + E.fsPool : '…';
      hudEls.winHud?.classList.remove('hot');
      updateFsBanner();
      E.strips.forEach((st, c) => {
        const L = st.length, target = Math.random() * L | 0;
        const cur = ((E.pos[c] % L) + L) % L;
        const dist = (2 + c) * L + (((target - cur) % L) + L) % L;
        const dur = .85 + .3 * c;
        E.stopAt[c] = E.pos[c] + dist;
        E.vel[c] = 2 * dist / dur;
        E.decel[c] = E.vel[c] / dur;
      });
      sfxSpinStart();
      clearInterval(E.tickIv);
      E.tickIv = setInterval(() => tone(1150, 0, .022, 'square', .02), 85);
    }
    E.spin = doSpin;

    function loop(t) {
      if (!E.open) return;
      const dt = Math.min(.05, (t - E.lastT) / 1000 || .016);
      E.lastT = t; E.hlT += dt;
      if (E.flashT < .3) E.flashT += dt;
      let allStopped = true;
      E.strips.forEach((st, c) => {
        if (E.vel[c] > 0) {
          allStopped = false;
          E.vel[c] = Math.max(0, E.vel[c] - E.decel[c] * dt);
          E.pos[c] += E.vel[c] * dt;
          if (E.pos[c] >= E.stopAt[c] || E.vel[c] <= 0) {
            E.pos[c] = E.stopAt[c]; E.vel[c] = 0; E.stopT[c] = 0;
            sfxReelStop();
          }
        } else if (E.stopT[c] < .3) E.stopT[c] += dt;
      });
      E.parts.forEach(pt => { pt.vy += pt.g * dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt * 1.1; });
      E.parts = E.parts.filter(pt => pt.life > 0 && pt.y < LH + 20);
      if (E.winShown < E.winTarget)
        E.winShown = Math.min(E.winTarget, E.winShown + Math.max(1, E.winTarget - E.winShown) * dt * 9);
      const wa = hud.current.winAmt;
      if (wa) wa.textContent = fmt(E.winShown);
      draw();
      if (allStopped && E.spinning) { E.spinning = false; clearInterval(E.tickIv); onSettle(); }
      E.raf = requestAnimationFrame(loop);
    }
    E.raf = requestAnimationFrame(loop);

    const keyH = e => { if (e.code === 'Space') { e.preventDefault(); doSpin(); } };
    window.addEventListener('keydown', keyH);

    return () => {
      E.open = false;
      cancelAnimationFrame(E.raf);
      clearInterval(E.tickIv);
      window.removeEventListener('keydown', keyH);
      eng.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.id]);

  const tiers = ['Premium', 'Yüksek', 'Orta', 'Orta', 'Düşük', 'Düşük'];

  return (
    <div className="ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pnl slot-pnl">
        <button className="close" onClick={onClose}>✕</button>
        <div className="slot-head">
          <div>
            <span className="demo-badge">Demo · Gerçek para yok</span>
            <h3>{game.icon} {game.name}</h3>
          </div>
          <button className="btn ghost" style={{ padding: '.4rem .8rem' }}
            onClick={() => { sfxRef.current = !sfxRef.current; setSfx(sfxRef.current); }}>
            {sfx ? '🔊' : '🔇'}
          </button>
        </div>
        <p className="noteline">“{game.note}”</p>

        <div className="slot-stage" ref={el => { hud.current.stage = el; }}>
          <canvas ref={canvasRef} onClick={() => eng.current?.spin?.()} />
          <div className="stage-ovl" style={{ display: 'none' }} ref={el => { hud.current.fsBanner = el; }} />
          <div className="stage-ovl bw" style={{ display: 'none' }} ref={el => { hud.current.bigWin = el; }} />
          {ptOpen && (
            <div className="paytable">
              <h4 className="serif" style={{ color: 'var(--gold)' }}>Ödeme Tablosu</h4>
              <p className="muted" style={{ fontSize: '.64rem', marginBottom: '.6rem' }}>Katsayılar hat başına bahis üzerinden · toplam bahis = 10 hat × hat başına</p>
              {theme.syms.map((sy, i) => (
                <div className="pt-row" key={i}><span className="ps">{sy}</span><span className="pm">{tiers[i]}</span>
                  <b>3× → {PAYC[i][0]} · 4× → {PAYC[i][1]} · 5× → {PAYC[i][2]} kat</b></div>
              ))}
              <div className="pt-row"><span className="ps">✦</span><span className="pm">WILD</span><b>Scatter hariç hepsinin yerine geçer</b></div>
              <div className="pt-row"><span className="ps">✨</span><span className="pm">SCATTER</span><b>3+ = 8 ücretsiz dönüş · ×2 çarpan</b></div>
              <div className="pt-row"><span className="ps">{feat.icon}</span><span className="pm">{feat.label}</span><b>Rastgele çarpan · dönüşte birikir</b></div>
            </div>
          )}
        </div>

        <div className="slot-hud">
          <div className="hud-box"><small>BAHİS</small>
            <select className="hud-sel" defaultValue="25" onChange={e => betRef.current = +e.target.value}>
              {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="hud-box win-hud" ref={el => { hud.current.winHud = el; }}>
            <small>KAZANÇ</small><b ref={el => { hud.current.winAmt = el; }}>0</b>
          </div>
          <button className="btn solid spin-btn" ref={el => { hud.current.spinBtn = el; }}
            onClick={() => eng.current?.spin?.()}>DÖNDÜR</button>
        </div>
        <div className="slot-foot">
          <span className="muted" ref={el => { hud.current.slotMsg = el; }}>
            10 çizgi · ✦ Wild · ✨ 3+ Scatter = 8 ücretsiz dönüş · {feat.icon} {feat.label}
          </span>
          <button className="taglink" onClick={() => setPtOpen(o => !o)}>📜 Ödeme Tablosu</button>
        </div>
      </div>
    </div>
  );
}
