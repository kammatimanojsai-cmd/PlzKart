export const metadata = { title: 'Privacy' };

export default function Privacy() {
  return (
    <article className="prose">
      <h1>Privacy &amp; account activity</h1>
      <p className="muted">PlzKart is a college demo store. This page explains what we store and who is notified.</p>

      <h2 className="h3">What we store</h2>
      <ul>
        <li>Your name, email address and a one-way hashed password (we never store or see your actual password).</li>
        <li>Your wishlist, cart and demo orders, including the shipping details you enter at checkout.</li>
        <li>A sign-in session cookie so you stay logged in. It is http-only and expires after 30 days or when you log out.</li>
      </ul>

      <h2 className="h3">Emails we send you</h2>
      <ul>
        <li>An email verification link, a welcome email, password reset links you request, and order confirmations.</li>
      </ul>

      <h2 className="h3">Site owner notifications</h2>
      <p>To monitor the store, the site owner receives an email when:</p>
      <ul>
        <li><b>A new account is registered</b> — containing your name, email address and the registration date and time.</li>
        <li><b>You sign in</b> — containing your name, email address and the sign-in time (at most once every 30 minutes).</li>
      </ul>
      <p>These notices never include your password, reset or verification links, session tokens or payment information. Failed sign-in attempts are not reported. They are sent from our server only.</p>

      <h2 className="h3">Payments</h2>
      <p>Checkout is a demo. No card or bank details are collected and no money is charged.</p>

      <h2 className="h3">Questions or deletion</h2>
      <p>Contact the site owner through the GitHub repository linked in the project README to ask about or delete your data.</p>
    </article>
  );
}
