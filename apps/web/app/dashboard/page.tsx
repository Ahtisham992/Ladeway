import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { logout } from '../login/actions';

export default function DashboardPage() {
  const token = cookies().get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto mt-10 p-6 bg-gray-800 rounded-lg shadow-xl">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <form action={logout}>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              Sign out
            </button>
          </form>
        </div>
        <p className="text-gray-300">You are successfully authenticated!</p>
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-200 mb-2">Your Token:</h2>
          <pre className="bg-gray-950 p-4 rounded-lg overflow-x-auto text-xs text-gray-400 border border-gray-700 shadow-inner">
            {token}
          </pre>
        </div>
      </div>
    </div>
  );
}
