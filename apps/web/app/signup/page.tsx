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
      className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ${
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl shadow-xl flex items-center justify-center transform rotate-12 hover:rotate-0 transition-transform duration-300">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Start your Ladeway journey
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Deploy your first AI agent in minutes
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-700/50 backdrop-blur-xl">
          <form className="space-y-6" action={clientAction}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 animate-shake">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-400">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-300">
                Company Name
              </label>
              <div className="mt-1">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subdomain" className="block text-sm font-medium text-gray-300">
                Workspace Subdomain
              </label>
              <div className="mt-1 flex rounded-lg shadow-sm">
                <input
                  id="subdomain"
                  name="subdomain"
                  type="text"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-l-lg placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="acme"
                />
                <span className="inline-flex items-center px-4 rounded-r-lg border border-l-0 border-gray-600 bg-gray-800 text-gray-400 text-sm">
                  .ladeway.com
                </span>
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Admin Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="admin@acme.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <SubmitButton />
            </div>
            
            <div className="text-center mt-4 text-sm text-gray-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                Sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
