import 'server-only';
import { after } from 'next/server';
import { one } from './db';
import { sendEmail, adminSignupEmail, adminLoginEmail } from './email';

// Admin notifications run server-side only, after the response has been sent (next/server `after`),
// so a slow or failing mail server can never delay or break signup/login.

const LOGIN_NOTICE_WINDOW_MIN = 30;

export function adminEmail() {
  const v = (process.env.ADMIN_EMAIL || '').trim().replace(/^(['"])(.*)\1$/, '$2').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? v : null;
}

export function loginNoticesEnabled() {
  return !/^(0|false|off|no)$/i.test((process.env.ADMIN_NOTIFY_LOGINS || 'true').trim());
}

function runLater(task) {
  const safe = async () => {
    try { await task(); } catch (e) { console.error('[admin-notify]', e.message); }
  };
  try { after(safe); } catch { safe(); } // outside a request scope (shouldn't happen) just run it
}

export function notifyAdminOfSignup(userId) {
  const to = adminEmail();
  if (!to) return;
  runLater(async () => {
    // Claim the notice atomically so it is sent at most once per account.
    const u = await one(
      `UPDATE users SET admin_signup_notified = TRUE
        WHERE id = $1 AND admin_signup_notified = FALSE
        RETURNING name, email, created_at`,
      [userId]
    );
    if (!u) return;
    await sendEmail({ userId, kind: 'admin_signup', to, ...adminSignupEmail({ name: u.name, email: u.email, createdAt: u.created_at }) });
  });
}

export function notifyAdminOfLogin(userId) {
  const to = adminEmail();
  if (!to || !loginNoticesEnabled()) return;
  runLater(async () => {
    // At most one login notice per user per window (prevents duplicates from double-submits/rapid re-logins).
    const u = await one(
      `UPDATE users SET last_login_notified_at = NOW()
        WHERE id = $1 AND (last_login_notified_at IS NULL
              OR last_login_notified_at < NOW() - ($2 || ' minutes')::interval)
        RETURNING name, email, last_login_notified_at AS at`,
      [userId, String(LOGIN_NOTICE_WINDOW_MIN)]
    );
    if (!u) return;
    await sendEmail({ userId, kind: 'admin_login', to, ...adminLoginEmail({ name: u.name, email: u.email, at: u.at }) });
  });
}
