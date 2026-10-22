import { destroySession } from '@/lib/auth';
import { json, handle } from '@/lib/api';

export const POST = handle(async () => {
  await destroySession();
  return json({ ok: true });
});
