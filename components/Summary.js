import { inr, shippingFor, SHIPPING_FREE_ABOVE } from '@/lib/format';

export default function Summary({ items, children }) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const mrp = items.reduce((s, i) => s + i.mrp * i.qty, 0);
  const ship = shippingFor(subtotal);
  return (
    <aside className="summary panel">
      <h2 className="h3">Order summary</h2>
      <dl>
        <div><dt>Items ({items.reduce((s, i) => s + i.qty, 0)})</dt><dd>{inr(mrp)}</dd></div>
        <div><dt>Discount</dt><dd className="save">−{inr(mrp - subtotal)}</dd></div>
        <div><dt>Shipping</dt><dd>{ship ? inr(ship) : 'Free'}</dd></div>
        <div className="total"><dt>Total</dt><dd data-testid="cart-total">{inr(subtotal + ship)}</dd></div>
      </dl>
      {ship > 0 && <p className="muted small">Add {inr(SHIPPING_FREE_ABOVE - subtotal)} more for free shipping.</p>}
      {children}
    </aside>
  );
}
