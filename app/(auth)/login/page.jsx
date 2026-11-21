import Image from 'next/image';

export default function Login() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="panel" style={{ width: 360, textAlign: 'center' }}>
        <Image src="/logo.jpg" alt="Silent Strides Network" width={72} height={72}
          style={{ borderRadius: 14, margin: '0 auto 14px', display: 'block' }} />
        <h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Silent Strides Network</h2>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--muted)' }}>Sign in to the command center</p>
        <form action="/auth/sign-in" method="post" style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
          <label className="f">Email
            <input name="email" type="email" required placeholder="director@silentstrides.com" />
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
