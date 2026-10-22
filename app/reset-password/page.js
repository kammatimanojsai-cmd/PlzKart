import Link from 'next/link';
import { ResetForm } from '@/components/client';

export const metadata = { title: 'Reset password' };

export default async function Reset({ searchParams }) {
  const { token } = await searchParams;
  return (
    <div className="auth">
      <h1>Choose a new password</h1>
      {typeof token === 'string' && token ? (
        <ResetForm token={token} />
      ) : (
        <p className="notice warn">This reset link is missing its token. <Link href="/forgot-password">Request a new link</Link>.</p>
      )}
    </div>
  );
}
