'use client';
import { useEffect, useRef, useState } from 'react';
import Gate from '../components/Gate';
import Salon from '../components/Salon';
import GameGrid from '../components/GameGrid';
import SlotGame from '../components/SlotGame';
import CrashGame from '../components/CrashGame';
import Chat from '../components/Chat';
import AmbienceBtn from '../components/AmbienceBtn';
import Toasts from '../components/Toasts';
import { GAMES } from '../lib/games';
import { fmt, say } from '../lib/toast';

export default function Page() {
  const [entered, setEntered] = useState(false);
  const [name, setName] = useState('Misafir');
  const [chips, setChips] = useState(1000);
  const [slotId, setSlotId] = useState(null);
  const [crashOpen, setCrashOpen] = useState(false);
  const chipsRef = useRef(1000);

  const setC = v => { chipsRef.current = v; setChips(v); };
  const spend = b => { if (chipsRef.current < b) return false; setC(chipsRef.current - b); return true; };
  const win = n => setC(chipsRef.current + n);

  useEffect(() => {
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  function enter(n) {
    setName(n); setEntered(true);
    setTimeout(() => say('<b>Hoş geldin, ' + n + '.</b> Bugün senin için 3 seçki hazırlandı.'), 900);
    window.scrollTo(0, 0);
  }
  function handlePlay(id) {
    if (id === 'aviator') setCrashOpen(true);
    else setSlotId(id);
  }

  const game = slotId ? GAMES.find(g => g.id === slotId) : null;

  if (!entered) return (<><Gate onEnter={enter} /><Toasts /></>);

  return (
    <>
      <nav>
        <div className="nav-logo serif" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>✦ DÜRTÜ</div>
        <div style={{ display: 'flex', gap: '.6rem', alignItems: 'center' }}>
          <AmbienceBtn />
          <span className="hc">◈ {fmt(chips)} dürTL</span>
          <span className="hc" style={{ color: 'var(--cream)' }}>{name}</span>
        </div>
      </nav>
      <main>
        <Salon name={name} chips={chips} onPlay={handlePlay} />
        <GameGrid onPlay={handlePlay} />
      </main>
      <footer>
        <div className="serif" style={{ color: 'var(--gold)', letterSpacing: '.3em', marginBottom: '.5rem' }}>✦ DÜRTÜ</div>
        <p>React/Next.js portu — konsept demosu; gerçek para kullanılmaz.<br />18+ • Sorumlu oyun: limitlerini belirle, ara vermekten çekinme.</p>
      </footer>
      {game && <SlotGame game={game} spend={spend} win={win} onClose={() => setSlotId(null)} />}
      {crashOpen && <CrashGame spend={spend} win={win} onClose={() => setCrashOpen(false)} />}
      <Chat name={name} />
      <Toasts />
    </>
  );
}
