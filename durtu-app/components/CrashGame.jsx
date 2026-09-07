'use client';
// Aviator — canvas uçuş + canlı sofa (prototip paritesi)
import { useEffect, useRef, useState } from 'react';
import { say, fmt, buzz } from '../lib/toast';

const CRW = 660, CRH = 330;
const NAMES = ['M*** K***','A*** Y***','S*** D***','E*** T***','B*** Ö***','H*** Ç***','Z*** A***','K*** Ş***','N*** V***','T*** G***'];
let AC2 = null;
function ac2(){ if(!AC2) AC2 = new (window.AudioContext || window.webkitAudioContext)(); if(AC2.state==='suspended') AC2.resume(); return AC2; }
function crashPoint(){ const p = 0.97 / (1 - Math.random()); return Math.min(60, Math.max(1, Math.floor(p*100)/100)); }

export default function CrashGame({ spend, win, onClose }){
  const cvRef = useRef(null);
  const cx = useRef(null);
  const E = useRef({ running:false, cashed:false, m:1, crash:1, bet:10, oto:0, t0:0, raf:0, pts:[], hum:null });
  const sfx = useRef(true);
  const [sfxIcon, setSfxIcon] = useState(true);
  const [players, setPlayers] = useState([]);
  const playersRef = useRef([]);
  const [hist, setHist] = useState([]);
  const [running, setRunning] = useState(false);
  const [canCash, setCanCash] = useState(false);
  const [boom, setBoom] = useState('');
  const [myMsg, setMyMsg] = useState('Tur hazır. Uçak seni bekliyor.');
  const betRef = useRef(25);
  const otoRef = useRef(null);
  const cashRef = useRef(null);
  const bestsRef = useRef(0);

  function tone(f, t0, dur, type, g){
    if(!sfx.current) return;
    try{
      const a = ac2(), o = a.createOscillator(), gn = a.createGain();
      o.type = type || 'sine'; o.frequency.value = f;
      const t = a.currentTime + t0;
      gn.gain.setValueAtTime(g || .12, t);
      gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(gn); gn.connect(a.destination); o.start(t); o.stop(t + dur + .03);
    }catch(e){}
  }
  function hum(on){
    try{
      if(on && sfx.current){
        const a = ac2(), o = a.createOscillator(), g = a.createGain();
        o.type = 'sawtooth'; o.frequency.value = 52; g.gain.value = 0;
        o.connect(g); g.connect(a.destination); o.start();
        g.gain.linearRampToValueAtTime(.02, a.currentTime + .4);
        E.current.hum = { o, g };
      } else if(E.current.hum){
        const h = E.current.hum, a = ac2();
        h.g.gain.linearRampToValueAtTime(0, a.currentValueOf ? 0 : a.currentTime + .18);
        setTimeout(() => { try{ h.o.stop(); }catch(e){} }, 350);
        E.current.hum = null;
      }
    }catch(e){}
  }
  function boomSnd(){
    if(!sfx.current) return;
    try{
      const a = ac2(), len = a.sampleRate * .35, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for(let i = 0; i < len; i++) d[i] = (Math.random()*2 - 1) * Math.pow(1 - i/len, 2.2);
      const src = a.createBufferSource(), g = a.createGain(); g.gain.value = .28;
      src.buffer = buf; src.connect(g); g.connect(a.destination); src.start();
      tone(66, 0, .42, 'sine', .24); buzz([70, 55, 130]);
    }catch(e){}
  }

  function newRoundPlayers(){
    const n = 5 + (Math.random()*3 | 0), arr = [];
    for(let i = 0; i < n; i++)
      arr.push({ n: NAMES[Math.random()*NAMES.length | 0], bet: [10,25,50,100][Math.random()*4 | 0], out: crashPoint(), done:false, win:0 });
    arr.sort((a,b) => b.bet - a.bet);
    playersRef.current = arr;
    setPlayers(arr.map(p => ({ ...p })));
  }

  const mapX = (t, tV) => 26 + (t / tV) * (CRW - 110);
  const mapY = (m, mV) => CRH - 34 - (Math.log(m) / Math.log(mV)) * (CRH - 86);

  function draw(t, dead){
    const g = cx.current; if(!g) return;
    const e = E.current;
    const bg = g.createLinearGradient(0, 0, 0, CRH);
    bg.addColorStop(0, '#070a18'); bg.addColorStop(1, '#04040a');
    g.fillStyle = bg; g.fillRect(0, 0, CRW, CRH);
    const mV = Math.max(3, e.m * 1.12), tV = Math.max(6, t * 1.15);
    g.font = '10px Inter, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'middle';
    [1, 2, 3, 5, 10, 20, 50].forEach(gl => {
      if(gl > mV) return;
      const y = mapY(gl, mV);
      g.strokeStyle = 'rgba(212,175,55,.08)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(26, y); g.lineTo(CRW - 20, y); g.stroke();
      g.fillStyle = 'rgba(155,149,131,.7)'; g.fillText(gl + '×', CRW - 38, y);
    });
    g.strokeStyle = 'rgba(212,175,55,.18)';
    g.beginPath(); g.moveTo(26, CRH - 34); g.lineTo(CRW - 20, CRH - 34); g.stroke();
    if(e.pts.length > 1){
      g.save(); g.beginPath();
      e.pts.forEach((pt, i) => { const x = mapX(pt[0], tV), y = mapY(pt[1], mV); i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.strokeStyle = dead ? 'rgba(255,115,97,.85)' : '#D4AF37';
      g.lineWidth = 2.4; g.lineJoin = 'round';
      g.shadowColor = dead ? 'rgba(255,115,97,.7)' : 'rgba(212,175,55,.75)';
      g.shadowBlur = 14; g.stroke();
      g.lineTo(mapX(e.pts[e.pts.length-1][0], tV), CRH - 34); g.lineTo(mapX(0, tV), CRH - 34); g.closePath();
      const fg = g.createLinearGradient(0, 60, 0, CRH);
      fg.addColorStop(0, dead ? 'rgba(255,115,97,.1)' : 'rgba(212,175,55,.14)'); fg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = fg; g.fill(); g.restore();
      if(!dead){
        const last = e.pts[e.pts.length-1], prev = e.pts[Math.max(0, e.pts.length-6)];
        const x = mapX(last[0], tV), y = mapY(last[1], mV);
        const ang = Math.atan2(mapY(last[1], mV) - mapY(prev[1], mV), mapX(last[0], tV) - mapX(prev[0], tV));
        g.save(); g.translate(x, y); g.rotate(ang);
        g.shadowColor = '#f6e27a'; g.shadowBlur = 16; g.fillStyle = '#f6e27a';
        g.beginPath(); g.moveTo(15, 0); g.lineTo(-11, -8); g.lineTo(-4, 0); g.lineTo(-11, 8); g.closePath(); g.fill();
        g.restore();
      }
    }
    g.font = '600 30px "Playfair Display", Georgia, serif';
    g.fillStyle = dead ? '#ff7361' : '#F5F5DC';
    g.shadowColor = dead ? 'rgba(255,115,97,.6)' : 'rgba(212,175,55,.4)'; g.shadowBlur = 12;
    g.fillText(e.m.toFixed(2) + '×', 30, 48); g.shadowBlur = 0;
  }

  function loop(now){
    const e = E.current;
    if(!e.running) return;
    const t = (now - e.t0) / 1000;
    e.m = Math.exp(.14 * t);
    const m = e.m;
    if(e.hum) try{ e.hum.o.frequency.setTargetAtTime(50 + Math.min(420, (m-1)*38), ac2().currentTime, .06); }catch(_){}
    let changed = false;
    playersRef.current.forEach(p => {
      if(!p.done && m >= p.out){
        p.done = true; p.win = Math.round(p.bet * p.out); changed = true;
        if(sfx.current && Math.random() < .35) tone(620 + Math.random()*240, 0, .06, 'sine', .05);
      }
    });
    if(changed) setPlayers(playersRef.current.map(p => ({ ...p })));
    if(cashRef.current) cashRef.current.textContent = '◈ ' + fmt(Math.round(e.bet * m));
    if(e.oto > 1 && !e.cashed && m >= e.oto) doCash(true);
    if(m >= e.crash){ endRound(); return; }
    e.pts.push([t, m]); draw(t, false);
    e.raf = requestAnimationFrame(loop);
  }

  function start(){
    const e = E.current;
    if(e.running) return;
    const bet = betRef.current;
    if(!spend(bet)){ say('Yetersiz demo bakiyesi.'); return; }
    e.running = true; e.cashed = false; e.m = 1; e.bet = bet; e.crash = crashPoint(); e.pts = [[0, 1]];
    e.oto = parseFloat((otoRef.current?.value || '').replace(',', '.')) || 0;
    setRunning(true); setCanCash(true); setBoom('');
    setMyMsg('Uçak havada. Çıkışını bekle…');
    newRoundPlayers(); hum(true);
    if(cashRef.current) cashRef.current.textContent = '';
    e.t0 = performance.now();
    cancelAnimationFrame(e.raf);
    e.raf = requestAnimationFrame(loop);
    tone(520, 0, .1, 'sawtooth', .05);
  }
  function doCash(auto){
    const e = E.current;
    if(!e.running || e.cashed) return;
    e.cashed = true;
    const m = e.m, w = Math.round(e.bet * m);
    win(w);
    tone(523, 0, .15, 'triangle', .12); tone(784, .1, .25, 'triangle', .12); buzz([30, 45, 75]);
    bestsRef.current = Math.max(bestsRef.current, m);
    setCanCash(false);
    setMyMsg((auto ? 'Oto çıkış — ' : '') + m.toFixed(2) + '× noktasında indin: +' + fmt(w) + ' ◈. Temiz karar.');
    if(m >= 5) say('✈️ <b>Usta işi çıkış:</b> ' + m.toFixed(2) + '×');
  }
  function endRound(){
    const e = E.current;
    e.running = false;
    hum(false); boomSnd();
    playersRef.current.forEach(p => { if(!p.done){ p.done = true; p.win = 0; } });
    setPlayers(playersRef.current.map(p => ({ ...p })));
    setHist(h => [e.crash.toFixed(2) + '×', ...h].slice(0, 6));
    setBoom('💥 UÇTU · ' + e.crash.toFixed(2) + '×');
    draw((performance.now() - e.t0) / 1000, true);
    setMyMsg(e.cashed
      ? 'Uçak ' + e.crash.toFixed(2) + '× noktasında düştü — sen çoktan inmiştin. Dürtü bunu not etti.'
      : 'Uçak ' + e.crash.toFixed(2) + '× noktasında düştü. Bahis sofaya kaldı — nefes al, yeni tur geliyor.');
    setRunning(false); setCanCash(false);
    setTimeout(() => setBoom(''), 1700);
  }

  useEffect(() => {
    const cv = cvRef.current, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = CRW * dpr; cv.height = CRH * dpr;
    cx.current = cv.getContext('2d'); cx.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    E.current.pts = [[0, 1]]; E.current.m = 1;
    draw(0, false);
    const keyH = e => { if(e.code === 'Space'){ e.preventDefault(); start(); } };
    window.addEventListener('keydown', keyH);
    return () => {
      cancelAnimationFrame(E.current.raf);
      E.current.running = false;
      hum(false);
      window.removeEventListener('keydown', keyH);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ovl" onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div className="pnl slot-pnl">
        <button className="close" onClick={onClose}>✕</button>
        <div className="slot-head">
          <div>
            <span className="demo-badge">Demo · Gerçek para yok</span>
            <h3>✈️ Aviator <span className="muted" style={{ fontFamily: 'var(--sans)', fontSize: '.66rem', letterSpacing: '.14em' }}>· CANLI</span></h3>
          </div>
          <button className="btn ghost" style={{ padding: '.4rem .8rem' }}
            onClick={() => { sfx.current = !sfx.current; setSfxIcon(sfx.current); if(!sfx.current) hum(false); }}>
            {sfxIcon ? '🔊' : '🔇'}
          </button>
        </div>
        <p className="noteline">Seçkideki tek crash oyunu — Dürtü bilinçli seçti. Uçak kalkmadan değil, <b>düşmeden önce</b> in.</p>
        {hist.length > 0 && (
          <div className="cr-hist">{hist.map((h, i) => <span key={i} className={parseFloat(h) >= 3 ? 'hot' : ''}>{h}</span>)}</div>
        )}
        <div className="crash-wrap">
          <div className="crash-main">
            <div className="slot-stage">
              <canvas ref={cvRef} />
              {boom && <div className="stage-ovl boom"><span>{boom}</span></div>}
            </div>
          </div>
          <div className="cr-feed">
            <h6>CANLI BAHİSLER</h6>
            <div>
              {players.length === 0
                ? <div className="cr-idle">Tur başlayınca<br />sofa dolacak.</div>
                : players.map((p, i) => (
                    <div key={i} className={'crp' + (p.done ? (p.win > 0 ? ' win' : ' lose') : '')}>
                      <span>{p.n}</span><b>{p.done ? (p.win > 0 ? '+' + fmt(p.win) + ' ◈' : '✕') : '◈ ' + fmt(p.bet)}</b>
                    </div>
                  ))}
            </div>
          </div>
        </div>
        <div className="slot-hud">
          <div className="hud-box"><small>BAHİS</small>
            <select className="hud-sel" defaultValue="25" onChange={e => betRef.current = +e.target.value}>
              {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="hud-box"><small>OTO ÇIKIŞ</small>
            <input className="hud-sel" placeholder="örn. 2.00" inputMode="decimal" ref={otoRef} disabled={running} />
          </div>
          <button className="btn solid spin-btn" onClick={start} disabled={running}>UÇUR</button>
          <button className="btn spin-btn" style={{ borderColor: 'var(--gold)' }} onClick={() => doCash(false)} disabled={!canCash}>
            NAKİT ÇIKIŞ<span ref={cashRef} style={{ display: 'block', fontSize: '.62rem', opacity: .75, marginTop: '.2rem' }} />
          </button>
        </div>
        <div className="slot-foot"><span className="muted">{myMsg}</span><span className="muted">Dürtü bilir — ama söylemez.</span></div>
      </div>
    </div>
  );
}
