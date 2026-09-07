import { NextResponse } from 'next/server';

// Basit proses-içi kuyruk (demo). Üretimde: veritabanı + admin onay akışı.
const queue = (globalThis.__durtuQueue = globalThis.__durtuQueue || []);

export async function POST(req) {
  try {
    const b = await req.json();
    if (!b?.why || String(b.why).trim().length < 12)
      return NextResponse.json({ ok: false, error: 'TOO_SHORT' }, { status: 400 });
    const id = 'A' + Date.now().toString(36).toUpperCase();
    queue.push({
      id,
      name: String(b.name || 'Misafir').slice(0, 40),
      why: String(b.why).slice(0, 500),
      type: String(b.type || ''),
      budget: String(b.budget || ''),
      ts: Date.now(),
      status: 'pending',
    });
    return NextResponse.json({ ok: true, id, pending: queue.filter(a => a.status === 'pending').length });
  } catch {
    return NextResponse.json({ ok: false, error: 'BAD_REQUEST' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ pending: queue.filter(a => a.status === 'pending').length, total: queue.length });
}
