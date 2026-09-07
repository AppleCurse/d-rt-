'use client';
import { useEffect, useRef, useState } from 'react';
import Gate from '../components/Gate';
import Salon from '../components/Salon';
import GameGrid from '../components/GameGrid';
import SlotGame from '../components/SlotGame';
import CrashGame from '../components/CrashGame';
import BlackjackGame from '../components/BlackjackGame';
import RouletteGame from '../components/RouletteGame';
import MinesGame from '../components/MinesGame';
import VaultModal from '../components/VaultModal';
import StatsModal from '../components/StatsModal';
import Ticker from '../components/Ticker';
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
  const [open, setOpen] = useState(null);          // 'crash' | 'bj' | 'rl' | 'mines' | 'vault' | 'stats'
  const chipsRef = useRef(1000);

  const setC = v => { chipsRef.current = v; setChips(v); };
  const spend = b => { if (chipsRef.current < b) return false; setC(chipsRef.current - b); return true; };
  const win = n => setC(chipsRef.current + n);

  useEffect(() => {
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.register('/sw.js').catch(() => {});
  }, []);

  useEffect(() => {
    const onSelin = e => say(e.detail);
    window.addEventListener('durtu:selin', onSelin);
    return () => window.removeEventListener('durtu:selin', onSelin);
  }, []);

  function enter(n) {
    setName(n); setEntered(true);
    setTimeout(() => say('<b>Hoş geldin, ' + n + '.</b> Bugün senin için 3 seçki hazırlandı.'), 900);
    window.scrollTo(0, 0);
  }
  function handlePlay(id) {
    if (id === 'aviator') setOpen('crash');
    else if (id === 'bj') setOpen('bj');
    else if (id === 'rl') setOpen('rl');
    else if (id === 'mines') setOpen('mines');
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
          <button className="btn btn-sm" onClick={() => setOpen('vault')}
            style={{ padding: '.32rem .7rem', fontSize: '.66rem', background: 'rgba(212,175,55,.14)', border: '1px solid var(--gold)', color: 'var(--gold)', borderRadius: 6, cursor: 'pointer', fontWeight: 600, letterSpacing: '.08em' }}>
            + KASA
          </button>
          <span className="hc" onClick={() => setOpen('stats')} title="Dürtü Raporun" style={{ cursor: 'pointer' }}>◈ {fmt(chips)} dürTL</span>
          <span className="hc" style={{ color: 'var(--cream)' }}>{name}</span>
        </div>
      </nav>
      <main>
        <Salon name={name} chips={chips} onPlay={handlePlay} />
        <GameGrid onPlay={handlePlay} />
      </main>
      <footer style={{ paddingBottom: 40 }}>
        <div className="serif" style={{ color: 'var(--gold)', letterSpacing: '.3em', marginBottom: '.5rem' }}>✦ DÜRTÜ</div>
        <p>React/Next.js portu — konsept demosu; gerçek para kullanılmaz.<br />18+ • Sorumlu oyun: limitlerini belirle, ara vermekten çekinme.</p>
      </footer>
      <Ticker />
      {game && <SlotGame game={game} spend={spend} win={win} onClose={() => setSlotId(null)} />}
      {open === 'crash' && <CrashGame spend={spend} win={win} onClose={() => setOpen(null)} />}
      {open === 'bj' && <BlackjackGame chips={chips} spend={spend} win={win} onClose={() => setOpen(null)} />}
      {open === 'rl' && <RouletteGame chips={chips} spend={spend} win={win} onClose={() => setOpen(null)} />}
      {open === 'mines' && <MinesGame chips={chips} spend={spend} win={win} onClose={() => setOpen(null)} />}
      {open === 'vault' && <VaultModal chips={chips} spend={spend} win={win} onClose={() => setOpen(null)} />}
      {open === 'stats' && <StatsModal name={name} chips={chips} onClose={() => setOpen(null)} />}
      <Chat name={name} />
      <Toasts />
    </>
  );
}
