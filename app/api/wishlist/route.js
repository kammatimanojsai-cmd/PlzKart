import { one, query } from '@/lib/db';
import { json, fail, readJson, requireUser, handle } from '@/lib/api';

export const POST = handle(async (req) => {
  const { user, error } = await requireUser();
  if (error) return error;
  const { productId } = await readJson(req);
  const product = await one('SELECT id FROM products WHERE id = $1', [Number(productId)]);
  if (!product) return fail('Product not found.', 404);

  const removed = await one('DELETE FROM wishlist_items WHERE user_id=$1 AND product_id=$2 RETURNING product_id', [user.id, product.id]);
  if (!removed) await query('INSERT INTO wishlist_items (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [user.id, product.id]);
  return json({ ok: true, inWishlist: !removed });
});
