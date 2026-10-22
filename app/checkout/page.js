import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckoutForm, ResendVerification } from '@/components/client';
import Summary from '@/components/Summary';
import { currentUser } from '@/lib/auth';
import { cart } from '@/lib/store';

export const metadata = { title: 'Checkout' };

export default async function Checkout() {
  const user = await currentUser();
  if (!user) redirect('/login?next=/checkout');
  const items = await cart(user.id);
  if (!items.length) redirect('/cart');
  return (
    <>
      <h1>Checkout</h1>
      <div className="cart-layout">
        <div className="panel">
          {user.email_verified ? (
            <CheckoutForm defaultName={user.name} />
          ) : (
            <div>
              <div className="notice warn">Please verify your email ({user.email}) before placing an order.</div>
              <ResendVerification />
            </div>
          )}
        </div>
        <Summary items={items}><Link href="/cart" className="small">← Edit cart</Link></Summary>
      </div>
    </>
  );
}
