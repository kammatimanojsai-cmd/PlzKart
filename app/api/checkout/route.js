import crypto from 'node:crypto';
import { one, query } from '@/lib/db';
import { cart } from '@/lib/store';
import { shippingFor, baseUrl } from '@/lib/format';
import { sendEmail, orderEmail } from '@/lib/email';
import { json, fail, readJson, requireUser, handle } from '@/lib/api';

const PAYMENTS = { 'demo-card': 'Demo Card (test mode)', 'demo-upi': 'Demo UPI (test mode)', cod: 'Cash on Delivery' };

export const POST = handle(async (req) => {
  const { user, error } = await requireUser();
  if (error) return error;
  if (!user.email_verified) return fail('Please verify your email before placing an order.', 403, { needVerify: true });

  const b = await readJson(req);
  const f = {
    name: String(b.name || '').trim(),
    phone: String(b.phone || '').replace(/[\s-]/g, ''),
    address: String(b.address || '').trim(),
    city: String(b.city || '').trim(),
    pincode: String(b.pincode || '').trim(),
  };
  const errors = {};
  if (f.name.length < 2) errors.name = 'Enter the recipient name.';
  if (!/^(\+91)?[6-9]\d{9}$/.test(f.phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  if (f.address.length < 8) errors.address = 'Enter the full street address.';
  if (f.city.length < 2) errors.city = 'Enter the city.';
  if (!/^[1-9]\d{5}$/.test(f.pincode)) errors.pincode = 'Enter a valid 6-digit PIN code.';
  if (!PAYMENTS[b.payment]) errors.payment = 'Choose a payment method.';
  if (Object.keys(errors).length) return fail('Please fix the highlighted fields.', 400, { errors });

  const items = await cart(user.id);
  if (!items.length) return fail('Your cart is empty.');
  for (const i of items) if (i.qty > i.stock) return fail(`Only ${i.stock} left of ${i.name}.`, 409);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = shippingFor(subtotal);
  const orderNo = 'PK' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase();

  const order = await one(
    `INSERT INTO orders (order_no, user_id, subtotal, shipping, total, payment_method, ship_name, ship_phone, ship_address, ship_city, ship_pincode)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [orderNo, user.id, subtotal, shipping, subtotal + shipping, PAYMENTS[b.payment], f.name, f.phone, f.address, f.city, f.pincode]
  );
  for (const i of items) {
    await query('INSERT INTO order_items (order_id, product_id, name, price, qty, art) VALUES ($1,$2,$3,$4,$5,$6)',
      [order.id, i.id, i.name, i.price, i.qty, JSON.stringify(i.art)]);
    await query('UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [i.qty, i.id]);
  }
  await query('DELETE FROM cart_items WHERE user_id = $1', [user.id]);

  const link = `${baseUrl(req)}/orders/${order.order_no}`;
  const mail = await sendEmail({ userId: user.id, kind: 'order', to: user.email, ...orderEmail(user.name, order, items, link) });
  return json({ ok: true, orderNo: order.order_no, emailSent: mail.ok });
});
