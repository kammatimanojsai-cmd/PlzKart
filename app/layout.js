import './globals.css';
import Link from 'next/link';
import Header from '@/components/Header';

export const metadata = {
  title: { default: 'PlzKart — Shirts, Watches, Beauty & Perfumes', template: '%s | PlzKart' },
  description: "Shop men's shirts and watches, women's beauty products and perfumes at PlzKart.",
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="wrap main">{children}</main>
        <footer className="footer">
          <div className="wrap footer-row">
            <div>
              <p className="logo small">Plz<span>Kart</span></p>
              <p className="muted small">A college e-commerce project. Demo checkout only, no real payments.</p>
            </div>
            <nav className="footer-nav">
              <Link href="/shop?category=shirts">Shirts</Link>
              <Link href="/shop?category=watches">Watches</Link>
              <Link href="/shop?category=beauty">Beauty</Link>
              <Link href="/shop?category=perfumes">Perfumes</Link>
              <Link href="/orders">My orders</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
