import { createServerFn } from '@tanstack/react-start';

import type { Env } from '@/env';

const AUTH_COOKIE = 'expense_auth';
const AUTH_MAX_AGE = 60 * 60 * 24 * 365;

const encodeValue = (value: string) => {
  if (typeof btoa === 'function') return btoa(value);
  return Buffer.from(value, 'utf-8').toString('base64');
};

const getAuthToken = (env: Env) =>
  encodeValue(`${env.AUTH_EMAIL}:${env.AUTH_PASSWORD}`);

const parseCookies = (header: string | null) => {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  header.split(';').forEach((part) => {
    const [rawName, ...rest] = part.trim().split('=');
    if (!rawName) return;
    cookies[rawName] = decodeURIComponent(rest.join('='));
  });
  return cookies;
};

const isAuthedRequest = (request: Request, env: Env) => {
  const cookies = parseCookies(request.headers.get('cookie'));
  return cookies[AUTH_COOKIE] === getAuthToken(env);
};

const buildCookie = (value: string, request: Request, maxAge = AUTH_MAX_AGE) => {
  const secure = new URL(request.url).protocol === 'https:';
  const base = `${AUTH_COOKIE}=${encodeURIComponent(
    value
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
  return secure ? `${base}; Secure` : base;
};

const clearCookie = (request: Request) =>
  buildCookie('', request, 0);

export const getSession = createServerFn({ method: 'GET' }).handler(
  async (opts: any) => {
    const request = opts.request as Request;
    const env = opts.context.env as Env;
    return { authenticated: isAuthedRequest(request, env) };
  }
);

export const login = createServerFn({ method: 'POST' })
  .inputValidator(
    (data: { email: string; password: string }) => data
  )
  .handler(async (opts: any) => {
    const { data, context, request } = opts as {
      data: { email: string; password: string };
      context: { env: Env };
      request: Request;
    };
    const env = context.env;
    const valid =
      data.email === env.AUTH_EMAIL && data.password === env.AUTH_PASSWORD;

    if (!valid) {
      return new Response(JSON.stringify({ success: false }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const cookie = buildCookie(getAuthToken(env), request);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    });
  });

export const logout = createServerFn({ method: 'POST' }).handler(
  async (opts: any) => {
    const request = opts.request as Request;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': clearCookie(request)
      }
    });
  }
);
