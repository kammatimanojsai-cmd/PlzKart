import { NextResponse } from 'next/server';
import { one, query } from '@/lib/db';
import { sendEmail, welcomeEmail } from '@/lib/email';
import { baseUrl } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const base = baseUrl(req);
  const token = req.nextUrl.searchParams.get('token') || '';
  const row = await one(
    `SELECT t.token, t.user_id, t.expires_at, t.used_at, u.name, u.email, u.email_verified, u.welcome_sent
       FROM email_tokens t JOIN users u ON u.id = t.user_id
      WHERE t.token = $1 AND t.purpose = 'verify'`,
    [token]
  );

  if (!row) return NextResponse.redirect(`${base}/account?verify=invalid`);
  if (row.email_verified) return NextResponse.redirect(`${base}/account?verify=already`);
  if (row.used_at || new Date(row.expires_at) < new Date()) return NextResponse.redirect(`${base}/account?verify=expired`);

  await query('UPDATE email_tokens SET used_at = NOW() WHERE token = $1', [token]);
  await query('UPDATE users SET email_verified = TRUE WHERE id = $1', [row.user_id]);

  // Welcome email is sent exactly once, right after verification.
  const claimed = await one('UPDATE users SET welcome_sent = TRUE WHERE id = $1 AND welcome_sent = FALSE RETURNING id', [row.user_id]);
  if (claimed) {
    await sendEmail({ userId: row.user_id, kind: 'welcome', to: row.email, ...welcomeEmail(row.name, `${base}/shop`) });
  }
  return NextResponse.redirect(`${base}/account?verify=success`);
}
