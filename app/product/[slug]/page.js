import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductArt from '@/components/ProductArt';
import ProductCard from '@/components/ProductCard';
import { WishlistButton, AddToCartButton } from '@/components/client';
import { getProduct, listProducts, wishlistIds } from '@/lib/store';
import { categoryByKey } from '@/lib/catalog';
import { currentUser } from '@/lib/auth';
import { inr, discountPct, SHIPPING_FREE_ABOVE } from '@/lib/format';

export async function generateMetadata({ params }) {
  const p = await getProduct((await params).slug);
  return { title: p ? p.name : 'Product not found' };
}

export default async function ProductPage({ params }) {
  const p = await getProduct((await params).slug);
  if (!p) notFound();
  const user = await currentUser();
  const [wished, related] = await Promise.all([wishlistIds(user?.id), listProducts({ category: p.category })]);
  const cat = categoryByKey(p.category);
  const off = discountPct(p.price, p.mrp);

  return (
    <>
      <nav className="crumbs"><Link href="/">Home</Link> / <Link href={`/shop?category=${p.category}`}>{cat.label}</Link> / <span>{p.name}</span></nav>
      <section className="pdp">
        <div className={`pdp-art bg-${p.category}`}><ProductArt art={p.art} label={p.name} /></div>
        <div className="pdp-info">
          <p className="brand">{p.brand}</p>
          <h1>{p.name}</h1>
          <p className="rating">★ {Number(p.rating).toFixed(1)} <span className="muted">· {cat.label}</span></p>
          <p className="price big"><b>{inr(p.price)}</b>{p.mrp > p.price && <><s>{inr(p.mrp)}</s><span className="save">{off}% off</span></>}</p>
          <p className="muted small">Inclusive of all taxes. Free shipping above {inr(SHIPPING_FREE_ABOVE)}.</p>
          <p className="desc">{p.description}</p>
          <p className={p.stock > 0 ? 'stock ok' : 'stock no'}>{p.stock > 10 ? 'In stock' : p.stock > 0 ? `Only ${p.stock} left` : 'Out of stock'}</p>
          <div className="pdp-actions">
            <AddToCartButton productId={p.id} disabled={p.stock <= 0} />
            <WishlistButton productId={p.id} initial={wished.has(p.id)} />
          </div>
        </div>
      </section>
      <section className="row">
        <div className="row-head"><h2>More in {cat.label}</h2></div>
        <div className="grid">
          {related.filter((r) => r.id !== p.id).slice(0, 4).map((r) => <ProductCard key={r.id} p={r} wished={wished.has(r.id)} />)}
        </div>
      </section>
    </>
  );
}
