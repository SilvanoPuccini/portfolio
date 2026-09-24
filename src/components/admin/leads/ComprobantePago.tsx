'use client';

import { useEffect, useRef, useState } from 'react';

import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';

/**
 * El comprobante y lo que la lectura encontró en él.
 *
 * Verificar un pago era entrar al banco, buscar el movimiento entre todos los
 * del día y cruzarlo de memoria con lo que el cliente había comprado. Acá
 * está el archivo y lo que se vio en él, para mirar una vez y decidir.
 *
 * El archivo se ve en miniatura y se abre en una vista previa sobre la ficha:
 * antes era un link que lo abría en otra pestaña, y mirar una captura
 * obligaba a salir de donde se decide.
 *
 * Lo que NO hace es aprobar. El veredicto es una señal de dónde mirar: un
 * sistema que aprueba pagos solo es un sistema que un día aprueba mal.
 */

interface Hallazgo {
  campo: string;
  senal: 'ok' | 'atencion' | 'mal';
  detalle: string;
}

interface Comprobante {
  nombre: string | null;
  subidoEl: string | null;
  url: string | null;
  clase?: 'imagen' | 'pdf';
  veredicto: 'cuadra' | 'revisar' | 'no-cuadra' | null;
  hallazgos: Hallazgo[];
}

const TITULO: Record<string, string> = {
  cuadra: 'El comprobante cuadra',
  revisar: 'El comprobante necesita una mirada',
  'no-cuadra': 'El comprobante no cuadra',
};

const COLOR: Record<string, string> = {
  cuadra: c.published,
  revisar: c.incomplete,
  'no-cuadra': c.late,
};

const MARCA: Record<Hallazgo['senal'], string> = { ok: '✓', atencion: '!', mal: '✕' };

function fechaCorta(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/** La vista previa, centrada sobre la ficha. Esc, la X o tocar afuera la cierran. */
function VistaPrevia({ datos, onClose }: { datos: Comprobante; onClose: () => void }) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    d.showModal();
    return () => { if (d.open) d.close(); };
  }, []);

  return (
    <dialog
      ref={dialogo}
      aria-label="Vista previa del comprobante"
      onClose={onClose}
      // Tocar el fondo cierra: el click en el fondo llega al propio <dialog>.
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      style={{
        padding: 0, border: `1px solid ${c.border}`, borderRadius: 14, background: c.surface,
        width: 'min(920px, 92vw)', maxHeight: '90vh', color: c.text, overflow: 'hidden',
      }}
    >
      <style>{'dialog::backdrop{background:rgba(3,6,14,.78);backdrop-filter:blur(3px)}'}</style>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
        borderBottom: `1px solid ${c.borderSoft}`,
      }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {datos.nombre ?? 'Comprobante'}
        </p>
        <span style={{ fontSize: 12, color: c.textDim }}>{fechaCorta(datos.subidoEl)}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar la vista previa"
          autoFocus
          style={{
            marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${c.border}`, background: 'transparent', color: c.text, fontSize: 18, lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ background: c.page, display: 'grid', placeItems: 'center', maxHeight: 'calc(90vh - 58px)', overflow: 'auto' }}>
        {datos.clase === 'pdf' ? (
          <iframe
            src={datos.url ?? undefined}
            title="Comprobante en PDF"
            style={{ width: '100%', height: '78vh', border: 0, background: '#fff' }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- archivo privado, servido con sesión de admin
          <img
            src={datos.url ?? undefined}
            alt="Comprobante de pago"
            style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(90vh - 58px)', objectFit: 'contain' }}
          />
        )}
      </div>
    </dialog>
  );
}

export function ComprobantePago({ leadId }: { leadId: string }) {
  const [datos, setDatos] = useState<Comprobante | null>(null);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    let vivo = true;

    fetch(`/api/admin/leads/${leadId}/comprobante`)
      .then((r) => r.json() as Promise<{ comprobante: Comprobante | null }>)
      .then((body) => { if (vivo) setDatos(body.comprobante); })
      .catch(() => undefined)
      .finally(() => { if (vivo) setCargando(false); });

    return () => { vivo = false; };
  }, [leadId]);

  if (cargando || !datos) return null;

  const color = datos.veredicto ? COLOR[datos.veredicto] : c.textDim;

  return (
    <div style={{
      border: `1px solid ${color}`, borderRadius: 10, padding: '12px 16px',
      marginBottom: 20, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap',
    }}>
      {datos.url && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Ver el comprobante"
          title="Ver el comprobante"
          style={{
            width: 96, height: 120, flexShrink: 0, padding: 0, cursor: 'zoom-in', overflow: 'hidden',
            borderRadius: 8, border: `1px solid ${c.border}`, background: c.page,
            display: 'grid', placeItems: 'center',
          }}
        >
          {datos.clase === 'pdf' ? (
            <span style={{ display: 'grid', gap: 4, justifyItems: 'center', color: c.textSoft }}>
              <span style={{ fontSize: 30 }} aria-hidden="true">📄</span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>PDF</span>
            </span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- archivo privado, servido con sesión de admin
            <img src={datos.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </button>
      )}

      <div style={{ display: 'grid', gap: 8, flex: '1 1 260px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15 }} aria-hidden="true">🧾</span>
          <p style={{ fontSize: 13, fontWeight: 700, color, margin: 0 }}>
            {datos.veredicto ? TITULO[datos.veredicto] : 'Subió el comprobante'}
          </p>
          {datos.url && (
            <button
              type="button"
              onClick={() => setAbierto(true)}
              style={{
                ...s.label, marginBottom: 0, marginLeft: 'auto', color: c.textSoft,
                background: 'none', border: 0, cursor: 'pointer', padding: 0,
              }}
            >
              Ampliar ⤢
            </button>
          )}
        </div>

        {datos.hallazgos.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 3 }}>
            {datos.hallazgos.map((h) => (
              <li
                key={h.campo}
                style={{
                  fontSize: 12.5, lineHeight: 1.55,
                  color: h.senal === 'ok' ? c.textSoft : h.senal === 'atencion' ? c.incomplete : c.late,
                }}
              >
                {MARCA[h.senal]} {h.detalle}
              </li>
            ))}
          </ul>
        )}

        <p style={{ ...s.hint, margin: 0 }}>
          Esto no aprueba el pago: confirmalo vos después de mirarlo.
        </p>
      </div>

      {abierto && <VistaPrevia datos={datos} onClose={() => setAbierto(false)} />}
    </div>
  );
}
