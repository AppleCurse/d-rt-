// Ortak oyun kaydı + Selin'in gözlemcisi (React port)
export function blank() { return { spins: 0, wagered: 0, won: 0, big: 0, hist: [] }; }
export function stats() {
  try {
    const s = JSON.parse(localStorage.getItem('durtu_react_stats') || 'null');
    if (s && Array.isArray(s.hist)) return s;
  } catch (e) {}
  return blank();
}
export function saveStats(s) { try { localStorage.setItem('durtu_react_stats', JSON.stringify(s)); } catch (e) {} }

let _selinT = 0;
export function logRound(game, bet, win, mul) {
  if (typeof window === 'undefined') return;
  const s = stats();
  s.hist.unshift({ ts: Date.now(), game, bet, win, mul: mul || null });
  if (s.hist.length > 80) s.hist.length = 80;
  s.spins++; s.wagered += bet; s.won += win;
  s.big = Math.max(s.big, Math.max(0, win - bet));
  saveStats(s);

  if (win > 0)
    window.dispatchEvent(new CustomEvent('durtu:tick', { detail: { who: 'Sen', game, amt: win, mul } }));

  // Selin'in proaktif sesi: 4 ve 7 ardışık kayıpta ilgilenir (2 dk sükûnet)
  let streak = 0;
  for (const h of s.hist) { if (h.win > 0) break; streak++; }
  const now = Date.now();
  if ((streak === 4 || streak === 7) && now - _selinT > 120000) {
    _selinT = now;
    const msg = streak >= 7
      ? '💬 Selin: yedi turdur kazanın yok. Ara vermek zayıflık değil, disiplindir — rapora bakmak ister misin?'
      : '💬 Selin: "' + game + '" tarafında 4 eldir şansın yok. İstersen cazı açıp başka masaya geçelim?';
    window.dispatchEvent(new CustomEvent('durtu:selin', { detail: msg }));
  }
}

export function ledger() {
  try { return JSON.parse(localStorage.getItem('durtu_react_ledger') || '[]'); } catch (e) { return []; }
}
export function addLedger(type, label, amt, status) {
  const l = ledger();
  l.unshift({ ts: Date.now(), type, label, amt, status: status || 'ok' });
  if (l.length > 60) l.length = 60;
  try { localStorage.setItem('durtu_react_ledger', JSON.stringify(l)); } catch (e) {}
}
