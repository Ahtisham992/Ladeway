'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signup(formData: FormData) {
  const companyName = formData.get('companyName');
  const subdomain = formData.get('subdomain');
  const email = formData.get('email');
  const password = formData.get('password');

  if (!companyName || !subdomain || !email || !password) {
    return { error: 'All fields are required' };
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  try {
    const res = await fetch(`${baseUrl}/tenants/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyName, subdomain, email, password }),
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorData = await res.json();
      return { error: errorData.message || 'Signup failed' };
    }

    const data = await res.json();
    
    if (data.access_token) {
      cookies().set('access_token', data.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

  } catch (error: any) {
    console.error('Signup error:', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }

  // Redirect must be outside try-catch
  redirect('/dashboard/onboarding');
}
