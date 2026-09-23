'use client';

import { useEffect, useState } from 'react';

import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';

/**
 * El comprobante y lo que la lectura encontró en él.
 *
 * Verificar un pago era entrar al banco, buscar el movimiento entre todos los
 * del día y cruzarlo de memoria con lo que el cliente había comprado. Acá
 * está el archivo y lo que se vio en él, para mirar una vez y decidir.
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

export function ComprobantePago({ leadId }: { leadId: string }) {
  const [datos, setDatos] = useState<Comprobante | null>(null);
  const [cargando, setCargando] = useState(true);

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
      marginBottom: 20, display: 'grid', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15 }} aria-hidden="true">🧾</span>
        <p style={{ fontSize: 13, fontWeight: 700, color, margin: 0 }}>
          {datos.veredicto ? TITULO[datos.veredicto] : 'Subió el comprobante'}
        </p>

        {datos.url && (
          <a
            href={datos.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...s.label, marginBottom: 0, marginLeft: 'auto', color: c.textSoft }}
          >
            Ver el comprobante ↗
          </a>
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
  );
}
