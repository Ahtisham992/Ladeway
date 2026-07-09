import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LeadDetailPanel } from '../../../../components/admin/LeadDetailPanel';

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
 const token = cookies().get('access_token')?.value;

 if (!token) {
 redirect('/login');
 }

 const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/${params.id}`, {
 headers: {
 Authorization: `Bearer ${token}`
 },
 // Don't cache this aggressively, we want fresh data when the rep clicks it
 cache: 'no-store'
 });

 if (!res.ok) {
 if (res.status === 404) {
 return <div className="p-8 text-secondary">Lead not found.</div>;
 }
 return <div className="p-8 text-error">Failed to load lead data.</div>;
 }

 const lead = await res.json();

 return (
 <div className="max-w-7xl mx-auto space-y-4">
 <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary :text-white transition-colors">
 <ArrowLeft size={16} />
 Back to Leads
 </Link>
 <LeadDetailPanel lead={lead} token={token} />
 </div>
 );
}
