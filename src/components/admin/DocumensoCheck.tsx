'use client';

import { useState } from 'react';
import { CheckCircle2, CircleAlert, CircleDashed } from 'lucide-react';

import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';

/**
 * ¿El contrato está listo para firmarse?
 *
 * Comprueba de una sola vez las tres cosas que fallan en silencio: las
 * variables cargadas, que la plantilla se pueda leer, y que tenga los nueve
 * campos con el nombre correcto. El token nunca llega hasta acá: el servidor
 * responde si está o no, no su contenido.
 */

interface Resultado {
  variables: Record<string, boolean>;
  esperados: string[];
  ruta: string | null;
  tablaPedidos: boolean;
  encontrados: string[];
  faltan: string[];
  firmantes: number;
  listo: boolean;
  problema?: string;
}

const VERDE = { fondo: 'rgba(74,222,128,0.06)', borde: 'rgba(74,222,128,0.2)' };
const ROJO = { fondo: 'rgba(248,113,113,0.06)', borde: 'rgba(248,113,113,0.2)' };

function Linea({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const tono = ok ? VERDE : ROJO;
  const Icono = ok ? CheckCircle2 : CircleAlert;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 8,
      background: tono.fondo, border: `1px solid ${tono.borde}`,
    }}>
      <Icono size={15} color={ok ? '#4ade80' : '#f87171'} aria-hidden="true" />
      <span style={{ fontSize: 12.5, color: '#e2e8f0' }}>{children}</span>
    </div>
  );
}

export function DocumensoCheck() {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [prueba, setPrueba] = useState<{ ok: boolean; signingUrl?: string; error?: string } | null>(null);
  const [probando, setProbando] = useState(false);

  async function comprobar() {
    setCargando(true);
    setError('');
    setResultado(null);
    try {
      const res = await fetch('/api/admin/documenso-check');
      if (!res.ok) {
        setError(`No se pudo comprobar (${res.status}). Probá volver a iniciar sesión.`);
        return;
      }
      setResultado(await res.json() as Resultado);
    } catch {
      setError('Se cortó la conexión.');
    } finally {
      setCargando(false);
    }
  }

  /** Crea un contrato real de prueba y muestra el error exacto si falla. */
  async function probar() {
    setProbando(true);
    setPrueba(null);
    try {
      const res = await fetch('/api/admin/documenso-check', { method: 'POST' });
      setPrueba(await res.json() as { ok: boolean; signingUrl?: string; error?: string });
    } catch {
      setPrueba({ ok: false, error: 'Se cortó la conexión.' });
    } finally {
      setProbando(false);
    }
  }

  return (
    <div style={{ ...s.card, maxWidth: 520, marginTop: 20 }}>
      <p style={s.eyebrow}>Contratos</p>
      <h2 style={{ ...s.heading, fontSize: 17, margin: '4px 0 10px' }}>
        ¿La plantilla está lista para firmar?
      </h2>
      <p style={{ fontSize: 13, color: c.textDim, marginBottom: 18, lineHeight: 1.6 }}>
        Comprueba que las variables estén cargadas, que la plantilla de Documenso se pueda
        leer con ese id, y que tenga los nueve campos con el nombre correcto. El token no
        sale del servidor.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <button onClick={comprobar} disabled={cargando} style={{ ...s.btn, opacity: cargando ? 0.6 : 1 }}>
          {cargando ? 'Comprobando…' : 'Comprobar la plantilla'}
        </button>
        <button onClick={probar} disabled={probando} style={{ ...s.btnGhost, opacity: probando ? 0.6 : 1 }}>
          {probando ? 'Creando…' : 'Crear un contrato de prueba'}
        </button>
      </div>

      {prueba && (
        <div style={{
          marginTop: 14, padding: '12px 14px', borderRadius: 8,
          background: prueba.ok ? VERDE.fondo : ROJO.fondo,
          border: `1px solid ${prueba.ok ? VERDE.borde : ROJO.borde}`,
        }}>
          {prueba.ok ? (
            <>
              <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0 }}>
                Documenso creó el contrato. Se firma acá:
              </p>
              <a href={prueba.signingUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#00d4d4', wordBreak: 'break-all' }}>
                {prueba.signingUrl}
              </a>
              <p style={{ fontSize: 11.5, color: c.textDim, margin: '8px 0 0', lineHeight: 1.6 }}>
                Es un documento de prueba con datos falsos. Borralo desde Documenso cuando lo revises.
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: '#e2e8f0', margin: '0 0 6px' }}>
                Documenso rechazó la llamada. Esto es lo que dijo:
              </p>
              <code style={{ fontSize: 11.5, color: '#fca5a5', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {prueba.error}
              </code>
            </>
          )}
        </div>
      )}

      {error && <p style={{ ...s.errorText, marginTop: 14 }}>{error}</p>}

      {resultado && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(resultado.variables).map(([nombre, cargada]) => (
            <Linea key={nombre} ok={cargada}>
              <code style={{ fontFamily: 'monospace' }}>{nombre}</code>
              {cargada ? ' cargada' : ' falta cargarla en Vercel'}
            </Linea>
          ))}

          <Linea ok={resultado.tablaPedidos}>
            {resultado.tablaPedidos
              ? 'La tabla de pedidos existe'
              : 'Falta correr la migración 038_pedidos.sql en Supabase'}
          </Linea>

          <Linea ok={Boolean(resultado.ruta)}>
            {resultado.ruta
              ? `La plantilla se lee desde ${resultado.ruta.replace('https://app.documenso.com', '')}`
              : 'No se pudo leer la plantilla'}
          </Linea>

          {resultado.ruta && (
            <>
              <Linea ok={resultado.faltan.length === 0}>
                {resultado.faltan.length === 0
                  ? `Los ${resultado.esperados.length} campos están, con el nombre correcto`
                  : `Faltan estos campos: ${resultado.faltan.join(', ')}`}
              </Linea>
              <Linea ok={resultado.firmantes >= 2}>
                {resultado.firmantes >= 2
                  ? 'Lo firman las dos partes: el cliente y vos'
                  : resultado.firmantes === 1
                    ? 'Solo firma una parte: falta tu firma en la plantilla'
                    : 'La plantilla no tiene quién firme'}
              </Linea>
            </>
          )}

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 6,
            padding: '12px 14px', borderRadius: 8,
            background: resultado.listo ? VERDE.fondo : 'rgba(148,163,184,0.05)',
            border: `1px solid ${resultado.listo ? VERDE.borde : 'rgba(148,163,184,0.15)'}`,
          }}>
            {resultado.listo
              ? <CheckCircle2 size={16} color="#4ade80" aria-hidden="true" />
              : <CircleDashed size={16} color={c.textDim} aria-hidden="true" />}
            <span style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>
              {resultado.listo
                ? 'Todo listo: un cliente que acepte la propuesta va a poder firmar en la página.'
                : resultado.problema ?? 'Todavía falta algo para poder firmar.'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
