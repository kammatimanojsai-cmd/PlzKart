import { one } from '@/lib/db';
import { normalizeEmail, issueEmailToken } from '@/lib/auth';
import { sendEmail, resetEmail, emailProvider } from '@/lib/email';
import { baseUrl } from '@/lib/format';
import { json, readJson, handle } from '@/lib/api';

// Always answers the same way so the form can't be used to discover registered emails.
export const POST = handle(async (req) => {
  const { email } = await readJson(req);
  const addr = normalizeEmail(email);
  const generic = { ok: true, message: 'If an account exists for that email, a reset link is on its way.' };
  if (!addr) return json(generic);

  const user = await one('SELECT id, name, email FROM users WHERE email = $1', [addr]);
  if (!user) return json(generic);

  const recent = await one(
    `SELECT COUNT(*)::int AS n FROM email_log WHERE user_id=$1 AND kind='reset' AND status='sent' AND created_at > NOW() - INTERVAL '15 minutes'`,
    [user.id]
  );
  if (Number(recent.n) >= 3) return json(generic);

  const token = await issueEmailToken(user.id, 'reset', 1);
  const link = `${baseUrl(req)}/reset-password?token=${token}`;
  await sendEmail({ userId: user.id, kind: 'reset', to: user.email, ...resetEmail(user.name, link) });

  const exposeLink = !emailProvider() && process.env.NODE_ENV !== 'production';
  return json({ ...generic, devResetLink: exposeLink ? link : undefined });
});
