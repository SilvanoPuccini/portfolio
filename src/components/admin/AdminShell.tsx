'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { c } from '@/components/admin/tokens';

/**
 * El menú agrupado por etapa del negocio, no por tabla de la base.
 *
 * La plata recorre siempre el mismo camino —atraés, vendés, entregás— y el
 * menú lo sigue en ese orden. Así una sección nueva no necesita que nadie
 * decida dónde va: "Facturación" entra en Vender y se acabó la discusión.
 *
 * Las etiquetas nombran la herramienta, no la tabla: "Calendario" porque es
 * una grilla de mes, "Contenido LinkedIn" porque eso es lo que edita, y
 * "Lecturas" porque mide lectura del blog y no un concepto de métrica.
 */
const NAV_GROUPS: { label: string | null; items: { href: string; label: string }[] }[] = [
  {
    label: null,
    items: [{ href: '/admin', label: 'Dashboard' }],
  },
  {
    label: 'Atraer',
    items: [
      { href: '/admin/agenda', label: 'Calendario' },
      { href: '/admin/content', label: 'Contenido LinkedIn' },
      { href: '/admin/x', label: 'Hilos X' },
      { href: '/admin/newsletter', label: 'Newsletter' },
      { href: '/admin/subscribers', label: 'Suscriptores' },
    ],
  },
  {
    label: 'Vender',
    items: [
      { href: '/admin/leads', label: 'Leads' },
      { href: '/admin/messages', label: 'Mensajes' },
    ],
  },
  {
    label: 'Medir',
    items: [{ href: '/admin/engagement', label: 'Lecturas' }],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/config', label: 'Config' },
      { href: '/admin/debug', label: 'Debug IA' },
    ],
  },
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
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[228px_1fr]" style={{ background: c.page }}>
      {/*
        El menú vive al costado, no arriba. Once enlaces en una fila no dejaban
        distinguir qué pesa más; en columna cada grupo se lee como lo que es,
        una etapa del negocio. Bajo el breakpoint md la grilla colapsa y el menú
        pasa a ser una banda superior que se desplaza sola.
      */}
      <nav aria-label="Secciones del panel"
        className="flex flex-col border-b md:border-b-0 md:border-r md:sticky md:top-0 md:h-screen"
        style={{ background: c.chrome, borderColor: c.border }}>
        <div style={s.railBrand}>
          <span style={s.navBrand}>El Radar</span>
          <span style={{ color: c.border, fontSize: 14 }}>·</span>
          <span style={{ color: c.textDim, fontSize: 12, fontFamily: 'monospace' }}>admin</span>
          {/* En pantalla angosta el rail no tiene pie: la salida va acá. */}
          <button onClick={() => setShowLogoutModal(true)}
            className="md:hidden"
            style={{ ...s.railLogout, marginLeft: 'auto', padding: '4px 8px' }}>Salir</button>
        </div>

        <div className="flex flex-row gap-3 overflow-x-auto px-2 py-2 md:flex-1 md:flex-col md:gap-0 md:overflow-x-visible md:overflow-y-auto md:px-2 md:py-3">
          {NAV_GROUPS.map((group, index) => (
            <div key={group.label ?? `grupo-${index}`}
              className="flex flex-row items-center gap-1 md:mb-3 md:flex-col md:items-stretch md:gap-px">
              {group.label && <span className="hidden md:block" style={s.railLabel}>{group.label}</span>}
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      ...s.navLink,
                      display: 'block',
                      whiteSpace: 'nowrap',
                      color: active ? c.ready : c.text,
                      background: active ? 'rgba(0,212,212,0.08)' : 'transparent',
                      fontWeight: active ? 600 : 500,
                    }}>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <button onClick={() => setShowLogoutModal(true)}
          className="hidden md:block"
          style={s.railLogout}>Salir</button>
      </nav>

      {/* Content */}
      <main className="min-w-0 px-5 py-6 md:px-8 md:py-7">
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          {children}
        </div>
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

/**
 * Los estilos compartidos del admin, derivados de la capa semántica.
 *
 * Antes cada valor era un hex escrito a mano acá, y la paleta medida de
 * `tokens.ts` solo se aplicaba en agenda y en hilos de X. Eso dejaba dos
 * sistemas conviviendo: las pantallas viejas no heredaban ninguna corrección.
 * Ahora `s` no inventa colores, los pide.
 *
 * Tres valores cambiaron de tono al migrar, y no por gusto: `btnGhost`,
 * `navLink` inactivo y `navLogout` pintaban texto con #64748b (3.73:1) y
 * #334155 (2.34:1), los dos por debajo del 4.5:1 que WCAG pide para texto
 * chico. Pasan a `textDim` (6.29:1). Los grises oscuros siguen disponibles
 * en `c.hairline`, pero solo para bordes y puntos.
 */
export const s: Record<string, React.CSSProperties> = {
  center: { minHeight: '100vh', background: c.page, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12, padding: 28, width: '100%' },
  eyebrow: { fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: c.ready, margin: '0 0 4px' },
  heading: { fontSize: 20, fontWeight: 700, color: '#ffffff', margin: 0 },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: c.text, margin: '4px 0 18px' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  label: { display: 'block', fontSize: 11, color: c.textDim, marginBottom: 5, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase' as const },
  input: { background: c.field, border: `1px solid ${c.border}`, borderRadius: 8, padding: '10px 14px', color: c.text, fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'inherit' },
  btn: { background: c.ready, color: c.page, border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' },
  btnGhost: { background: 'transparent', color: c.textDim, border: `1px solid ${c.border}`, borderRadius: 8, padding: '8px 16px', fontWeight: 500, fontSize: 12, cursor: 'pointer' },
  successText: { color: c.published, fontSize: 13, margin: 0 },
  errorText: { color: c.late, fontSize: 13, margin: 0 },
  hint: { fontSize: 12, color: c.textDim, marginTop: 4 },
  divider: { height: 1, background: c.border, margin: '8px 0' },
  navBrand: { fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: c.ready, letterSpacing: '0.12em' },
  navLink: { fontSize: 12.5, textDecoration: 'none', padding: '6px 10px', borderRadius: 6, transition: 'all 0.15s', fontWeight: 500 },

  // ── El rail lateral ───────────────────────────────────────────────────
  railBrand: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '14px 16px', borderBottom: `1px solid ${c.border}`,
    flexShrink: 0,
  },
  /** Nombre de la etapa del negocio. No es un enlace: es el rótulo del grupo. */
  railLabel: {
    fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '0.19em',
    textTransform: 'uppercase' as const, color: c.hairline,
    padding: '0 10px', marginBottom: 5,
  },
  railLogout: {
    background: 'none', border: 0, color: c.textDim, fontSize: 11,
    cursor: 'pointer', padding: '12px 18px', textAlign: 'left' as const,
    borderTop: `1px solid ${c.border}`, fontFamily: 'inherit', flexShrink: 0,
  },
};
