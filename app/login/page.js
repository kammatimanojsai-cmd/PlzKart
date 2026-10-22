import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/client';
import { currentUser } from '@/lib/auth';

export const metadata = { title: 'Log in' };

export default async function Login({ searchParams }) {
  const { next = '/' } = await searchParams;
  if (await currentUser()) redirect(typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/');
  return (
    <div className="auth">
      <h1>Welcome back</h1>
      <p className="muted">Log in to see your wishlist, cart and orders.</p>
      <LoginForm next={typeof next === 'string' ? next : '/'} />
      <p className="small"><Link href="/forgot-password">Forgot password?</Link></p>
      <p className="small muted privacy-note">The site owner receives a notice with your name, email and sign-in time. <Link href="/privacy">Privacy details</Link></p>
      <p className="small">New to PlzKart? <Link href="/signup">Create an account</Link></p>
    </div>
  );
}
