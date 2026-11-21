import Link from 'next/link';
import Image from 'next/image';

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

export default function DashboardLayout({ children }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          {/* Original logo, unmodified */}
          <Image src="/logo.jpg" alt="Silent Strides Network" width={34} height={34} />
          <div className="t">Silent Strides<small>NETWORK LTD</small></div>
        </div>
        {NAV.map(n => (
          <Link key={n.href} href={n.href} className="navlink">
            <span style={{ width: 16, textAlign: 'center', color: 'inherit' }}>{n.icon}</span>
            <span>{n.label}</span>
          </Link>
        ))}
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
