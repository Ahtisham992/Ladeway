import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ConfigListTable } from '../../../components/admin/ConfigListTable';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function ConfigsPage() {
 const token = cookies().get('access_token')?.value;

 if (!token) {
 redirect('/login');
 }

 return (
 <div className="max-w-7xl mx-auto space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h1 className="text-2xl font-bold text-primary ">AI Configurations</h1>
 <p className="text-secondary mt-1">Manage your industry-specific AI qualification agents.</p>
 </div>
 <Link 
 href="/dashboard/configs/new"
 className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
 >
 <Plus size={16} />
 New Configuration
 </Link>
 </div>

 <ConfigListTable token={token} />
 </div>
 );
}
