import { redirect } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/auth';

export default async function Home() {
  const auth = await getCurrentUserRole();
  if (!auth) {
    redirect('/login');
  }

  if (auth.role === 'agent') {
    redirect('/portal');
  }

  redirect('/dashboard');
}
