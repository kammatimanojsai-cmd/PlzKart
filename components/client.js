'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const data = await res.json().catch(() => ({ ok: false, error: 'Unexpected response.' }));
  return { status: res.status, ...data };
}

function useLoginRedirect() {
  const router = useRouter();
  const path = usePathname();
  return () => router.push(`/login?next=${encodeURIComponent(path)}`);
}

export function Toast({ msg, kind = 'ok' }) {
  if (!msg) return null;
  return <div className={`toast toast-${kind}`} role="status">{msg}</div>;
}

export function WishlistButton({ productId, initial = false, compact = false }) {
  const [on, setOn] = useState(initial);
  const [busy, start] = useTransition();
  const router = useRouter();
  const toLogin = useLoginRedirect();
  return (
    <button
      type="button"
      className={`wish ${on ? 'on' : ''} ${compact ? 'compact' : 'btn btn-ghost'}`}
      aria-pressed={on}
      aria-label={on ? 'Remove from wishlist' : 'Add to wishlist'}
      disabled={busy}
      data-testid="wishlist-toggle"
      onClick={() =>
        start(async () => {
          const r = await post('/api/wishlist', { productId });
          if (r.needLogin) return toLogin();
          if (r.ok) { setOn(r.inWishlist); router.refresh(); }
        })
      }
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M12 21s-7.5-4.6-9.5-9.3C1.1 8.4 3.2 5 6.6 5c2 0 3.4 1.1 4.4 2.5C12 6.1 13.4 5 15.4 5c3.4 0 5.5 3.4 4.1 6.7C19.5 16.4 12 21 12 21z"
          fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" />
      </svg>
      {!compact && <span>{on ? 'Wishlisted' : 'Wishlist'}</span>}
    </button>
  );
}

export function AddToCartButton({ productId, disabled, moveFromWishlist = false, label = 'Add to cart' }) {
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState('');
  const router = useRouter();
  const toLogin = useLoginRedirect();
  return (
    <span className="atc">
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy || disabled}
        data-testid="add-to-cart"
        onClick={() =>
          start(async () => {
            const r = await post('/api/cart', { productId, qty: 1, mode: 'add', moveFromWishlist });
            if (r.needLogin) return toLogin();
            setMsg(r.ok ? 'Added to cart' : r.error);
            router.refresh();
            setTimeout(() => setMsg(''), 2200);
          })
        }
      >
        {disabled ? 'Out of stock' : busy ? 'Adding…' : label}
      </button>
      <Toast msg={msg} />
    </span>
  );
}

export function QtyControl({ productId, qty, max }) {
  const [busy, start] = useTransition();
  const router = useRouter();
  const set = (n) =>
    start(async () => {
      await post('/api/cart', { productId, qty: n, mode: 'set' });
      router.refresh();
    });
  return (
    <div className="qty" aria-busy={busy}>
      <button type="button" aria-label="Decrease quantity" onClick={() => set(qty - 1)} disabled={busy}>−</button>
      <span data-testid="qty">{qty}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => set(qty + 1)} disabled={busy || qty >= Math.min(10, max)}>+</button>
      <button type="button" className="link danger" onClick={() => set(0)} disabled={busy}>Remove</button>
    </div>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button type="button" className="link" onClick={async () => { await post('/api/auth/logout'); router.push('/'); router.refresh(); }}>
      Log out
    </button>
  );
}

function Field({ label, name, type = 'text', error, ...rest }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input name={name} type={type} aria-invalid={!!error} {...rest} />
      {error && <small className="err">{error}</small>}
    </label>
  );
}

export function SignupForm() {
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const r = await post('/api/auth/signup', fd);
          if (!r.ok) { setErrors(r.errors || {}); setMsg(r.error); return; }
          const q = new URLSearchParams({ welcome: '1' });
          if (r.devVerifyLink) q.set('dev', r.devVerifyLink);
          if (!r.emailSent) q.set('mail', 'failed');
          router.push(`/account?${q}`);
          router.refresh();
        });
      }}
    >
      <Field label="Full name" name="name" autoComplete="name" required error={errors.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" required error={errors.email} />
      <Field label="Password" name="password" type="password" autoComplete="new-password" required minLength={8} error={errors.password}
        placeholder="At least 8 characters, letters and numbers" />
      {msg && <p className="form-msg err">{msg}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
    </form>
  );
}

export function LoginForm({ next = '/' }) {
  const [msg, setMsg] = useState('');
  const [busy, start] = useTransition();
  const router = useRouter();
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/';
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const r = await post('/api/auth/login', fd);
          if (!r.ok) return setMsg(r.error);
          router.push(safeNext);
          router.refresh();
        });
      }}
    >
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      {msg && <p className="form-msg err">{msg}</p>}
      <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
    </form>
  );
}

export function ResendVerification() {
  const [msg, setMsg] = useState('');
  const [devLink, setDevLink] = useState('');
  const [busy, start] = useTransition();
  return (
    <div>
      <button type="button" className="btn btn-ghost" disabled={busy}
        onClick={() => start(async () => {
          const r = await post('/api/auth/resend');
          setMsg(r.ok ? (r.emailSent ? 'Verification email sent. Check your inbox (and spam folder).' : 'Email delivery is not configured in this environment.') : r.error);
          if (r.devVerifyLink) setDevLink(r.devVerifyLink);
        })}>
        {busy ? 'Sending…' : 'Resend verification email'}
      </button>
      {msg && <p className="muted small">{msg}</p>}
      {devLink && <p className="small"><a href={devLink}>Developer verification link</a></p>}
    </div>
  );
}

export function CheckoutForm({ defaultName }) {
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, start] = useTransition();
  const router = useRouter();
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = Object.fromEntries(new FormData(e.currentTarget));
        start(async () => {
          const r = await post('/api/checkout', fd);
          if (!r.ok) { setErrors(r.errors || {}); setMsg(r.error); return; }
          router.push(`/orders/${r.orderNo}?placed=1`);
          router.refresh();
        });
      }}
    >
      <h2 className="h3">Shipping address</h2>
      <div className="grid2">
        <Field label="Full name" name="name" defaultValue={defaultName} required error={errors.name} autoComplete="name" />
        <Field label="Mobile number" name="phone" inputMode="tel" placeholder="10-digit mobile" required error={errors.phone} autoComplete="tel" />
      </div>
      <Field label="Address" name="address" placeholder="House no., street, area" required error={errors.address} autoComplete="street-address" />
      <div className="grid2">
        <Field label="City" name="city" required error={errors.city} autoComplete="address-level2" />
        <Field label="PIN code" name="pincode" inputMode="numeric" maxLength={6} required error={errors.pincode} autoComplete="postal-code" />
      </div>
      <h2 className="h3">Payment (demo)</h2>
      <p className="muted small">This is a college project. No card details are collected and no money is charged.</p>
      <div className="pay">
        {[['demo-card', 'Demo Card', 'Simulated card payment'], ['demo-upi', 'Demo UPI', 'Simulated UPI payment'], ['cod', 'Cash on Delivery', 'Pay when it arrives']].map(([v, t, d], i) => (
          <label key={v} className="pay-opt">
            <input type="radio" name="payment" value={v} defaultChecked={i === 0} />
            <span><b>{t}</b><small>{d}</small></span>
          </label>
        ))}
      </div>
      {errors.payment && <small className="err">{errors.payment}</small>}
      {msg && <p className="form-msg err">{msg}</p>}
      <button className="btn btn-primary btn-block" disabled={busy} data-testid="place-order">{busy ? 'Placing order…' : 'Place demo order'}</button>
    </form>
  );
}
