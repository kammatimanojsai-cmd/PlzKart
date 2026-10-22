import Link from 'next/link';
import { ForgotForm } from '@/components/client';

export const metadata = { title: 'Forgot password' };

export default function Forgot() {
  return (
    <div className="auth">
      <h1>Forgot your password?</h1>
      <p className="muted">Enter your account email and we'll send you a link to choose a new one.</p>
      <ForgotForm />
      <p className="small"><Link href="/login">Back to log in</Link></p>
    </div>
  );
}
