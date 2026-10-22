import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="empty">
      <h1>Page not found</h1>
      <p>We couldn't find what you were looking for.</p>
      <Link href="/shop" className="btn btn-primary">Back to the shop</Link>
    </div>
  );
}
