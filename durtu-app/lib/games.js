// Küratör seçkisi — tek doğruluk kaynağı (API rotası da buradan beslenir)
export const GAMES = [
  { id: 'gates', icon: '⚡', name: 'Gates of Olympus', cat: 'risk', rtp: '96.50', vol: 'Yüksek', type: 'slot',
    note: 'Geçen hafta Sweet Bonanza oynadın — benzer çarpan mekaniği, daha yüksek tavan.' },
  { id: 'mt4', icon: '🚂', name: 'Money Train 4', cat: 'risk', rtp: '96.10', vol: 'Yüksek', type: 'slot',
    note: 'Büyük turlar sabırlı oyuncuları sever; bonus avcısı profiline uygun.' },
  { id: 'wdw', icon: '🤠', name: 'Wanted Dead or a Wild', cat: 'risk', rtp: '96.38', vol: 'Yüksek', type: 'slot',
    note: 'Düello özelliği, adrenalin skorunla birebir eşleşiyor.' },
  { id: 'sp', icon: '✨', name: 'Starlight Princess', cat: 'calm', rtp: '96.50', vol: 'Orta-Düşük', type: 'slot',
    note: 'Uzun akşam seansların için yumuşak iniş çıkışlar.' },
  { id: 'sb', icon: '🍬', name: 'Sweet Bonanza', cat: 'calm', rtp: '96.48', vol: 'Orta', type: 'slot',
    note: 'Geçen ayın favorisi — Dürtü analizine göre bu hafta şansın burada.' },
  { id: 'bs', icon: '🦇', name: 'Blood Suckers', cat: 'calm', rtp: '98.00', vol: 'Düşük', type: 'slot',
    note: 'Seçkideki en yüksek RTP; bütçe dostu, uzun nefesli oyun.' },
  { id: 'aviator', icon: '✈️', name: 'Aviator', cat: 'adren', rtp: '97.00', vol: 'Crash', type: 'crash',
    note: 'Seçkideki tek crash oyunu — Dürtü bilinçli seçti.' },
  { id: 'bj', icon: '🂡', name: 'Türkçe Blackjack', cat: 'strat', rtp: '99.40', vol: 'Masa', type: 'table',
    note: 'Tek masa, özel krupiye — stratejist profiline ayrıldı.' },
  { id: 'rl', icon: '🎡', name: 'Tek Kişilik Rulet', cat: 'strat', rtp: '97.30', vol: 'Masa', type: 'roulette',
    note: 'Kalabalık yok, bekleme yok; masa sadece senin.' },
  { id: 'mines', icon: '💣', name: 'Mines', cat: 'adren', rtp: '97.00', vol: 'Tarla', type: 'mines',
    note: '5×5 tarla — elmas topla, mayına basmadan kasaya gir.' },
];

export const CATS = [
  ['all', 'Tümü'],
  ['risk', '🎩 Yüksek Risk'],
  ['calm', '🍷 Uzun Akşam'],
  ['adren', '⚡ Adrenalin'],
  ['strat', '🎯 Stratejist'],
];
