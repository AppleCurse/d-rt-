// Basit event-bus toast yardımcısı
export const say = html => {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('durtu:toast', { detail: html }));
};
export const fmt = n => Math.round(n).toLocaleString('tr-TR');
export const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
