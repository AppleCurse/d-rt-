'use client';
import { useEffect, useRef, useState } from 'react';
import { fmt, say } from '../lib/toast';
import { logRound } from '../lib/store';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = [['A',1],['2',2],['3',3],['4',4],['5',5],['6',6],['7',7],['8',8],['9',9],['10',10],['J',11],['Q',12],['K',13]];
const FICHES = [10, 25, 50, 100, 250];

function shoe() {
  const d = [];
  for (let x = 0; x < 4; x++) SUITS.forEach(s => RANKS.forEach(r => d.push({ r: r[0], v: r[1], s })));
  for (let i = d.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}
function total(hand) {
  let t = 0, a = 0;
  hand.forEach(c => { t += Math.min(10, c.v); if (c.v === 1) a++; });
  while (a > 0 && t + 10 <= 21) { t += 10; a--; }
  return t;
}
function Card({ c, down, win }) {
  if (down) return <div className="dcc back" />;
  const red = c.s === '♥' || c.s === '♦';
  return <div className={'dcc' + (red ? ' red' : '') + (win ? ' win' : '')}><b>{c.r}</b><i>{c.s}</i></div>;
}

export default function BlackjackGame({ chips, spend, win, onClose }) {
  const S = useRef({ deck: shoe(), ph: [], dh: [], bet: 0, phase: 'bet' });
  const [, tick] = useState(0);
  const up = () => tick(x => x + 1);
  const [bet, setBet] = useState(50);
  const [msg, setMsg] = useState({ t: 'Fiş seçip “Dağıt”la başla.', cls: '' });
  const [done, setDone] = useState(''); // settle önekti

  const { ph, dh, phase } = S.current;
  const pt = total(ph), dtAll = total(dh);

  function msg2(t, cls) { setMsg({ t, cls }); }

  function deal() {
    const E = S.current;
    if (E.phase === 'play') return;
    if (!spend(bet)) { say('Yetersiz bakiye — fişi küçült.'); return; }
    E.bet = bet; E.ph = [E.deck.pop(), E.deck.pop()]; E.dh = [E.deck.pop(), E.deck.pop()];
    E.phase = 'play'; setDone('');
    if (E.deck.length < 60) E.deck = shoe();
    const P = total(E.ph), D = total(E.dh);
    if (P === 21 || D === 21) {
      E.phase = 'over';
      if (P === 21 && D === 21) settle('push');
      else if (P === 21) settle('bj');
      else settle('lose', 'Krupiyede Blackjack.');
    } else msg2('Kart çek, dur ya da ikiye katla.', '');
    up();
  }
  function hit() {
    const E = S.current; if (E.phase !== 'play') return;
    E.ph.push(E.deck.pop());
    const t = total(E.ph);
    if (t > 21) { E.phase = 'over'; settle('lose', 'Battın — ' + t + '.'); }
    else if (t === 21) stand();
    up();
  }
  function dbl() {
    const E = S.current; if (E.phase !== 'play' || E.ph.length !== 2 || chips < E.bet) return;
    spend(E.bet); E.bet *= 2;
    E.ph.push(E.deck.pop());
    say('🎩 İkiye katladın — bahis ◈ ' + fmt(E.bet) + ' dürTL.');
    if (total(E.ph) > 21) { E.phase = 'over'; settle('lose', 'Battın.'); }
    else stand();
    up();
  }
  function stand() {
    const E = S.current; if (E.phase !== 'play') return;
    E.phase = 'over';
    while (total(E.dh) < 17) E.dh.push(E.deck.pop());
    const P = total(E.ph), D = total(E.dh);
    if (D > 21) settle('win', 'Krupiye battı — ' + D + '.');
    else if (P > D) settle('win');
    else if (P < D) settle('lose');
    else settle('push');
    up();
  }
  function settle(res, note) {
    const E = S.current;
    let pay = 0, mTxt = '', cls = '';
    if (res === 'bj') { pay = Math.floor(E.bet * 2.5); mTxt = 'BLACKJACK! ◈ +' + fmt(pay - E.bet) + ' dürTL'; cls = 'win'; setDone('win'); }
    else if (res === 'win') { pay = E.bet * 2; mTxt = (note ? note + ' ' : '') + 'Kazandın: ◈ +' + fmt(E.bet) + ' dürTL'; cls = 'win'; setDone('win'); }
    else if (res === 'push') { pay = E.bet; mTxt = 'Beri — bahsin iade edildi.'; setDone(''); }
    else { mTxt = (note ? note + ' ' : '') + 'El krupiyenin.'; cls = 'lose'; setDone('lose'); }
    if (pay > 0) win(pay);
    logRound('Blackjack', E.bet, pay, res === 'bj' ? 2.5 : res === 'win' ? 2 : res === 'push' ? 1 : null);
    msg2(mTxt, cls); up();
  }
  function reset() { const E = S.current; E.ph = []; E.dh = []; E.bet = 0; E.phase = 'bet'; setDone(''); msg2('Fiş seçip “Dağıt”la başla.', ''); up(); }

  return (
    <div className="ovl" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="pnl" style={{ width: 'min(560px,100%)' }}>
        <button className="close" onClick={onClose}>✕</button>
        <span className="tag">🂡 Masa 1 · Tek koltuk</span>
        <h3>Türkçe Blackjack</h3>
        <div className="bj-felt">
          <div className="bj-row">
            <div className="bj-lbl">KRUPİYE · <span>{phase === 'play' ? (dh.length ? total([dh[0]]) + ' + ?' : '') : (dh.length ? dtAll : '')}</span></div>
            <div className="bj-hand">{dh.map((c, i) => <Card key={i} c={c} down={phase === 'play' && i === 1} win={false} />)}</div>
          </div>
          <div className={'bj-msg' + (msg.cls ? ' ' + msg.cls : '')}>{msg.t}</div>
          <div className="bj-row">
            <div className="bj-lbl">SEN · <span>{ph.length ? pt : ''}</span></div>
            <div className="bj-hand">{ph.map((c, i) => <Card key={i} c={c} win={done === 'win'} />)}</div>
          </div>
        </div>
        <div className="chiprow">{FICHES.map(n =>
          <button key={n} className={'chipB' + (n === bet ? ' on' : '')} onClick={() => phase === 'bet' && setBet(n)}>{n}</button>)}</div>
        <div className="bj-btns">
          {phase === 'bet' && <button className="btn solid" onClick={deal}>DAĞIT</button>}
          {phase === 'play' && <>
            <button className="btn" onClick={hit}>KART ÇEK</button>
            <button className="btn" onClick={stand}>DUR</button>
            {ph.length === 2 && chips >= S.current.bet && <button className="btn" onClick={dbl}>İKİYE KATLA ×2</button>}
          </>}
          {phase === 'over' && <button className="btn solid" onClick={reset}>YENİ EL</button>}
        </div>
        <div className="slot-foot"><span className="muted">Krupiye 17'de durur · Blackjack 3:2</span><span className="muted">Bakiye: ◈ {fmt(chips)} dürTL</span></div>
      </div>
    </div>
  );
}
