import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ConfigEditor } from '../../../../components/admin/ConfigEditor';

export default async function EditConfigPage({ params }: { params: { id: string } }) {
  const token = cookies().get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/industry-configs/${params.id}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store'
  });

  if (!res.ok) {
    return <div className="p-8 text-red-500 text-center">Configuration not found or failed to load.</div>;
  }

  const config = await res.json();

  return (
    <div className="max-w-5xl mx-auto">
      <ConfigEditor token={token} initialConfig={config} />
    </div>
  );
}
