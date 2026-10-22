import 'server-only';
import { NextResponse } from 'next/server';
import { currentUser } from './auth';

export const json = (data, status = 200) => NextResponse.json(data, { status });
export const fail = (message, status = 400, extra = {}) => NextResponse.json({ ok: false, error: message, ...extra }, { status });

export async function readJson(req) {
  try { return await req.json(); } catch { return {}; }
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) return { error: fail('Please log in first.', 401, { needLogin: true }) };
  return { user };
}

export function handle(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error('[api]', e);
      return fail('Something went wrong on our side. Please try again.', 500);
    }
  };
}
