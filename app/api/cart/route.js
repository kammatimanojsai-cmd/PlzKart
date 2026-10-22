import { one, query } from '@/lib/db';
import { counts } from '@/lib/store';
import { json, fail, readJson, requireUser, handle } from '@/lib/api';

const MAX_QTY = 10;

// POST { productId, qty, mode: 'add' | 'set' }   qty 0 with mode 'set' removes the line
export const POST = handle(async (req) => {
  const { user, error } = await requireUser();
  if (error) return error;
  const { productId, qty = 1, mode = 'add', moveFromWishlist = false } = await readJson(req);
  const product = await one('SELECT id, stock FROM products WHERE id = $1', [Number(productId)]);
  if (!product) return fail('Product not found.', 404);

  const n = Math.floor(Number(qty));
  if (!Number.isFinite(n) || n < 0) return fail('Invalid quantity.');
  const existing = await one('SELECT qty FROM cart_items WHERE user_id=$1 AND product_id=$2', [user.id, product.id]);
  let next = mode === 'set' ? n : (existing?.qty || 0) + Math.max(1, n);
  next = Math.min(next, MAX_QTY, product.stock);

  if (next <= 0) {
    await query('DELETE FROM cart_items WHERE user_id=$1 AND product_id=$2', [user.id, product.id]);
  } else {
    await query(
      `INSERT INTO cart_items (user_id, product_id, qty) VALUES ($1,$2,$3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET qty = EXCLUDED.qty`,
      [user.id, product.id, next]
    );
  }
  if (moveFromWishlist) await query('DELETE FROM wishlist_items WHERE user_id=$1 AND product_id=$2', [user.id, product.id]);
  return json({ ok: true, qty: Math.max(next, 0), counts: await counts(user.id) });
});
