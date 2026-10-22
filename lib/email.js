import 'server-only';
import { query } from './db';
import { inr } from './format';

// Sends through Resend (RESEND_API_KEY) or any SMTP server (SMTP_HOST/USER/PASS).
// Every attempt is written to email_log so delivery can be audited.

// Trim whitespace and any quotes pasted around the value in the dashboard.
const env = (k) => (process.env[k] || '').trim().replace(/^(['"])(.*)\1$/, '$2').trim();
// Google shows App Passwords as "abcd efgh ijkl mnop"; SMTP needs them without spaces.
const smtpPass = () => env('SMTP_PASS').replace(/\s+/g, '');

export function emailProvider() {
  if (env('RESEND_API_KEY')) return 'resend';
  if (env('SMTP_HOST') && env('SMTP_USER') && smtpPass()) return 'smtp';
  return null;
}

function fromAddress() {
  if (env('EMAIL_FROM')) return env('EMAIL_FROM');
  if (emailProvider() === 'smtp') return `PlzKart <${env('SMTP_USER')}>`;
  return 'PlzKart <onboarding@resend.dev>';
}

async function deliver({ to, subject, html, text }) {
  const provider = emailProvider();
  if (provider === 'resend') {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddress(), to: [to], subject, html, text }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Resend ${res.status}: ${body?.message || JSON.stringify(body)}`);
    return { provider, id: body.id };
  }
  if (provider === 'smtp') {
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(env('SMTP_PORT') || 465);
    const transport = nodemailer.createTransport({
      host: env('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: { user: env('SMTP_USER'), pass: smtpPass() },
      // keep serverless functions from hanging on a bad SMTP connection
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    const info = await transport.sendMail({ from: fromAddress(), to, subject, html, text });
    return { provider, id: info.messageId };
  }
  return { provider: null, id: null };
}

export async function sendEmail({ userId = null, kind, to, subject, html, text }) {
  try {
    const r = await deliver({ to, subject, html, text });
    const status = r.provider ? 'sent' : 'skipped';
    await query(
      'INSERT INTO email_log (user_id, kind, to_email, status, provider, detail) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, kind, to, status, r.provider, r.id || (r.provider ? null : 'No email provider configured')]
    );
    if (!r.provider) {
      // Never log email bodies (they contain verification tokens) in production.
      console.warn(`[email] ${kind} not sent: no email provider configured (set SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY).`
        + (process.env.NODE_ENV === 'production' ? '' : `\n${text}`));
    }
    return { ok: !!r.provider, skipped: !r.provider };
  } catch (e) {
    console.error(`[email] ${kind} failed via ${emailProvider()}:`, e.code || '', e.responseCode || '', e.message);
    await query(
      'INSERT INTO email_log (user_id, kind, to_email, status, provider, detail) VALUES ($1,$2,$3,$4,$5,$6)',
      [userId, kind, to, 'failed', emailProvider(), String(e.message).slice(0, 500)]
    ).catch(() => {});
    return { ok: false, error: e.message };
  }
}

// ---------- templates ----------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f4f2fb;font-family:Arial,Helvetica,sans-serif;color:#1d1b2e">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden">
    <tr><td style="background:#3b2fc9;padding:20px 28px;color:#ffffff;font-size:22px;font-weight:bold">Plz<span style="color:#ffb39b">Kart</span></td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 14px;font-size:20px">${esc(title)}</h1>
      ${bodyHtml}
    </td></tr>
    <tr><td style="padding:16px 28px;background:#faf9fe;color:#77748c;font-size:12px">PlzKart is a college demo store. No real payments are processed.</td></tr>
  </table></td></tr></table></body></html>`;
}

const button = (href, label) =>
  `<p style="margin:22px 0"><a href="${esc(href)}" style="background:#3b2fc9;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;display:inline-block">${esc(label)}</a></p>`;

export function verificationEmail(name, link) {
  return {
    subject: 'Verify your PlzKart email',
    html: layout(`Hi ${name}, confirm your email`, `
      <p style="line-height:1.6">Thanks for signing up for PlzKart. Please confirm this is your email address to activate your account.</p>
      ${button(link, 'Verify my email')}
      <p style="color:#77748c;font-size:13px;line-height:1.6">This link expires in 24 hours. If the button doesn't work, paste this into your browser:<br><span style="word-break:break-all">${esc(link)}</span></p>
      <p style="color:#77748c;font-size:13px">If you didn't create an account, you can ignore this email.</p>`),
    text: `Hi ${name},\n\nConfirm your PlzKart email by opening this link (valid 24 hours):\n${link}\n\nIf you didn't sign up, ignore this email.`,
  };
}

export function welcomeEmail(name, shopLink) {
  return {
    subject: 'Welcome to PlzKart!',
    html: layout(`Welcome aboard, ${name}!`, `
      <p style="line-height:1.6">Your email is verified and your PlzKart account is ready.</p>
      <ul style="line-height:1.8;padding-left:18px">
        <li>Men's shirts and watches</li>
        <li>Women's beauty and perfumes</li>
        <li>Save favourites to your wishlist and check out in seconds</li>
      </ul>
      ${button(shopLink, 'Start shopping')}`),
    text: `Welcome aboard, ${name}!\n\nYour PlzKart account is ready. Start shopping: ${shopLink}`,
  };
}

export function resetEmail(name, link) {
  return {
    subject: 'Reset your PlzKart password',
    html: layout(`Hi ${name}, reset your password`, `
      <p style="line-height:1.6">We received a request to reset your PlzKart password.</p>
      ${button(link, 'Choose a new password')}
      <p style="color:#77748c;font-size:13px;line-height:1.6">This link expires in 1 hour and works once. If the button doesn't work, paste this into your browser:<br><span style="word-break:break-all">${esc(link)}</span></p>
      <p style="color:#77748c;font-size:13px">If you didn't ask for this, you can ignore this email — your password won't change.</p>`),
    text: `Hi ${name},\n\nReset your PlzKart password with this link (valid 1 hour):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
  };
}

export function orderEmail(name, order, items, link) {
  const rows = items
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.name)} &times; ${i.qty}</td><td align="right">${inr(i.price * i.qty)}</td></tr>`)
    .join('');
  return {
    subject: `Order ${order.order_no} confirmed`,
    html: layout(`Thanks for your order, ${name}!`, `
      <p style="line-height:1.6">Order <b>${esc(order.order_no)}</b> is confirmed (demo payment: ${esc(order.payment_method)}).</p>
      <table width="100%" style="font-size:14px;border-top:1px solid #eee;border-bottom:1px solid #eee;margin:12px 0">${rows}
        <tr><td style="padding:6px 0;color:#77748c">Shipping</td><td align="right" style="color:#77748c">${order.shipping ? inr(order.shipping) : 'Free'}</td></tr>
        <tr><td style="padding:8px 0"><b>Total</b></td><td align="right"><b>${inr(order.total)}</b></td></tr>
      </table>
      <p style="line-height:1.6;color:#55526a">Shipping to ${esc(order.ship_name)}, ${esc(order.ship_city)} ${esc(order.ship_pincode)}</p>
      ${button(link, 'View order')}`),
    text: `Order ${order.order_no} confirmed. Total ${inr(order.total)}. View: ${link}`,
  };
}
