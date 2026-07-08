import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LeadPipeline } from '../../components/admin/LeadPipeline';

export default function DashboardPage() {
  const token = cookies().get('access_token')?.value;

  // The layout.tsx already handles the redirect if no token, 
  // but we still need it here to pass to the client component.
  if (!token) {
    redirect('/login');
  }

  return (
    <div className="max-w-7xl mx-auto">
      <LeadPipeline token={token} />
    </div>
  );
}
