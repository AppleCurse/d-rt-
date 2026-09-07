'use client';
import { useState } from 'react';
import { fmt, say } from '../lib/toast';
import { logRound } from '../lib/store';

const FICHES = [10, 25, 50, 100, 250];
const MNES = [1, 3, 5, 10, 15, 20];

function mul(mines, k) {
  if (k <= 0) return 1;
  let num = 1, den = 1;
  for (let i = 0; i < k; i++) { num *= (25 - i); den *= (25 - mines - i); }
  return Math.max(1, Math.round((0.97 * num / den) * 100) / 100);
}

export default function MinesGame({ chips, spend, win, onClose }) {
  const [bet, setBet] = useState(25);
  const [mineN, setMineN] = useState(3);
  const [grid, setGrid] = useState(null);       // boolean[25] mayınlar (oyun başlayınca)
  const [opened, setOpened] = useState([]);     // açılan indeksler
  const [busted, setBusted] = useState(false);
  const [cashedV, setCashedV] = useState(false);
  const [msg, setMsg] = useState({ t: 'Bahis ve mayın sayısını seç, tarlayı başlat.', cls: '' });

  const playing = !!grid && !busted && !cashedV;
  const safeN = opened.length;
  const cur = mul(mineN, safeN);
  const left = grid ? 25 - mineN - safeN : 0;

  function start() {
    if (!spend(bet)) { say('Yetersiz bakiye — fişi küçült.'); return; }
    const g = Array(25).fill(false);
    let p = 0;
    while (p < mineN) { const i = Math.random() * 25 | 0; if (!g[i]) { g[i] = true; p++; } }
    setGrid(g); setOpened([]); setBusted(false); setCashedV(false);
    setMsg({ t: 'Tarla canlı. Karoları aç — elmas bulursan çarpan büyür.', cls: '' });
  }
  function pick(i) {
    if (!playing || opened.includes(i)) return;
    if (grid[i]) {
      setBusted(true);
      setMsg({ t: '💣 Mayın! Bahis tarlada kaldı: ◈ ' + fmt(bet) + ' dürTL.', cls: 'lose' });
      logRound('Mines', bet, 0);
      if (navigator.vibrate) navigator.vibrate([60, 50, 90]);
      return;
    }
    const no = [...opened, i];
    setOpened(no);
    const left2 = 25 - mineN - no.length;
    if (navigator.vibrate) navigator.vibrate(8);
    if (left2 === 0) cashout(no);
    else setMsg({ t: no.length + '. elmas! ' + mul(mineN, no.length).toFixed(2) + '× → bir sonraki ' + mul(mineN, no.length + 1).toFixed(2) + '× · tarlada ' + left2 + ' güvenli karo var.', cls: '' });
  }
  function cashout(openArr) {
    const arr = openArr || opened;
    if (!playing || arr.length === 0) return;
    const m = mul(mineN, arr.length), prize = Math.round(bet * m);
    win(prize);
    setCashedV(true);
    setMsg({ t: 'Kasada! ' + arr.length + ' elmas · ' + m.toFixed(2) + '× → ◈ +' + fmt(prize - bet) + ' dürTL kâr.', cls: 'win' });
    logRound('Mines', bet, prize, m);
    if (navigator.vibrate) navigator.vibrate([25, 40, 25]);
  }
  function tileContent(i) {
    if (busted || cashedV) return grid[i] ? '💣' : '💎';
    return opened.includes(i) ? '💎' : '';
  }
  function quit() {
    if (playing && safeN > 0) cashout(); // tarla açıkken çıkış = tahsilatı kaçırma
    onClose();
  }

  return (
    <div className="ovl" onClick={e => e.target === e.currentTarget && quit()}>
      <div className="pnl" style={{ width: 'min(480px,100%)' }}>
        <button className="close" onClick={quit}>✕</button>
        <span className="tag">💣 Adrenalin</span>
        <h3>Mines</h3>
        <p className="noteline">Elmasları topladıkça çarpan katlanır. İstediğin an <b>KASAYA GİR</b> — mayın geride kalanı yutar.</p>
        <div className="mn-stat">
          <div><b>{cur.toFixed(2)}×</b><small>çarpan</small></div>
          <div><b>{left > 0 ? mul(mineN, safeN + 1).toFixed(2) + '×' : '—'}</b><small>bir sonraki</small></div>
          <div><b>{safeN}</b><small>güvenli karo</small></div>
          <div><b>{playing && safeN > 0 ? '◈ ' + fmt(Math.round(bet * cur)) : '—'}</b><small>şu an tahsilat</small></div>
        </div>
        <div className="mn-grid">
          {Array.from({ length: 25 }, (_, i) => {
            const isOpen = opened.includes(i), isMine = grid && grid[i];
            let cls = 'mtile';
            if (isOpen) cls += ' safe';
            else if (busted && isMine) cls += ' mine' + (i ? '' : '');
            else if ((busted || cashedV) && isMine) cls += ' mine shown-mine';
            else if ((busted || cashedV) && !isMine) cls += ' safe shown-mine';
            return (
              <button key={i} className={cls} disabled={!playing || isOpen} onClick={() => pick(i)}
                style={(busted || cashedV) && !isOpen && !isMine ? { opacity: .4 } : undefined}>
                {tileContent(i)}
              </button>
            );
          })}
        </div>
        <div className={'bj-msg' + (msg.cls ? ' ' + msg.cls : '')}>{msg.t}</div>
        <div className="chiprow">{FICHES.map(n => <button key={n} className={'chipB' + (n === bet ? ' on' : '')} onClick={() => !grid && setBet(n)}>{n}</button>)}</div>
        <div className="mn-bar">
          <select className="inp" value={mineN} disabled={!!grid && !busted && !cashedV} onChange={e => setMineN(+e.target.value)} style={{ width: 'auto', fontSize: '.72rem', padding: '.35rem .5rem' }}>
            {MNES.map(n => <option key={n} value={n}>💣 {n} mayın</option>)}
          </select>
          {!playing && <button className="btn solid" onClick={start}>TARLAYI BAŞLAT</button>}
          {playing && <button className="btn solid" disabled={safeN === 0} onClick={() => cashout()}>KASAYA GİR</button>}
        </div>
        <div className="slot-foot"><span className="muted">Çarpanlar gerçek kombinatorik — ev payı %3</span><span className="muted">Bakiye: ◈ {fmt(chips)} dürTL</span></div>
      </div>
    </div>
  );
}
