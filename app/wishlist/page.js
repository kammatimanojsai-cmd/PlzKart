import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProductArt from '@/components/ProductArt';
import { WishlistButton, AddToCartButton } from '@/components/client';
import { currentUser } from '@/lib/auth';
import { wishlist } from '@/lib/store';
import { inr } from '@/lib/format';

export const metadata = { title: 'Wishlist' };

export default async function Wishlist() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/wishlist');
  const items = await wishlist(user.id);
  return (
    <>
      <h1>My wishlist <span className="muted small">({items.length})</span></h1>
      {!items.length ? (
        <div className="empty"><p>Your wishlist is empty. Tap the heart on any product to save it here.</p><Link href="/shop" className="btn btn-primary">Browse products</Link></div>
      ) : (
        <div className="lines">
          {items.map((p) => (
            <div className="line" key={p.id} data-testid="wishlist-item">
              <Link href={`/product/${p.slug}`} className={`line-art bg-${p.category}`}><ProductArt art={p.art} label={p.name} /></Link>
              <div className="line-info">
                <p className="brand">{p.brand}</p>
                <Link href={`/product/${p.slug}`} className="line-name">{p.name}</Link>
                <p className="price"><b>{inr(p.price)}</b>{p.mrp > p.price && <s>{inr(p.mrp)}</s>}</p>
              </div>
              <div className="line-actions">
                <AddToCartButton productId={p.id} disabled={p.stock <= 0} moveFromWishlist label="Move to cart" />
                <WishlistButton productId={p.id} initial compact />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
