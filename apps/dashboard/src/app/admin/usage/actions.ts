'use server';

import { environment } from '@paklo/cli/environment';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'auth-auth';

export async function authenticate(prevState: string | undefined, formData: FormData) {
  try {
    const password = formData.get('password');
    if (password === process.env.ADMIN_DASHBOARD_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set(COOKIE_NAME, 'true', {
        httpOnly: true,
        secure: environment.production,
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
      });
      redirect('/admin/usage/view');
    } else {
      return 'Invalid password.';
    }
  } catch (error) {
    if ((error as Error).message.includes('credentialssignin')) {
      return 'Invalid credentials.';
    }
    throw error;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect('/');
}

export async function loggedIn() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === 'true';
}
