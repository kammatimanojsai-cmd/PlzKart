import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignupForm } from '@/components/client';
import { currentUser } from '@/lib/auth';

export const metadata = { title: 'Sign up' };

export default async function Signup() {
  if (await currentUser()) redirect('/account');
  return (
    <div className="auth">
      <h1>Create your PlzKart account</h1>
      <p className="muted">We'll email you a link to verify your address.</p>
      <SignupForm />
      <p className="small muted privacy-note">By creating an account you agree that the site owner is notified of your name, email and registration time. Passwords are never shared. <Link href="/privacy">Privacy details</Link></p>
      <p className="small">Already have an account? <Link href="/login">Log in</Link></p>
    </div>
  );
}
