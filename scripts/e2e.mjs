// End-to-end test for PlzKart over HTTP.
//
// Local run (captures email with a built-in SMTP sink):
//   1) SMTP_HOST=127.0.0.1 SMTP_PORT=2525 SMTP_USER=test SMTP_PASS=test npm run build && npm start
//   2) node scripts/e2e.mjs            (starts the SMTP sink on :2525 itself)
//
// Against a deployed site with real email, pass a verification link manually:
//   BASE_URL=https://your-app.vercel.app E2E_SKIP_EMAIL=1 node scripts/e2e.mjs

import assert from 'node:assert/strict';

const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const SKIP_EMAIL = !!process.env.E2E_SKIP_EMAIL;
const inbox = [];

async function startSink() {
  const { SMTPServer } = await import('smtp-server');
  const { simpleParser } = await import('mailparser');
  const server = new SMTPServer({
    authOptional: true, disabledCommands: ['STARTTLS'], logger: false,
    onAuth(_a, _s, cb) { cb(null, { user: 'test' }); },
    onData(stream, _s, cb) {
      simpleParser(stream).then((m) => { inbox.push(m); cb(); }).catch(cb);
    },
  });
  await new Promise((r) => server.listen(2525, '127.0.0.1', r));
  return server;
}

class Client {
  cookie = '';
  async req(path, { method = 'GET', body, redirect = 'manual' } = {}) {
    const res = await fetch(BASE + path, {
      method, redirect,
      headers: { ...(body && { 'Content-Type': 'application/json' }), ...(this.cookie && { Cookie: this.cookie }) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.getSetCookie?.() || [];
    for (const c of set) {
      const [kv] = c.split(';');
      const [k, v] = kv.split('=');
      if (k === 'plz_session') this.cookie = v ? `plz_session=${v}` : '';
    }
    return res;
  }
  async json(path, opts) { const r = await this.req(path, opts); return { status: r.status, ...(await r.json()) }; }
  async html(path) { const r = await this.req(path); return { status: r.status, location: r.headers.get('location'), text: await r.text() }; }
}

const results = [];
async function step(name, fn) {
  try { await fn(); results.push(['PASS', name]); console.log('PASS', name); }
  catch (e) { results.push(['FAIL', name, e.message]); console.log('FAIL', name, '-', e.message); throw e; }
}
const waitFor = async (pred, ms = 15000) => {
  const t = Date.now();
  while (Date.now() - t < ms) { const v = pred(); if (v) return v; await new Promise((r) => setTimeout(r, 200)); }
  throw new Error('timed out waiting for email');
};

const sink = SKIP_EMAIL ? null : await startSink();
const c = new Client();
const email = `e2e+${Date.now()}@example.com`;
const password = 'Plzkart2026';
let productIds = {};

try {
  await step('health: database ready and products seeded', async () => {
    const h = await c.json('/api/health');
    assert.equal(h.ok, true, h.error);
    assert.ok(h.products >= 24, `products=${h.products}`);
  });

  await step("home shows men's shirts & watches and women's beauty & perfumes", async () => {
    const { status, text } = await c.html('/');
    assert.equal(status, 200);
    for (const s of ["Men&#x27;s Shirts", "Men&#x27;s Watches", "Women&#x27;s Beauty", "Women&#x27;s Perfumes", 'Classic White Oxford Shirt', 'Steel Chronograph Watch', 'Velvet Matte Lipstick', 'Midnight Rose Eau de Parfum']) {
      assert.ok(text.includes(s), `missing "${s}"`);
    }
  });

  await step('category pages list 6 products each', async () => {
    for (const cat of ['shirts', 'watches', 'beauty', 'perfumes']) {
      const { text } = await c.html(`/shop?category=${cat}`);
      const n = (text.match(/data-category="/g) || []).length;
      assert.equal(n, 6, `${cat} has ${n}`);
    }
    const { text } = await c.html('/shop?q=perfume');
    assert.ok(text.includes('Vanilla Amber Perfume'));
  });

  await step('product page renders', async () => {
    const { status, text } = await c.html('/product/green-dial-diver-watch');
    assert.equal(status, 200);
    assert.ok(text.includes('Green Dial Diver Watch'));
    const nf = await c.html('/product/does-not-exist');
    assert.equal(nf.status, 404);
  });

  await step('guests are sent to login for cart / wishlist', async () => {
    const r = await c.json('/api/cart', { method: 'POST', body: { productId: 1 } });
    assert.equal(r.status, 401);
    const page = await c.html('/cart');
    assert.ok([307, 302, 303].includes(page.status) || page.text.includes('NEXT_REDIRECT'), `status ${page.status}`);
  });

  await step('signup validation rejects bad input', async () => {
    const r = await c.json('/api/auth/signup', { method: 'POST', body: { name: 'A', email: 'nope', password: 'short' } });
    assert.equal(r.status, 400);
    assert.ok(r.errors.name && r.errors.email && r.errors.password);
  });

  await step('signup creates account, logs in and sends verification email', async () => {
    const r = await c.json('/api/auth/signup', { method: 'POST', body: { name: 'Test Student', email, password } });
    assert.equal(r.ok, true, r.error);
    assert.ok(c.cookie, 'no session cookie');
    if (!SKIP_EMAIL) assert.equal(r.emailSent, true, 'emailSent false');
    const dup = await c.json('/api/auth/signup', { method: 'POST', body: { name: 'Test Student', email, password } });
    assert.equal(dup.status, 409);
  });

  const ADMIN = process.env.E2E_ADMIN_EMAIL || 'admin@plzkart.test';
  const adminMails = (kind) => inbox.filter((x) => x.to.text.includes(ADMIN) && x.text.includes(email) && (kind === 'signup' ? /registration/i.test(x.subject) : /login/i.test(x.subject)));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  if (!SKIP_EMAIL) {
    await step('admin gets one registration notice with name, email, time and no secrets', async () => {
      const m = await waitFor(() => adminMails('signup')[0]);
      assert.ok(m.text.includes('Test Student') && m.text.includes(email) && /Registered: .+IST/.test(m.text), m.text);
      for (const secret of [password, 'token=', 'verify?', 'reset-password', 'plz_session']) {
        assert.ok(!m.text.includes(secret) && !m.html.includes(secret), `admin email leaks "${secret}"`);
      }
      await sleep(1500);
      assert.equal(adminMails('signup').length, 1, 'duplicate registration notice');
    });
  }

  await step('unverified user cannot check out', async () => {
    const r = await c.json('/api/checkout', { method: 'POST', body: {} });
    assert.equal(r.status, 403);
    assert.equal(r.needVerify, true);
  });

  let verifyLink;
  if (!SKIP_EMAIL) {
    await step('verification email received with working link', async () => {
      const m = await waitFor(() => inbox.find((x) => x.to.text.includes(email) && /Verify/.test(x.subject)));
      verifyLink = (m.text.match(/https?:\/\/\S+\/verify\?token=\S+/) || [])[0];
      assert.ok(verifyLink, 'no link in email');
    });
    await step('verify link marks account verified and sends welcome email', async () => {
      const path = verifyLink.replace(/^https?:\/\/[^/]+/, '');
      const r = await c.html(path);
      assert.ok(String(r.location).includes('verify=success'), `location ${r.location}`);
      const acct = await c.html('/account');
      assert.ok(acct.text.includes('data-testid="verified"'));
      await waitFor(() => inbox.find((x) => x.to.text.includes(email) && /Welcome/.test(x.subject)));
      const again = await c.html(path);
      assert.ok(String(again.location).includes('verify=already'));
    });
  }

  await step('logout then login (wrong + right password)', async () => {
    await c.json('/api/auth/logout', { method: 'POST' });
    assert.equal(c.cookie, '');
    const bad = await c.json('/api/auth/login', { method: 'POST', body: { email, password: 'wrongpass1' } });
    assert.equal(bad.status, 401);
    const ok = await c.json('/api/auth/login', { method: 'POST', body: { email: email.toUpperCase(), password } });
    assert.equal(ok.ok, true);
    assert.ok(c.cookie);
  });

  if (!SKIP_EMAIL) {
    await step('admin login notice: only on success, no secrets, no duplicates on quick re-login', async () => {
      const m = await waitFor(() => adminMails('login')[0]);
      assert.ok(m.text.includes('Test Student') && m.text.includes(email) && /Signed in: .+IST/.test(m.text));
      assert.ok(!m.text.includes(password) && !m.text.includes('wrongpass1') && !m.html.includes(password));
      // the failed attempt above produced nothing; a second successful login right away is de-duplicated
      await c.json('/api/auth/login', { method: 'POST', body: { email, password: 'wrongpass1' } });
      const again = await c.json('/api/auth/login', { method: 'POST', body: { email, password } });
      assert.equal(again.ok, true);
      await sleep(2000);
      assert.equal(adminMails('login').length, 1, `expected 1 login notice, got ${adminMails('login').length}`);
    });
  }

  if (!SKIP_EMAIL) {
    await step('forgot password: same answer for unknown email, reset email for real one', async () => {
      const unknown = await c.json('/api/auth/forgot', { method: 'POST', body: { email: 'nobody-here@example.com' } });
      const known = await c.json('/api/auth/forgot', { method: 'POST', body: { email } });
      assert.equal(unknown.message, known.message);
      const m = await waitFor(() => inbox.find((x) => x.to.text.includes(email) && /Reset/.test(x.subject)));
      const link = (m.text.match(/https?:\/\/\S+\/reset-password\?token=\S+/) || [])[0];
      assert.ok(link, 'no reset link');
      const token = new URL(link).searchParams.get('token');
      const page = await c.html(`/reset-password?token=${token}`);
      assert.equal(page.status, 200);
      const weak = await c.json('/api/auth/reset', { method: 'POST', body: { token, password: 'short' } });
      assert.equal(weak.status, 400);
      const ok = await c.json('/api/auth/reset', { method: 'POST', body: { token, password: 'NewPass2026' } });
      assert.equal(ok.ok, true, ok.error);
      const reuse = await c.json('/api/auth/reset', { method: 'POST', body: { token, password: 'Another2026' } });
      assert.equal(reuse.status, 400);
      const fresh = new Client();
      const old = await fresh.json('/api/auth/login', { method: 'POST', body: { email, password } });
      assert.equal(old.status, 401, 'old password still works');
      const neu = await fresh.json('/api/auth/login', { method: 'POST', body: { email, password: 'NewPass2026' } });
      assert.equal(neu.ok, true);
    });
  }

  // product ids from page markup are not exposed, so look them up via the shop order (ids are seeded in catalog order)
  productIds = { shirt: 1, watch: 7, lipstick: 13, perfume: 19 };

  await step('wishlist add, list, remove', async () => {
    const a = await c.json('/api/wishlist', { method: 'POST', body: { productId: productIds.perfume } });
    assert.equal(a.inWishlist, true);
    const b = await c.json('/api/wishlist', { method: 'POST', body: { productId: productIds.watch } });
    assert.equal(b.inWishlist, true);
    let page = await c.html('/wishlist');
    assert.equal((page.text.match(/data-testid="wishlist-item"/g) || []).length, 2);
    const d = await c.json('/api/wishlist', { method: 'POST', body: { productId: productIds.watch } });
    assert.equal(d.inWishlist, false);
    page = await c.html('/wishlist');
    assert.equal((page.text.match(/data-testid="wishlist-item"/g) || []).length, 1);
  });

  await step('cart add, increment, set qty, move from wishlist, remove', async () => {
    let r = await c.json('/api/cart', { method: 'POST', body: { productId: productIds.shirt } });
    assert.equal(r.qty, 1);
    r = await c.json('/api/cart', { method: 'POST', body: { productId: productIds.shirt } });
    assert.equal(r.qty, 2);
    r = await c.json('/api/cart', { method: 'POST', body: { productId: productIds.lipstick, qty: 3, mode: 'set' } });
    assert.equal(r.qty, 3);
    r = await c.json('/api/cart', { method: 'POST', body: { productId: productIds.perfume, moveFromWishlist: true } });
    assert.equal(r.counts.cart, 6);
    assert.equal(r.counts.wishlist, 0);
    r = await c.json('/api/cart', { method: 'POST', body: { productId: productIds.lipstick, qty: 0, mode: 'set' } });
    assert.equal(r.counts.cart, 3);
    const page = await c.html('/cart');
    assert.equal((page.text.match(/data-testid="cart-item"/g) || []).length, 2);
    // 2 x 1299 + 2799 = 5397, free shipping
    assert.ok(page.text.includes('₹5,397'), 'cart total mismatch');
  });

  if (!SKIP_EMAIL) {
    await step('checkout validates fields', async () => {
      const r = await c.json('/api/checkout', { method: 'POST', body: { name: 'X', phone: '123', address: 'a', city: '', pincode: '12', payment: 'bitcoin' } });
      assert.equal(r.status, 400);
      for (const k of ['name', 'phone', 'address', 'city', 'pincode', 'payment']) assert.ok(r.errors[k], `no error for ${k}`);
    });

    let orderNo;
    await step('demo checkout places order, empties cart, emails confirmation', async () => {
      const r = await c.json('/api/checkout', { method: 'POST', body: { name: 'Test Student', phone: '9876543210', address: '12 MG Road, Banjara Hills', city: 'Hyderabad', pincode: '500034', payment: 'demo-card' } });
      assert.equal(r.ok, true, r.error);
      orderNo = r.orderNo;
      const cart = await c.html('/cart');
      assert.ok(cart.text.includes('Your cart is empty'));
      await waitFor(() => inbox.find((x) => x.to.text.includes(email) && x.subject.includes(orderNo)));
    });

    await step('order history and order detail show the order', async () => {
      const list = await c.html('/orders');
      assert.ok(list.text.includes(orderNo));
      const d = await c.html(`/orders/${orderNo}`);
      assert.equal(d.status, 200);
      assert.ok(d.text.includes('Classic White Oxford Shirt') && d.text.includes('₹5,397'));
    });

    await step("other users cannot see this order", async () => {
      const other = new Client();
      await other.json('/api/auth/signup', { method: 'POST', body: { name: 'Other User', email: `other+${Date.now()}@example.com`, password } });
      const d = await other.html(`/orders/${orderNo}`);
      assert.equal(d.status, 404);
    });
  }
} catch {
  // reported below
} finally {
  sink?.close();
  const failed = results.filter((r) => r[0] === 'FAIL');
  console.log(`\n${results.length - failed.length}/${results.length} steps passed`);
  process.exit(failed.length ? 1 : 0);
}
