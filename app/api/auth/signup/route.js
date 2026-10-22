import { one } from '@/lib/db';
import { hashPassword, normalizeEmail, validateSignup, createSession, issueEmailToken } from '@/lib/auth';
import { sendEmail, verificationEmail, emailProvider } from '@/lib/email';
import { baseUrl } from '@/lib/format';
import { json, fail, readJson, handle } from '@/lib/api';
import { notifyAdminOfSignup } from '@/lib/admin-notify';

export const POST = handle(async (req) => {
  const body = await readJson(req);
  const errors = validateSignup(body);
  if (Object.keys(errors).length) return fail('Please fix the highlighted fields.', 400, { errors });

  const email = normalizeEmail(body.email);
  const name = String(body.name).trim().slice(0, 80);
  const existing = await one('SELECT id FROM users WHERE email = $1', [email]);
  if (existing) return fail('An account with this email already exists. Try logging in.', 409, { errors: { email: 'Already registered.' } });

  const user = await one(
    'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
    [name, email, await hashPassword(body.password)]
  );
  await createSession(user.id);
  notifyAdminOfSignup(user.id); // runs after the response; never blocks or fails the signup

  const token = await issueEmailToken(user.id, 'verify');
  const link = `${baseUrl(req)}/verify?token=${token}`;
  const mail = verificationEmail(user.name, link);
  const sent = await sendEmail({ userId: user.id, kind: 'verification', to: user.email, ...mail });

  const exposeLink = !emailProvider() && process.env.NODE_ENV !== 'production';
  return json({ ok: true, emailSent: sent.ok, emailError: sent.error ? 'We could not send the email right now.' : undefined, devVerifyLink: exposeLink ? link : undefined });
});
