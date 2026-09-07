'use client';
import { useEffect, useState } from 'react';
import { say, fmt } from '../lib/toast';

export default function Salon({ name, chips, onPlay }) {
  const [greet, setGreet] = useState('Hoş geldin');
  const [date, setDate] = useState('');
  useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 6 ? 'İyi geceler' : h < 12 ? 'Günaydın' : h < 18 ? 'İyi günler' : h < 23 ? 'İyi akşamlar' : 'İyi geceler');
    setDate(new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' — salon hazır.');
  }, []);

  return (
    <>
      <section id="salon">
        <span className="tag">Senin Salonun</span>
        <h1 className="serif" style={{ fontSize: 'clamp(1.7rem,4vw,2.6rem)', fontWeight: 600, margin: '.5rem 0 .3rem' }}>
          {greet}, {name}.
        </h1>
        <p className="muted" suppressHydrationWarning>{date}</p>

        <h2 className="sect" style={{ marginTop: '2rem' }}>Bugün senin için hazırlananlar</h2>
        <div className="picks">
          <div className="pick">
            <span className="tag">🎰 Slot</span>
            <div className="ic">⚡</div>
            <h3>Zeus'un Günü</h3>
            <p>Gates of Olympus bugün senin profilinde parlıyor. Çarpan mekaniği geçen haftaki favorine çok yakın.</p>
            <button className="btn" onClick={() => onPlay('gates')}>Oyna</button>
          </div>
          <div className="pick">
            <span className="tag">⚽ Canlı</span>
            <div className="ic">🏆</div>
            <h3>Şampiyonlar Ligi Gecesi</h3>
            <p>Bu akşam 22:00 — tek maç, küratörlü oranlar. Kalabalık yok; sadece üyelerin masası.</p>
            <button className="btn" onClick={() => say('🏆 Canlı bahis masası bu portta yakında — prototipte mevcut: <b>durtu/index.html</b>')}>Bahis Yap</button>
          </div>
          <div className="pick">
            <span className="tag">🎴 Masa</span>
            <div className="ic">🂡</div>
            <h3>VIP Blackjack</h3>
            <p>Özel krupiye ile tek masa. Stratejist profiline ayrıldı; yerin şu an müsait.</p>
            <button className="btn" onClick={() => say('🂡 Krupiyen masayı hazırlıyor — masa deneyimi React yol haritasında.')}>Katıl</button>
          </div>
        </div>

        <div className="strip">
          <div className="mini">
            <span className="tag">📊 Performansın</span>
            <div className="big-num">+12%</div>
            <svg width="130" height="42" viewBox="0 0 130 42" aria-hidden="true">
              <polyline points="0,34 20,28 40,32 60,20 80,24 100,12 128,8" fill="none" stroke="#D4AF37" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="128" cy="8" r="2.6" fill="#D4AF37" />
            </svg>
            <p>Bu haftanın özeti. Sakin ve istikrarlı — tam Dürtü tarzı.</p>
          </div>
          <div className="mini">
            <span className="tag">🧠 Dürtü Analizi</span>
            <h4 className="serif" style={{ fontStyle: 'italic', fontWeight: 400, lineHeight: 1.55, color: 'var(--cream)' }}>
              “Son 3 girişinde Gates of Olympus'ta %15 kayıp yaşadın. Bugün şansını Sweet Bonanza'da denemeni öneririm.”
            </h4>
            <button className="btn" onClick={() => onPlay('sb')}>Sweet Bonanza'ya git</button>
          </div>
          <div className="mini">
            <span className="tag">🎁 Sana Özel</span>
            <h4>50 Ücretsiz Dönüş</h4>
            <p>Banner yok, spam yok — sadece sana. Gates of Olympus'ta geçerli, bu gece yarısına dek.</p>
            <button className="btn solid" onClick={() => { say('<b>50 ücretsiz dönüş</b> tanımlandı (demo). Bol şans.'); onPlay('gates'); }}>Kullan</button>
          </div>
        </div>

        <div className="strip">
          <div className="mini">
            <span className="tag">◈ Haftalık Bütçe</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '.4rem 0' }}>
              <svg width="84" height="84" viewBox="0 0 84 84" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="42" cy="42" r="34" fill="none" stroke="#22221f" strokeWidth="5" />
                <circle cx="42" cy="42" r="34" fill="none" stroke="#D4AF37" strokeWidth="5" strokeLinecap="round"
                  strokeDasharray="213.6" strokeDashoffset="64.1" />
              </svg>
              <div>
                <div className="big-num">%70</div>
                <p style={{ maxWidth: 200 }}>Bütçenin %70'ini kullandın. Ara vermek istersen “Sakin Oyunlar” seni bekler.</p>
              </div>
            </div>
          </div>
          <div className="mini">
            <span className="tag">👤 Kişisel Temsilcin</span>
            <h4>Selin <span className="muted" style={{ fontSize: '.7rem', fontFamily: 'var(--sans)' }}>· çevrimiçi</span></h4>
            <p>Bot yok, kuyruk yok. Concierge sohbeti React yol haritasında — prototipte mevcut.</p>
          </div>
          <div className="mini">
            <span className="tag">✦ Davet Hakların</span>
            <h4>3 mühür duruyor</h4>
            <p>Kimi içeri alacağın senin imzan sayılır. Kod üretimi backoffice ile entegre çalışır.</p>
            <button className="btn" onClick={() => say('✦ <b>Davetiye:</b> EV-' + Math.random().toString(36).slice(2, 6).toUpperCase() + ' üretildi (demo)')}>Davet Et</button>
          </div>
        </div>
      </section>
    </>
  );
}
