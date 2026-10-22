import Link from 'next/link';
import ProductArt from './ProductArt';
import { WishlistButton, AddToCartButton } from './client';
import { inr, discountPct } from '@/lib/format';

export default function ProductCard({ p, wished }) {
  const off = discountPct(p.price, p.mrp);
  return (
    <article className="card" data-category={p.category}>
      <Link href={`/product/${p.slug}`} className={`card-art bg-${p.category}`}>
        <ProductArt art={p.art} label={p.name} />
        {off > 0 && <span className="badge">{off}% off</span>}
      </Link>
      <div className="card-wish"><WishlistButton productId={p.id} initial={wished} compact /></div>
      <div className="card-body">
        <p className="brand">{p.brand}</p>
        <h3 className="card-title"><Link href={`/product/${p.slug}`}>{p.name}</Link></h3>
        <p className="rating" aria-label={`Rated ${p.rating} out of 5`}>★ {Number(p.rating).toFixed(1)}</p>
        <p className="price"><b>{inr(p.price)}</b>{p.mrp > p.price && <s>{inr(p.mrp)}</s>}</p>
        <AddToCartButton productId={p.id} disabled={p.stock <= 0} />
      </div>
    </article>
  );
}
