'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
const SESSION_KEY = 'admin_authed';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/subscribers', label: 'Suscriptores' },
  { href: '/admin/messages', label: 'Mensajes' },
  { href: '/admin/content', label: 'Contenido' },
  { href: '/admin/distribuciones', label: 'Distribuciones' },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setAuthed(sessionStorage.getItem(SESSION_KEY) === 'true');
    setReady(true);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAuthed(true);
    } else {
      setError('Contraseña incorrecta.');
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setPassword('');
  }

  if (!ready) return null;

  if (!authed) {
    return (
      <div style={s.center}>
        <div style={{ ...s.card, maxWidth: 360 }}>
          <p style={s.eyebrow}>El Radar</p>
          <h1 style={{ ...s.heading, marginBottom: 20 }}>Panel Admin</h1>
          <form onSubmit={handleLogin} style={s.form}>
            <input type="password" placeholder="Contraseña" value={password}
              onChange={(e) => setPassword(e.target.value)} style={s.input} autoFocus />
            {error && <p style={s.errorText}>{error}</p>}
            <button type="submit" style={s.btn}>Ingresar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a14' }}>
      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={s.navBrand}>El Radar</span>
            <span style={{ color: '#1e293b', fontSize: 14 }}>·</span>
            <span style={{ color: '#475569', fontSize: 12, fontFamily: 'monospace' }}>admin</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}
                style={{
                  ...s.navLink,
                  color: pathname === item.href ? '#00d4d4' : '#64748b',
                  background: pathname === item.href ? 'rgba(0,212,212,0.06)' : 'transparent',
                }}>
                {item.label}
              </Link>
            ))}
            <button onClick={handleLogout} style={s.navLogout}>Salir</button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '28px 24px' }}>
        {children}
      </main>
    </div>
  );
}

export const s: Record<string, React.CSSProperties> = {
  center: { minHeight: '100vh', background: '#0a0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: 28, width: '100%' },
  eyebrow: { fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#00d4d4', margin: '0 0 4px' },
  heading: { fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: '4px 0 18px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  label: { display: 'block', fontSize: 11, color: '#475569', marginBottom: 5, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' as const },
  input: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  btn: { background: '#00d4d4', color: '#0a0a14', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  btnGhost: { background: 'transparent', color: '#64748b', border: '1px solid #1e293b', borderRadius: 8, padding: '8px 16px', fontWeight: 500, fontSize: 12, cursor: 'pointer' },
  successText: { color: '#4ade80', fontSize: 13, margin: 0 },
  errorText: { color: '#f87171', fontSize: 13, margin: 0 },
  hint: { fontSize: 12, color: '#475569', marginTop: 4 },
  divider: { height: 1, background: '#1e293b', margin: '8px 0' },
  nav: { background: '#0d1117', borderBottom: '1px solid #1e293b', position: 'sticky' as const, top: 0, zIndex: 50 },
  navInner: { maxWidth: 920, margin: '0 auto', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navBrand: { fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#00d4d4', letterSpacing: '0.12em' },
  navLink: { fontSize: 12, textDecoration: 'none', padding: '5px 10px', borderRadius: 6, transition: 'all 0.15s', fontWeight: 500 },
  navLogout: { background: 'none', border: 'none', color: '#334155', fontSize: 11, cursor: 'pointer', padding: '5px 8px', marginLeft: 4 },
};
