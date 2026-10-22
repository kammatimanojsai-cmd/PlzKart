import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProductArt from '@/components/ProductArt';
import { QtyControl } from '@/components/client';
import { currentUser } from '@/lib/auth';
import { cart } from '@/lib/store';
import Summary from '@/components/Summary';
import { inr } from '@/lib/format';

export const metadata = { title: 'Cart' };

export default async function Cart() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/cart');
  const items = await cart(user.id);
  if (!items.length) {
    return (
      <>
        <h1>Your cart</h1>
        <div className="empty"><p>Your cart is empty.</p><Link href="/shop" className="btn btn-primary">Start shopping</Link></div>
      </>
    );
  }
  return (
    <>
      <h1>Your cart</h1>
      <div className="cart-layout">
        <div className="lines">
          {items.map((p) => (
            <div className="line" key={p.id} data-testid="cart-item">
              <Link href={`/product/${p.slug}`} className={`line-art bg-${p.category}`}><ProductArt art={p.art} label={p.name} /></Link>
              <div className="line-info">
                <p className="brand">{p.brand}</p>
                <Link href={`/product/${p.slug}`} className="line-name">{p.name}</Link>
                <p className="price"><b>{inr(p.price)}</b>{p.mrp > p.price && <s>{inr(p.mrp)}</s>}</p>
                <QtyControl productId={p.id} qty={p.qty} max={p.stock} />
              </div>
              <p className="line-total">{inr(p.price * p.qty)}</p>
            </div>
          ))}
        </div>
        <Summary items={items}>
          <Link href="/checkout" className="btn btn-primary btn-block" data-testid="go-checkout">Proceed to checkout</Link>
        </Summary>
      </div>
    </>
  );
}
