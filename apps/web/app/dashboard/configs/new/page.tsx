import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ConfigEditor } from '../../../../components/admin/ConfigEditor';

export default async function NewConfigPage() {
  const token = cookies().get('access_token')?.value;

  if (!token) {
    redirect('/login');
  }

  return (
    <div className="max-w-5xl mx-auto">
      <ConfigEditor token={token} initialConfig={null} />
    </div>
  );
}
