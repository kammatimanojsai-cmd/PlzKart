import Link from 'next/link';
import { currentUser } from '@/lib/auth';
import { counts } from '@/lib/store';
import { LogoutButton } from './client';

export default async function Header() {
  const user = await currentUser();
  const c = await counts(user?.id);
  return (
    <header className="header">
      <div className="wrap header-row">
        <Link href="/" className="logo" aria-label="PlzKart home">Plz<span>Kart</span></Link>
        <form action="/shop" className="search" role="search">
          <input name="q" placeholder="Search shirts, watches, perfumes…" aria-label="Search products" />
        </form>
        <nav className="nav">
          <Link href="/shop?gender=men">Men</Link>
          <Link href="/shop?gender=women">Women</Link>
          <Link href="/wishlist" className="icon-link">Wishlist{c.wishlist > 0 && <em data-testid="wish-count">{c.wishlist}</em>}</Link>
          <Link href="/cart" className="icon-link">Cart{c.cart > 0 && <em data-testid="cart-count">{c.cart}</em>}</Link>
          {user ? (
            <span className="user">
              <Link href="/account">Hi, {user.name.split(' ')[0]}</Link>
              <LogoutButton />
            </span>
          ) : (
            <span className="user"><Link href="/login">Log in</Link><Link href="/signup" className="btn btn-sm btn-primary">Sign up</Link></span>
          )}
        </nav>
      </div>
      {user && !user.email_verified && (
        <div className="verify-bar">Please verify your email ({user.email}) to place orders. <Link href="/account">Resend link</Link></div>
      )}
    </header>
  );
}
