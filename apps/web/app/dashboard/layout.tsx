import { ReactNode } from 'react';
import { Sidebar } from '../../components/admin/Sidebar';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const token = cookies().get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
