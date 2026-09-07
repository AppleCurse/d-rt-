'use client';
import { useRef, useState } from 'react';
import { fmt, say } from '../lib/toast';
import { logRound } from '../lib/store';

const ORD = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const FICHES = [10, 25, 50, 100, 250];
const OUTS = [
  ['red', '🔴 Kırmızı ×2', n => n !== 0 && RED.has(n) ? 2 : 0],
  ['black', '⚫ Siyah ×2', n => n !== 0 && !RED.has(n) ? 2 : 0],
  ['even', 'Çift ×2', n => n !== 0 && n % 2 === 0 ? 2 : 0],
  ['odd', 'Tek ×2', n => n % 2 === 1 ? 2 : 0],
  ['low', '1–18 ×2', n => n >= 1 && n <= 18 ? 2 : 0],
  ['high', '19–36 ×2', n => n >= 19 ? 2 : 0],
  ['doz1', '1–12 ×3', n => n >= 1 && n <= 12 ? 3 : 0],
  ['doz2', '13–24 ×3', n => n >= 13 && n <= 24 ? 3 : 0],
  ['doz3', '25–36 ×3', n => n >= 25 ? 3 : 0],
];

export default function RouletteGame({ chips, spend, win, onClose }) {
  const [bet, setBet] = useState(25);
  const [sel, setSel] = useState(null);           // {key?, num?, label}
  const [spinning, setSpinning] = useState(false);
  const [rot, setRot] = useState(0);
  const [hub, setHub] = useState({ n: '?', cls: '' });
  const [hist, setHist] = useState([]);
  const [msg, setMsg] = useState({ t: 'Bahis türünü seç, çarkı döndür.', cls: '' });
  const seg = 360 / 37;

  const discBg = 'conic-gradient(from ' + (-seg / 2) + 'deg, ' +
    ORD.map((n, i) => (n === 0 ? '#0e5c2e' : RED.has(n) ? '#7e1b1b' : '#161310') + ' ' + (i * seg) + 'deg ' + ((i + 1) * seg) + 'deg').join(', ') + ')';

  function spin() {
    if (spinning) return;
    if (!sel) { say('Önce bir bahis seç — fişin hazır.'); return; }
    if (!spend(bet)) { say('Yetersiz bakiye — fişi küçült.'); return; }
    const resIdx = Math.random() * 37 | 0, resNum = ORD[resIdx];
    // dönüş hedefi: seçili sayı üst ibreye gelsin
    const cur = ((rot % 360) + 360) % 360;
    const want = (360 - (resIdx * seg + seg / 2)) % 360;
    const delta = ((want - cur) % 360 + 360) % 360 + 360 * 5;
    setSpinning(true);
    setMsg({ t: 'Çark dönüyor, top fırlatıldı…', cls: '' });
    requestAnimationFrame(() => setRot(r => r + delta));
    setTimeout(() => settle(resNum), 4300);
  }
  function settle(n) {
    setSpinning(false);
    const col = n === 0 ? 'g' : (RED.has(n) ? 'r' : 'b');
    setHub({ n, cls: col });
    setHist(h => [n, ...h].slice(0, 14));
    const mul = sel.num != null ? (x => x === sel.num ? 36 : 0)(n) : OUTS.find(o => o[0] === sel.key)[2](n);
    const renk = n === 0 ? 'yeşil' : (col === 'r' ? 'kırmızı' : 'siyah');
    if (mul > 0) {
      const pay = bet * mul;
      win(pay);
      setMsg({ t: n + ' ' + renk + ' — kazandın! ◈ +' + fmt(pay - bet) + ' dürTL', cls: 'win' });
      logRound('Rulet', bet, pay, mul);
    } else {
      setMsg({ t: n + ' ' + renk + (n === 0 ? ' — sıfır, ev aldı.' : ' — bu el tutmadı.'), cls: 'lose' });
      logRound('Rulet', bet, 0);
    }
  }

  return (
    <div className="ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pnl" style={{ width: 'min(600px,100%)' }}>
        <button className="close" onClick={onClose}>✕</button>
        <span className="tag">🎡 Masa 2 · Tek kişilik</span>
        <h3>Avrupa Ruleti <span className="muted" style={{ fontSize: '.7rem', letterSpacing: '.1em' }}>tek 0'lı çark</span></h3>
        <div className="rw">
          <div className="rw-disc" style={{ background: discBg, transform: 'rotate(' + rot + 'deg)', transition: spinning ? 'transform 4.2s cubic-bezier(.12,.55,.16,1)' : 'none' }}>
            {ORD.map((n, i) => (
              <span key={n + '-' + i} className="rw-num" style={{ transform: 'rotate(' + (i * seg + seg / 2) + 'deg) translateX(84px) rotate(90deg)' }}>{n}</span>
            ))}
          </div>
          <div className="rw-hub" style={{ color: hub.cls === 'g' ? '#7ee2a0' : hub.cls === 'r' ? '#ff8a80' : '#f2e7c4' }}>{hub.n}</div>
          <div className="rw-pin"></div>
        </div>
        <div className={'bj-msg' + (msg.cls ? ' ' + msg.cls : '')}>{msg.t}</div>
        <div className="rou-hist">
          {hist.map((x, i) => <span key={i} className={'rchip ' + (x === 0 ? 'g' : RED.has(x) ? 'r' : 'b')}>{x}</span>)}
        </div>
        <div className="chiprow">{FICHES.map(n => <button key={n} className={'chipB' + (n === bet ? ' on' : '')} onClick={() => !spinning && setBet(n)}>{n}</button>)}</div>
        <div className="rou-bets">
          {OUTS.map(o => (
            <button key={o[0]} className={'btn' + (sel && sel.key === o[0] ? ' on' : '')} onClick={() => setSel({ key: o[0], label: o[1] })}>{o[1]}</button>
          ))}
          <select className="inp" style={{ width: 'auto', padding: '.35rem .5rem', fontSize: '.72rem' }} value={sel && sel.num != null ? sel.num : -1}
            onChange={e => { const v = +e.target.value; if (v >= 0) setSel({ num: v, label: v + ' düz sayı ×36' }); }}>
            <option value={-1}>Sayı seç · ×36</option>
            {Array.from({ length: 37 }, (_, n) => <option key={n} value={n}>{n} · ×36</option>)}
          </select>
        </div>
        <div className="bj-btns">
          <button className="btn solid" disabled={spinning} onClick={spin}>{spinning ? 'TOP DÖNÜYOR…' : 'ÇARKI DÖNDÜR'}</button>
        </div>
        <div className="slot-foot"><span className="muted">{sel ? 'Bahis: ' + sel.label + ' · fiş ◈ ' + bet : 'Bahis yok'}</span><span className="muted">Bakiye: ◈ {fmt(chips)} dürTL</span></div>
      </div>
    </div>
  );
}
