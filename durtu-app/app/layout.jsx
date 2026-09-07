import './globals.css';

export const metadata = {
  title: 'DÜRTÜ — Kapalı Kulüp',
  description: 'Dürtü seni çağırıyor. Seçilmişler için küratörlü oyun deneyimi — konsept demosu.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
