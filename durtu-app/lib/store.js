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

/* ================= GÜNLÜK GİRİŞ / CHECK-IN VE PROFİL ================= */
export const DAILY_REWARDS = [
  { day: 1, bonus: 100, label: '1. Gün', icon: '☀️' },
  { day: 2, bonus: 125, label: '2. Gün', icon: '✨' },
  { day: 3, bonus: 150, label: '3. Gün', icon: '🔥' },
  { day: 4, bonus: 175, label: '4. Gün', icon: '⚡' },
  { day: 5, bonus: 200, label: '5. Gün', icon: '💎' },
  { day: 6, bonus: 225, label: '6. Gün', icon: '🌟' },
  { day: 7, bonus: 250, label: '7. Gün VIP', icon: '👑' },
];

export function getBonusForStreak(streak) {
  const s = Math.max(1, streak || 1);
  if (s >= 7) return 250;
  return DAILY_REWARDS[s - 1]?.bonus || (100 + (s - 1) * 25);
}

export function getTodayKey(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayKey() {
  const y = new Date(Date.now() - 86400000);
  return getTodayKey(y);
}

export function getProfile() {
  if (typeof window === 'undefined') {
    return { name: 'Misafir', chips: 1000, streakDays: 0, lastCheckInDate: null, lastCheckInTime: null, lastCheckInBonus: 0 };
  }
  try {
    const raw = localStorage.getItem('durtu_react_profile');
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p === 'object' && p !== null) {
        if (typeof p.chips !== 'number') p.chips = 1000;
        return p;
      }
    }
  } catch (e) {}
  return { name: 'Misafir', chips: 1000, streakDays: 0, lastCheckInDate: null, lastCheckInTime: null, lastCheckInBonus: 0 };
}

export function saveProfile(p) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('durtu_react_profile', JSON.stringify(p));
  } catch (e) {}
}

export function saveChips(amt) {
  if (typeof window === 'undefined') return;
  const p = getProfile();
  p.chips = Math.max(0, amt);
  saveProfile(p);
}

/**
 * İlk günlük giriş kontrolü ve bonus tahsisi.
 * @param {string} userName
 * @param {boolean} forceCheckIn - Demo / test amaçlı zorlama
 * @returns {object} { isNewCheckIn, bonus, streak, chips, alreadyCheckedIn, nextBonus }
 */
export function checkDailyLogin(userName, forceCheckIn = false) {
  if (typeof window === 'undefined') {
    return { isNewCheckIn: false, bonus: 0, streak: 1, chips: 1000, alreadyCheckedIn: false, nextBonus: 125 };
  }
  const today = getTodayKey();
  const yesterday = getYesterdayKey();
  const p = getProfile();

  if (userName && userName.trim()) {
    p.name = userName.trim();
  }

  const alreadyCheckedIn = p.lastCheckInDate === today;

  if (alreadyCheckedIn && !forceCheckIn) {
    return {
      isNewCheckIn: false,
      bonus: 0,
      streak: p.streakDays || 1,
      chips: p.chips ?? 1000,
      alreadyCheckedIn: true,
      lastCheckInBonus: p.lastCheckInBonus || 100,
      nextBonus: getBonusForStreak((p.streakDays || 1) + 1),
    };
  }

  // Seri hesabı: dün girmişse +1, yoksa 1
  let newStreak = 1;
  if (p.lastCheckInDate === yesterday) {
    newStreak = (p.streakDays || 0) + 1;
  } else {
    newStreak = 1;
  }

  const bonus = getBonusForStreak(newStreak);
  p.chips = (p.chips ?? 1000) + bonus;
  p.streakDays = newStreak;
  p.lastCheckInDate = today;
  p.lastCheckInTime = Date.now();
  p.lastCheckInBonus = bonus;

  saveProfile(p);
  addLedger('deposit', `☀️ Günlük Giriş Bonusu (${newStreak}. Gün Serisi)`, bonus, 'ok');

  // Canlı şeride yansıt
  window.dispatchEvent(
    new CustomEvent('durtu:tick', {
      detail: { who: p.name || 'Sen', game: '☀️ Günlük Ritüel', amt: bonus },
    })
  );

  return {
    isNewCheckIn: true,
    bonus,
    streak: newStreak,
    chips: p.chips,
    alreadyCheckedIn: true,
    lastCheckInBonus: bonus,
    nextBonus: getBonusForStreak(newStreak + 1),
  };
}

export function getCheckInStatus() {
  if (typeof window === 'undefined') {
    return { checkedInToday: false, streak: 0, currentBonus: 100, nextBonus: 125, rewards: DAILY_REWARDS };
  }
  const p = getProfile();
  const today = getTodayKey();
  const checkedInToday = p.lastCheckInDate === today;
  const streak = p.streakDays || 0;
  const currentBonus = getBonusForStreak(checkedInToday ? streak : (streak === 0 ? 1 : streak + 1));
  const nextBonus = getBonusForStreak((streak || 0) + 1);

  return {
    checkedInToday,
    streak,
    currentBonus,
    nextBonus,
    lastCheckInBonus: p.lastCheckInBonus || 100,
    lastCheckInTime: p.lastCheckInTime,
    rewards: DAILY_REWARDS,
  };
}

export function resetCheckInForDemo() {
  if (typeof window === 'undefined') return;
  const p = getProfile();
  p.lastCheckInDate = getYesterdayKey();
  saveProfile(p);
}

