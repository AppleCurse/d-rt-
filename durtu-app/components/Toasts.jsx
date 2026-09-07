'use client';
import { useEffect, useState } from 'react';

export default function Toasts() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const h = e => {
      const id = Math.random().toString(36).slice(2);
      setList(l => [...l, { id, html: e.detail }]);
      setTimeout(() => setList(l => l.filter(t => t.id !== id)), 3800);
    };
    window.addEventListener('durtu:toast', h);
    return () => window.removeEventListener('durtu:toast', h);
  }, []);
  return (
    <div id="toasts">
      {list.map(t => <div key={t.id} className="toast" dangerouslySetInnerHTML={{ __html: t.html }} />)}
    </div>
  );
}
