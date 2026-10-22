import { one, query } from '@/lib/db';
import { hashPassword, createSession } from '@/lib/auth';
import { sendEmail, welcomeEmail } from '@/lib/email';
import { baseUrl } from '@/lib/format';
import { json, fail, readJson, handle } from '@/lib/api';

export const POST = handle(async (req) => {
  const { token, password } = await readJson(req);
  if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return fail('Password must be at least 8 characters with a letter and a number.', 400, { errors: { password: 'At least 8 characters, letters and numbers.' } });
  }
  const row = await one(
    `SELECT t.user_id, u.name, u.email FROM email_tokens t JOIN users u ON u.id = t.user_id
      WHERE t.token = $1 AND t.purpose = 'reset' AND t.used_at IS NULL AND t.expires_at > NOW()`,
    [String(token || '')]
  );
  if (!row) return fail('This reset link is invalid or has expired. Please request a new one.', 400, { expired: true });

  await query('UPDATE email_tokens SET used_at = NOW() WHERE token = $1', [token]);
  // Opening the link proves the user controls this inbox, so the email counts as verified.
  await query('UPDATE users SET password_hash = $1, email_verified = TRUE WHERE id = $2', [await hashPassword(password), row.user_id]);
  // Sign out every existing session, then sign in here.
  await query('DELETE FROM sessions WHERE user_id = $1', [row.user_id]);
  await query(`UPDATE email_tokens SET used_at = NOW() WHERE user_id = $1 AND purpose = 'reset' AND used_at IS NULL`, [row.user_id]);
  await createSession(row.user_id);

  const claimed = await one('UPDATE users SET welcome_sent = TRUE WHERE id = $1 AND welcome_sent = FALSE RETURNING id', [row.user_id]);
  if (claimed) await sendEmail({ userId: row.user_id, kind: 'welcome', to: row.email, ...welcomeEmail(row.name, `${baseUrl(req)}/shop`) });

  return json({ ok: true });
});
