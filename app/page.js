import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ProductArt from '@/components/ProductArt';
import { CATEGORIES, PRODUCTS } from '@/lib/catalog';
import { listProducts, wishlistIds } from '@/lib/store';
import { currentUser } from '@/lib/auth';

export default async function Home() {
  const user = await currentUser();
  const [all, wished] = await Promise.all([listProducts(), wishlistIds(user?.id)]);
  const pick = (cat) => all.filter((p) => p.category === cat).slice(0, 4);
  const sample = (cat) => PRODUCTS.find((p) => p.category === cat).art;

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">New season edit</p>
          <h1>Look sharp. Smell amazing.</h1>
          <p className="lead">Crisp shirts and statement watches for him. Beauty essentials and signature perfumes for her. All in one cart.</p>
          <div className="hero-cta">
            <Link href="/shop?gender=men" className="btn btn-primary">Shop Men</Link>
            <Link href="/shop?gender=women" className="btn btn-ghost">Shop Women</Link>
          </div>
          <p className="muted small">Free shipping on orders above ₹999</p>
        </div>
        <div className="hero-art">
          <div className="bg-watches"><ProductArt art={sample('watches')} label="Watch" /></div>
          <div className="bg-perfumes"><ProductArt art={sample('perfumes')} label="Perfume" /></div>
        </div>
      </section>

      <section className="cats">
        {CATEGORIES.map((c) => (
          <Link key={c.key} href={`/shop?category=${c.key}`} className={`cat bg-${c.key}`}>
            <ProductArt art={sample(c.key)} label={c.label} />
            <span><b>{c.label}</b><small>{c.blurb}</small></span>
          </Link>
        ))}
      </section>

      {CATEGORIES.map((c) => (
        <section key={c.key} className="row" id={c.key}>
          <div className="row-head">
            <h2>{c.label}</h2>
            <Link href={`/shop?category=${c.key}`}>View all →</Link>
          </div>
          <div className="grid">
            {pick(c.key).map((p) => <ProductCard key={p.id} p={p} wished={wished.has(p.id)} />)}
          </div>
        </section>
      ))}
    </>
  );
}
