import { dbKind, one } from '@/lib/db';
import { emailProvider } from '@/lib/email';
import { json } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await dbKind();
    const p = await one('SELECT COUNT(*)::int AS n FROM products');
    return json({ ok: true, database: db, products: Number(p.n), emailProvider: emailProvider() || 'none' });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
