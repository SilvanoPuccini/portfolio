'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/subscribers', label: 'Suscriptores' },
  { href: '/admin/messages', label: 'Mensajes' },
  { href: '/admin/content', label: 'Contenido' },
  { href: '/admin/agenda', label: 'Agenda' },
  { href: '/admin/distribuciones', label: 'Distribuciones' },
  { href: '/admin/engagement', label: 'Engagement' },
  { href: '/admin/debug', label: 'Debug IA' },
  { href: '/admin/config', label: 'Config' },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verificar sesión server-side al montar
  useEffect(() => {
    fetch('/api/admin/session')
      .then((res) => {
        setAuthed(res.ok);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json() as { error?: string };
      if (res.ok) {
        setAuthed(true);
      } else {
        setError(data.error ?? 'Error al ingresar.');
      }
    } catch {
      setError('Error de conexión.');
    } finally {
      setLoading(false);
    }
  }

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
    setPassword('');
    setShowLogoutModal(false);
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
            <button type="submit" style={s.btn} disabled={loading}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
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
            <button onClick={() => setShowLogoutModal(true)} style={s.navLogout}>Salir</button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 920, margin: '0 auto', padding: '28px 24px' }}>
        {children}
      </main>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(10, 10, 20, 0.85)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            style={{ ...s.card, maxWidth: 380, textAlign: 'center' as const }}
            onClick={(e) => e.stopPropagation()}
          >
            <p style={{ ...s.eyebrow, marginBottom: 8 }}>Confirmar</p>
            <h2 style={{ ...s.heading, fontSize: 18, marginBottom: 8 }}>Cerrar sesión</h2>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 24px' }}>
              ¿Estás seguro de que querés cerrar la sesión?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowLogoutModal(false)} style={s.btnGhost}>
                Cancelar
              </button>
              <button onClick={handleLogout} style={s.btn}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
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
