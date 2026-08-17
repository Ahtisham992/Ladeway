'use client';

import { useState } from 'react';
import { signup } from './actions';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/20 transition-all duration-200 ${
        pending ? 'opacity-75 cursor-not-allowed' : ''
      }`}
    >
      {pending ? (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {pending ? 'Creating account...' : 'Create account'}
    </button>
  );
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);

  async function clientAction(formData: FormData) {
    setError(null);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <Link href="/" className="w-72 h-20 overflow-hidden flex items-center justify-center rounded-xl bg-white shadow-sm border border-border hover:opacity-90 hover:shadow-md transition-all cursor-pointer">
            <img src="/logo.png" alt="Ladeway Logo" className="w-[120%] h-auto object-cover" />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-primary tracking-tight">
          Start your Ladeway journey
        </h2>
        <p className="mt-2 text-center text-sm text-secondary">
          Deploy your first AI agent in minutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-border">
          <form className="space-y-6" action={clientAction}>
            {error && (
              <div className="bg-error/10 border border-error/20 rounded-lg p-4 animate-shake">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-error">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-secondary">
                Company Name
              </label>
              <div className="mt-1">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-white border border-border rounded-lg shadow-sm placeholder-secondary-light text-gray-900 focus:outline-none focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-secondary">
                Workspace Subdomain
              </label>
              <div className="mt-1 flex rounded-lg shadow-sm">
                <input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-white border border-border rounded-l-lg placeholder-secondary-light text-gray-900 focus:outline-none focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="acme"
                />
                <span className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-border bg-surface text-secondary text-sm">
                  .ladeway.com
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-secondary">
                Admin Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-white border border-border rounded-lg shadow-sm placeholder-secondary-light text-gray-900 focus:outline-none focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="admin@acme.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-white border border-border rounded-lg shadow-sm placeholder-secondary-light text-gray-900 focus:outline-none focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <SubmitButton />
            </div>
            
            <div className="text-center mt-4 text-sm text-secondary">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
