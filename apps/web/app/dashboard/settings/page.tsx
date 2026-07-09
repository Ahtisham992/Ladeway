export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

async function getTenantInfo(token: string) {
 const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
 try {
 const res = await fetch(`${baseUrl}/tenants/me`, {
 headers: { Authorization: `Bearer ${token}` },
 cache: 'no-store'
 });
 if (!res.ok) return null;
 return await res.json();
 } catch (e) {
 return null;
 }
}

export default async function SettingsPage() {
 const token = cookies().get('access_token')?.value;
 if (!token) redirect('/login');

 const tenant = await getTenantInfo(token);
 if (!tenant) redirect('/login');

 return (
 <div className="max-w-4xl space-y-8 animate-fade-in-up">
 <div>
 <h1 className="text-3xl font-bold text-primary tracking-tight">Settings</h1>
 <p className="text-secondary mt-2">Manage your workspace configuration.</p>
 </div>

 <Card>
 <CardHeader>
 <CardTitle>Workspace Profile</CardTitle>
 </CardHeader>
 <CardContent className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Company Name</label>
 <input 
 type="text" 
 value={tenant.name} 
 disabled 
 className="w-full px-4 py-2 border border-border bg-background rounded-lg text-secondary cursor-not-allowed"
 />
 </div>
 <div>
 <label className="block text-sm font-medium text-primary mb-1">Subdomain</label>
 <div className="flex rounded-lg shadow-sm">
 <input 
 type="text" 
 value={tenant.subdomain} 
 disabled 
 className="flex-1 min-w-0 px-4 py-2 border border-r-0 border-border bg-background rounded-l-lg text-secondary cursor-not-allowed"
 />
 <span className="inline-flex items-center px-4 rounded-r-lg border border-border bg-surface-alt text-secondary text-sm">
 .ladeway.com
 </span>
 </div>
 </div>
 </div>

 <div className="pt-4 border-t border-border ">
 <div>
 <label className="block text-sm font-medium text-primary mb-1">API Key</label>
 <div className="flex rounded-lg shadow-sm">
 <input 
 type="password" 
 value={tenant.apiKey} 
 disabled 
 className="font-mono flex-1 min-w-0 px-4 py-2 border border-border bg-background rounded-lg text-secondary cursor-not-allowed tracking-widest"
 />
 </div>
 <p className="text-xs text-secondary mt-2">
 Your API key is used to securely authenticate your widget on your website. Do not share it publicly.
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
