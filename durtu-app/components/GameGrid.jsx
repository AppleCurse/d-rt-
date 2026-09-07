'use client';
import { useEffect, useState } from 'react';
import { CATS, GAMES as FALLBACK } from '../lib/games';
import { say } from '../lib/toast';

export default function GameGrid({ onPlay }) {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [fromApi, setFromApi] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const r = await fetch('/api/games');
      const j = await r.json();
      setGames(j.data); setFromApi(true);
    } catch {
      setGames(FALLBACK); setFromApi(false);
    } finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);

  const list = games.filter(g => filter === 'all' || g.cat === filter);

  return (
    <section id="secki">
      <span className="tag">Küratörün Seçkisi {fromApi ? '· /api/games' : '· yerel yedek'}</span>
      <h2 className="sect">5.000 oyun değil. Senin için seçilmiş {games.length} oyun.</h2>
      <div className="filters">
        {CATS.map(([k, l]) => (
          <button key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</button>
        ))}
        <button className="chip" style={{ borderStyle: 'dashed' }} onClick={refresh}>🔄 Tazele</button>
      </div>
      <div className="ggrid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div className="gcard skel" key={i}><div className="skl tall" /><div className="skl" /><div className="skl w60" /></div>
            ))
          : list.map(x => (
              <div className="gcard" key={x.id} onClick={() =>
                onPlay(x.id)}>
                <div className="ic">{x.icon}</div>
                <h3>{x.name}</h3>
                <div className="meta">RTP %{x.rtp} · {x.vol}</div>
                <div className="note">“{x.note}”</div>
                <div style={{ marginTop: '1rem' }}>
                  <span className="tag" style={{ letterSpacing: '.2em' }}>
                    {x.type === 'slot' ? 'Oyna →' : x.type === 'crash' ? 'Uç →' : 'Masaya git →'}
                  </span>
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}
