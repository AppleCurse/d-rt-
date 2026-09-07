# DÜRTÜ — Next.js Portu

> Kapalı kulüp konseptinin React/Next.js mimarisiyle portu.
> Konsept demosu · Gerçek para kullanılmaz · 18+

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:3000
```

## Mimari

```
durtu-app/
├── app/
│   ├── layout.jsx          # metadata + fontlar
│   ├── globals.css         # tasarım token'ları + bileşen stilleri
│   ├── page.jsx            # 'use client' — kapı/salon durumu, cüzdan
│   └── api/
│       ├── games/route.js  # GET  — küratör seçkisi (her çağrıda taze sıra)
│       └── apply/route.js  # POST — üyelik başvurusu (proses-içi kuyruk)
├── components/
│   ├── Gate.jsx            # davet kodu + başvuru akışı (POST /api/apply)
│   ├── Salon.jsx           # kişiselleştirilmiş dashboard
│   ├── GameGrid.jsx        # /api/games'ten skeleton'lı seçki
│   ├── SlotGame.jsx        # GERÇEK canvas slot motoru (port)
│   └── Toasts.jsx          # event-bus toast host'u
└── lib/
    ├── games.js            # tek doğruluk kaynağı (katalog + etiketler)
    └── toast.js            # say() · fmt() · buzz()
```

## Slot motoru (components/SlotGame.jsx)

Prototipten (`../durtu/index.html`) birebir taşındı:

- **Reel-strip mimarisi:** her makarada ağırlıklı ~29 sembollük şerit
- **Fizik:** sabit hız → ease-out yavaşlama → sönümlü sekme · motion blur hayaletleri
- **10 ödeme çizgisi**, **✦ WILD**, **✨ SCATTER** (8 ücretsiz dönüş, ×2)
- **İmza çarpan orbları:** temada ×2–×20; ücretsiz dönüşte **birikimli** (Gates mantığı)
- **WebAudio sentezi:** spin whoosh, makara thud, kazanç arpeji, scatter ding, yıldırım zap
- **Haptic:** `navigator.vibrate` desenleri · **DPR** keskin canvas

## Prototip ↔ port eşleşmesi

| Özellik | Tek dosya (`durtu/index.html`) | Bu port |
|---|---|---|
| Kapı + başvuru | ✅ | ✅ (gerçek API POST) |
| Kişisel salon | ✅ | ✅ |
| Seçki + skeleton | ✅ (simüle API) | ✅ (`/api/games`) |
| Slot motoru + orblar | ✅ | ✅ |
| Crash/Aviator + canlı sofa | ✅ | 🗓 yol haritası |
| Melekler (TTS) | ✅ | 🗓 yol haritası |
| Caz ambiyansı (prosedürel) | ✅ | 🗓 yol haritası |
| Turnuva modu | ✅ | 🗓 yol haritası |
| Backoffice (`admin.html`) | ✅ (localStorage) | 🗓 gerçek DB + auth |

## Üretim notları (dürüst liste)

- Gerçek para oyunları **lisanslı sağlayıcı entegrasyonu** gerektirir
  (Pragmatic Play, Evolution vb. — agregatör API üzerinden).
- `/api/apply` şu an proses-içi bellek; üretimde Postgres/Kafka + admin onay iş akışı.
- Kimlik doğrulama: NextAuth (credentials/magic link) + davet kodu claim akışı.
- Adillik: server-seed commit/reveal veya sağlayıcı RNG'si; istemci motoru yalnızca demo.
