import 'server-only';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { query, one } from './db';

export const SESSION_COOKIE = 'plz_session';
const SESSION_DAYS = 30;

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const checkPassword = (pw, hash) => bcrypt.compare(pw, hash);

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function validateSignup({ name, email, password }) {
  const errors = {};
  if (!name || String(name).trim().length < 2) errors.name = 'Please enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email))) errors.email = 'Please enter a valid email address.';
  if (!password || password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) errors.password = 'Use at least one letter and one number.';
  return errors;
}

export async function createSession(userId) {
  const id = randomToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await query('INSERT INTO sessions (id, user_id, expires_at) VALUES ($1,$2,$3)', [id, userId, expires]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) await query('DELETE FROM sessions WHERE id = $1', [id]);
  jar.delete(SESSION_COOKIE);
}

export async function currentUser() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return one(
    `SELECT u.id, u.name, u.email, u.email_verified, u.welcome_sent, u.created_at
       FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.id = $1 AND s.expires_at > NOW()`,
    [id]
  );
}

export async function issueEmailToken(userId, purpose, hours = 24) {
  const token = randomToken(32);
  await query(
    `INSERT INTO email_tokens (token, user_id, purpose, expires_at) VALUES ($1,$2,$3,$4)`,
    [token, userId, purpose, new Date(Date.now() + hours * 36e5)]
  );
  return token;
}
