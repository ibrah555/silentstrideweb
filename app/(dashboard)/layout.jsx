import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getCurrentUserRole } from '@/lib/auth';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '◆' },
  { href: '/subsidiaries', label: 'Subsidiaries', icon: '▣' },
  { href: '/equity', label: 'Directors & equity', icon: '◈' },
  { href: '/ledger', label: 'Ledger', icon: '≣' },
  { href: '/sales', label: 'Sales', icon: '✦' },
  { href: '/agents', label: 'Agents & payouts', icon: '☰' },
  { href: '/inventory', label: 'Inventory', icon: '▤' },
  { href: '/expenses', label: 'Expenses', icon: '−' },
  { href: '/setup', label: 'Setup', icon: '⚙' },
];

export default async function DashboardLayout({ children }) {
  const auth = await getCurrentUserRole();
  if (auth && auth.role === 'agent') {
    redirect('/portal');
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Image src="/logo.jpg" alt="Silent Strides Network" width={34} height={34} />
          <div className="t">Silent Strides<small>NETWORK LTD</small></div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="navlink">
              <span style={{ width: 16, textAlign: 'center', color: 'inherit' }}>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--gold)', marginBottom: 8, padding: '0 8px' }}>
            Director: <b>{auth?.profile?.full_name || auth?.user?.email}</b>
          </div>
          <form action="/auth/sign-out" method="post">
            <button className="navlink" type="submit" style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              <span style={{ width: 16, textAlign: 'center' }}>⎋</span>
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
