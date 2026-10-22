import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { CATEGORIES, categoryByKey } from '@/lib/catalog';
import { listProducts, wishlistIds } from '@/lib/store';
import { currentUser } from '@/lib/auth';

export const metadata = { title: 'Shop' };

export default async function Shop({ searchParams }) {
  const sp = await searchParams;
  const category = categoryByKey(sp.category) ? sp.category : undefined;
  const gender = ['men', 'women'].includes(sp.gender) ? sp.gender : undefined;
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 60) : '';
  const sort = sp.sort;

  const user = await currentUser();
  const [items, wished] = await Promise.all([listProducts({ gender, category, q, sort }), wishlistIds(user?.id)]);
  const title = category ? categoryByKey(category).label : gender === 'men' ? "Men's Collection" : gender === 'women' ? "Women's Collection" : q ? `Results for "${q}"` : 'All products';

  const href = (patch) => {
    const p = new URLSearchParams({ ...(gender && { gender }), ...(category && { category }), ...(q && { q }), ...(sort && { sort }), ...patch });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/shop?${p}`;
  };

  return (
    <div className="shop">
      <aside className="filters">
        <h2 className="h3">Filter</h2>
        <Link href="/shop" className={!gender && !category ? 'on' : ''}>All</Link>
        {['men', 'women'].map((g) => (
          <div key={g} className="filter-group">
            <Link href={`/shop?gender=${g}`} className={gender === g && !category ? 'on' : ''}>{g === 'men' ? 'Men' : 'Women'}</Link>
            {CATEGORIES.filter((c) => c.gender === g).map((c) => (
              <Link key={c.key} href={`/shop?category=${c.key}`} className={`sub ${category === c.key ? 'on' : ''}`}>{c.label.replace(/^(Men's|Women's) /, '')}</Link>
            ))}
          </div>
        ))}
      </aside>
      <section>
        <div className="row-head">
          <h1 className="h2">{title} <span className="muted small">({items.length})</span></h1>
          <div className="sort">
            Sort:
            {[['', 'Featured'], ['price-asc', 'Price ↑'], ['price-desc', 'Price ↓'], ['rating', 'Top rated']].map(([v, l]) => (
              <Link key={v} href={href({ sort: v })} className={(sort || '') === v ? 'on' : ''}>{l}</Link>
            ))}
          </div>
        </div>
        {items.length ? (
          <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} wished={wished.has(p.id)} />)}</div>
        ) : (
          <div className="empty"><p>No products match that search.</p><Link href="/shop" className="btn btn-ghost">See everything</Link></div>
        )}
      </section>
    </div>
  );
}
