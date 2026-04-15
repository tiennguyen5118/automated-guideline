import 'server-only';
import { cookies } from 'next/headers';
import { env } from './env';

export async function getOrCreateAuthorId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(env.SESSION_COOKIE_NAME)?.value;
  if (existing) return existing;
  const id = crypto.randomUUID();
  store.set(env.SESSION_COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export async function getAuthorId(): Promise<string | null> {
  const store = await cookies();
  return store.get(env.SESSION_COOKIE_NAME)?.value ?? null;
}
