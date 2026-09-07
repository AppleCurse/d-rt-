import { NextResponse } from 'next/server';
import { GAMES } from '../../../lib/games';

export const dynamic = 'force-dynamic';

// GET /api/games — küratör seçkisi (sıralama her çağrıda tazelenir)
export async function GET() {
  const data = GAMES.map(g => ({ ...g })).sort(() => Math.random() - 0.5);
  return NextResponse.json({ ok: true, data, ts: Date.now() });
}
