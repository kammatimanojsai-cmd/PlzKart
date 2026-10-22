import { dbKind, one } from '@/lib/db';
import { emailProvider } from '@/lib/email';
import { json } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await dbKind();
    const p = await one('SELECT COUNT(*)::int AS n FROM products');
    // Last email attempt, without any recipient address, to diagnose delivery problems.
    const last = await one(
      `SELECT kind, status, provider, LEFT(COALESCE(detail, ''), 160) AS detail, created_at
         FROM email_log ORDER BY id DESC LIMIT 1`
    );
    return json({ ok: true, database: db, products: Number(p.n), emailProvider: emailProvider() || 'none', lastEmail: last });
  } catch (e) {
    return json({ ok: false, error: e.message }, 500);
  }
}
