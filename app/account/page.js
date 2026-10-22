import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { counts } from '@/lib/store';
import { ResendVerification } from '@/components/client';

export const metadata = { title: 'My account' };

const VERIFY_MSG = {
  success: ['ok', 'Your email is verified. A welcome email is on its way!'],
  already: ['ok', 'Your email was already verified.'],
  expired: ['warn', 'That verification link has expired or was already used. Send a new one below.'],
  invalid: ['warn', 'That verification link is not valid. Send a new one below.'],
};

export default async function Account({ searchParams }) {
  const sp = await searchParams;
  const user = await currentUser();
  if (!user) {
    if (sp.verify === 'success' || sp.verify === 'already') {
      return (
        <div className="auth">
          <div className="notice ok">Your email is verified. A welcome email is on its way!</div>
          <Link className="btn btn-primary" href="/login?next=/account">Log in</Link>
        </div>
      );
    }
    redirect('/login?next=/account');
  }
  const c = await counts(user.id);
  const v = VERIFY_MSG[sp.verify];
  const dev = typeof sp.dev === 'string' && sp.dev.startsWith('http') && process.env.NODE_ENV !== 'production' ? sp.dev : null;

  return (
    <div className="account">
      {v && <div className={`notice ${v[0]}`} data-testid="verify-notice">{v[1]}</div>}
      {sp.welcome && !user.email_verified && (
        <div className="notice ok">Account created! {sp.mail === 'failed' ? "We couldn't send the verification email yet — use the button below to retry." : `We sent a verification link to ${user.email}.`}</div>
      )}
      {dev && <div className="notice warn">Email is not configured locally. <a href={dev}>Open the verification link</a></div>}

      <h1>Hi, {user.name}</h1>
      <div className="acct-grid">
        <div className="panel">
          <h2 className="h3">Profile</h2>
          <p><span className="muted">Email</span><br />{user.email}</p>
          <p>
            <span className="muted">Status</span><br />
            {user.email_verified ? <span className="pill ok" data-testid="verified">Verified</span> : <span className="pill warn" data-testid="unverified">Not verified</span>}
          </p>
          {!user.email_verified && <ResendVerification />}
          <p className="muted small">Member since {new Date(user.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
        </div>
        <Link href="/orders" className="panel link-panel"><h2 className="h3">My orders</h2><p className="muted">Track and review past orders</p></Link>
        <Link href="/wishlist" className="panel link-panel"><h2 className="h3">Wishlist</h2><p className="muted">{c.wishlist} saved item{c.wishlist === 1 ? '' : 's'}</p></Link>
        <Link href="/cart" className="panel link-panel"><h2 className="h3">Cart</h2><p className="muted">{c.cart} item{c.cart === 1 ? '' : 's'} waiting</p></Link>
      </div>
    </div>
  );
}
