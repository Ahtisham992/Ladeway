import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '../../../components/admin/OnboardingWizard';

async function getDefaultConfig(token: string) {
 const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
 const res = await fetch(`${baseUrl}/industry-configs`, {
 headers: { Authorization: `Bearer ${token}` },
 cache: 'no-store'
 });

 if (!res.ok) {
 throw new Error('Failed to fetch configs');
 }

 const configs = await res.json();
 return configs[0]; // the default one created at signup
}

export default async function OnboardingPage() {
 const token = cookies().get('access_token')?.value;
 if (!token) redirect('/login');

 const config = await getDefaultConfig(token);
 if (!config) redirect('/dashboard/overview');

 return (
 <div className="max-w-4xl mx-auto py-12">
 <div className="mb-10 text-center">
 <h1 className="text-3xl font-bold text-primary ">Welcome to Ladeway</h1>
 <p className="text-secondary mt-2 text-lg">
 We've set you up with a <strong>Logistics template</strong> — customise it to match your business.
 </p>
 </div>

 <OnboardingWizard initialConfig={config} token={token} />
 </div>
 );
}
