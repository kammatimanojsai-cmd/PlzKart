import Link from 'next/link';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { orders } from '@/lib/store';
import { inr } from '@/lib/format';

export const metadata = { title: 'My orders' };

export default async function Orders() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/orders');
  const list = await orders(user.id);
  return (
    <>
      <h1>My orders</h1>
      {!list.length ? (
        <div className="empty"><p>You haven't placed any orders yet.</p><Link href="/shop" className="btn btn-primary">Start shopping</Link></div>
      ) : (
        <div className="orders">
          {list.map((o) => (
            <Link key={o.id} href={`/orders/${o.order_no}`} className="order panel" data-testid="order-row">
              <div><p className="muted small">Order</p><b>{o.order_no}</b></div>
              <div><p className="muted small">Placed</p>{new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}</div>
              <div><p className="muted small">Items</p>{o.item_count}</div>
              <div><p className="muted small">Total</p><b>{inr(o.total)}</b></div>
              <span className="pill ok">{o.status}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
