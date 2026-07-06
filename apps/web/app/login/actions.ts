'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  try {
    const res = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return { error: data.error || 'Login failed' };
    }

    if (data.access_token) {
      // Set the token in an HttpOnly cookie
      cookies().set('access_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
      
      // Redirect to a dashboard or protected route
      redirect('/dashboard');
    }

    return { error: 'Unknown error occurred' };
  } catch (err) {
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err; // Next.js specific redirect error handling
    }
    return { error: 'Could not connect to authentication server' };
  }
}

export async function logout() {
  cookies().delete('access_token');
  redirect('/login');
}
