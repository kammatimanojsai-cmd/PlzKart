import 'server-only';
import { query, one } from './db';

export async function listProducts({ gender, category, q, sort } = {}) {
  const where = [];
  const params = [];
  if (gender) { params.push(gender); where.push(`gender = $${params.length}`); }
  if (category) { params.push(category); where.push(`category = $${params.length}`); }
  if (q) { params.push(`%${q}%`); where.push(`(name ILIKE $${params.length} OR brand ILIKE $${params.length} OR category ILIKE $${params.length} OR description ILIKE $${params.length})`); }
  const order = { 'price-asc': 'price ASC', 'price-desc': 'price DESC', rating: 'rating DESC' }[sort] || 'id ASC';
  return query(`SELECT * FROM products ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`, params);
}

export const getProduct = (slug) => one('SELECT * FROM products WHERE slug = $1', [slug]);

export async function wishlistIds(userId) {
  if (!userId) return new Set();
  const rows = await query('SELECT product_id FROM wishlist_items WHERE user_id = $1', [userId]);
  return new Set(rows.map((r) => r.product_id));
}

export const wishlist = (userId) =>
  query(
    `SELECT p.* FROM wishlist_items w JOIN products p ON p.id = w.product_id
      WHERE w.user_id = $1 ORDER BY w.created_at DESC`,
    [userId]
  );

export const cart = (userId) =>
  query(
    `SELECT p.*, c.qty FROM cart_items c JOIN products p ON p.id = c.product_id
      WHERE c.user_id = $1 ORDER BY p.id`,
    [userId]
  );

export async function counts(userId) {
  if (!userId) return { cart: 0, wishlist: 0 };
  const r = await one(
    `SELECT (SELECT COALESCE(SUM(qty),0) FROM cart_items WHERE user_id=$1)::int AS cart,
            (SELECT COUNT(*) FROM wishlist_items WHERE user_id=$1)::int AS wishlist`,
    [userId]
  );
  return { cart: Number(r.cart), wishlist: Number(r.wishlist) };
}

export const orders = (userId) =>
  query(
    `SELECT o.*, (SELECT COALESCE(SUM(qty),0) FROM order_items i WHERE i.order_id=o.id)::int AS item_count
       FROM orders o WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );

export async function orderDetail(userId, orderNo) {
  const order = await one('SELECT * FROM orders WHERE user_id = $1 AND order_no = $2', [userId, orderNo]);
  if (!order) return null;
  const items = await query('SELECT * FROM order_items WHERE order_id = $1 ORDER BY id', [order.id]);
  return { order, items };
}
