import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { useState } from 'react';

import { getSession, login } from './-auth.server';

const getMonthValue = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const session = await getSession();
    if (session.authenticated) {
      throw redirect({
        to: '/',
        search: { month: getMonthValue(new Date()) },
        replace: true
      });
    }
  },
  component: Login
});

function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await login({ data: { email, password } });
      if (res instanceof Response) {
        if (!res.ok) {
          setError('Invalid email or password.');
          return;
        }
      }
      router.navigate({
        to: '/',
        search: { month: getMonthValue(new Date()) }
      });
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className='min-h-screen p-3 text-slate-900 dark:text-white md:p-4'
      style={{
        background: 'var(--page-bg)'
      }}
    >
      <div
        className='mx-auto w-full max-w-md space-y-6 rounded-xl border border-white/10 p-4 shadow-2xl md:p-6'
        style={{
          background: 'var(--panel-bg)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div>
          <p className='text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-indigo-200/70 md:text-sm'>
            Welcome back
          </p>
          <h1 className='text-2xl font-bold text-slate-900 dark:text-white md:text-3xl'>
            Sign in
          </h1>
          <p className='text-xs text-slate-600 dark:text-indigo-200/70 md:text-sm'>
            Use your admin credentials to access the dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className='space-y-4 rounded-lg border p-4 md:p-5'
          style={{
            background: 'var(--panel-soft)',
            borderColor: 'rgba(93, 103, 227, 0.2)'
          }}
        >
          <div>
            <label className='text-xs text-slate-700 dark:text-indigo-200 md:text-sm'>
              Email
            </label>
            <input
              type='email'
              required
              autoComplete='email'
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className='mt-2 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 dark:text-white md:px-4 md:py-3 md:text-base'
              style={{
                background: 'rgba(93, 103, 227, 0.1)',
                borderColor: 'rgba(93, 103, 227, 0.3)'
              }}
            />
          </div>

          <div>
            <label className='text-xs text-slate-700 dark:text-indigo-200 md:text-sm'>
              Password
            </label>
            <input
              type='password'
              required
              autoComplete='current-password'
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className='mt-2 w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 dark:text-white md:px-4 md:py-3 md:text-base'
              style={{
                background: 'rgba(93, 103, 227, 0.1)',
                borderColor: 'rgba(93, 103, 227, 0.3)'
              }}
            />
          </div>

          {error && (
            <p className='text-xs text-red-600 dark:text-red-200 md:text-sm'>
              {error}
            </p>
          )}

          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full rounded-lg px-4 py-2 font-semibold shadow-lg transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 md:py-3'
            style={{
              background: 'linear-gradient(135deg, #5d67e3 0%, #8b5cf6 100%)',
              color: 'white'
            }}
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
