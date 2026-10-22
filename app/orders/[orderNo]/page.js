import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import ProductArt from '@/components/ProductArt';
import { currentUser } from '@/lib/auth';
import { orderDetail } from '@/lib/store';
import { inr } from '@/lib/format';

export const metadata = { title: 'Order details' };

export default async function OrderPage({ params, searchParams }) {
  const { orderNo } = await params;
  const { placed } = await searchParams;
  const user = await currentUser();
  if (!user) redirect(`/login?next=/orders/${encodeURIComponent(orderNo)}`);
  const d = await orderDetail(user.id, orderNo);
  if (!d) notFound();
  const { order: o, items } = d;
  return (
    <>
      {placed && <div className="notice ok" data-testid="order-placed">Order placed! A confirmation email has been sent to {user.email}.</div>}
      <nav className="crumbs"><Link href="/orders">My orders</Link> / <span>{o.order_no}</span></nav>
      <h1>Order {o.order_no}</h1>
      <p className="muted">Placed {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} · <span className="pill ok">{o.status}</span></p>
      <div className="cart-layout">
        <div className="lines">
          {items.map((i) => (
            <div className="line" key={i.id}>
              <div className="line-art bg-neutral"><ProductArt art={i.art} label={i.name} /></div>
              <div className="line-info"><p className="line-name">{i.name}</p><p className="muted small">{inr(i.price)} × {i.qty}</p></div>
              <p className="line-total">{inr(i.price * i.qty)}</p>
            </div>
          ))}
        </div>
        <aside className="summary panel">
          <h2 className="h3">Summary</h2>
          <dl>
            <div><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
            <div><dt>Shipping</dt><dd>{o.shipping ? inr(o.shipping) : 'Free'}</dd></div>
            <div className="total"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
          </dl>
          <h3 className="h4">Payment</h3>
          <p className="small">{o.payment_method}</p>
          <h3 className="h4">Shipping to</h3>
          <p className="small">{o.ship_name}<br />{o.ship_address}<br />{o.ship_city} – {o.ship_pincode}<br />{o.ship_phone}</p>
        </aside>
      </div>
    </>
  );
}
