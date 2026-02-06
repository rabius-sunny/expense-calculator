import { redirect } from '@tanstack/react-router';

import { getSession } from './-auth.server';

export const requireAuth = async () => {
  const session = await getSession();
  if (!session.authenticated) {
    throw redirect({ to: '/login', replace: true });
  }
  return session;
};
