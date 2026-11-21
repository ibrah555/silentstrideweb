import Image from 'next/image';

export default function Login({ searchParams }) {
  const error = searchParams?.error;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <div className="panel" style={{ width: 380, textAlign: 'center' }}>
        <Image src="/logo.jpg" alt="Silent Strides Network" width={72} height={72}
          style={{ borderRadius: 14, margin: '0 auto 14px', display: 'block' }} />
        <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Silent Strides Network</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--muted)' }}>Command Center & Sales Agent Portal</p>
        
        {error && (
          <div style={{
            background: '#FEE2E2',
            color: '#B91C1C',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 13,
            marginBottom: 14,
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        <form action="/auth/sign-in" method="post" style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
          <label className="f">Email address
            <input name="email" type="email" required placeholder="name@silentstrides.com" />
          </label>
          <label className="f">Password
            <input name="password" type="password" required />
          </label>
          <button className="btn gold" type="submit" style={{ justifyContent: 'center', marginTop: 6 }}>Sign in</button>
        </form>
      </div>
    </div>
  );
}
