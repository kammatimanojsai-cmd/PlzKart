export const inr = (n) =>
  '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const discountPct = (price, mrp) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

export const SHIPPING_FREE_ABOVE = 999;
export const SHIPPING_FEE = 79;
export const shippingFor = (subtotal) => (subtotal === 0 || subtotal >= SHIPPING_FREE_ABOVE ? 0 : SHIPPING_FEE);

export function baseUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const h = req.headers;
  const host = h.get('x-forwarded-host') || h.get('host');
  const proto = h.get('x-forwarded-proto') || (host?.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
