import { one } from '@/lib/db';
import { checkPassword, normalizeEmail, createSession } from '@/lib/auth';
import { json, fail, readJson, handle } from '@/lib/api';

export const POST = handle(async (req) => {
  const { email, password } = await readJson(req);
  if (!email || !password) return fail('Enter your email and password.');
  const user = await one('SELECT id, password_hash FROM users WHERE email = $1', [normalizeEmail(email)]);
  if (!user || !(await checkPassword(String(password), user.password_hash))) {
    return fail('Incorrect email or password.', 401);
  }
  await createSession(user.id);
  return json({ ok: true });
});
