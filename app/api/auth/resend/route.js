import { one } from '@/lib/db';
import { issueEmailToken } from '@/lib/auth';
import { sendEmail, verificationEmail, emailProvider } from '@/lib/email';
import { baseUrl } from '@/lib/format';
import { json, fail, requireUser, handle } from '@/lib/api';

export const POST = handle(async (req) => {
  const { user, error } = await requireUser();
  if (error) return error;
  if (user.email_verified) return json({ ok: true, alreadyVerified: true });

  const recent = await one(
    `SELECT COUNT(*)::int AS n FROM email_log WHERE user_id=$1 AND kind='verification' AND status='sent' AND created_at > NOW() - INTERVAL '10 minutes'`,
    [user.id]
  );
  if (Number(recent.n) >= 3) return fail('Too many requests. Please wait a few minutes and try again.', 429);

  const token = await issueEmailToken(user.id, 'verify');
  const link = `${baseUrl(req)}/verify?token=${token}`;
  const sent = await sendEmail({ userId: user.id, kind: 'verification', to: user.email, ...verificationEmail(user.name, link) });
  const exposeLink = !emailProvider() && process.env.NODE_ENV !== 'production';
  if (sent.skipped && !exposeLink) return fail('Email sending is not configured on this site yet. Please try again later.', 503);
  if (!sent.ok && !exposeLink) return fail('We could not send the email right now. Please try again later.', 502);
  return json({ ok: true, emailSent: sent.ok, devVerifyLink: exposeLink ? link : undefined });
});
