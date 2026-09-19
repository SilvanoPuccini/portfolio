'use client';

import { useEffect, useState } from 'react';
import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import { localAmount, type UsdRate } from '@/lib/leads/exchange-rate';

type RateRow = UsdRate | { currency: string; unavailable: true };
type FxResponse = { rates: RateRow[]; margin: number; roundStep: number; validHours: number };

const fmt = (n: number, digits = 0) => n.toLocaleString('es-AR', { maximumFractionDigits: digits });

/**
 * Cuánto se le cobra hoy en pesos a un cliente de Argentina o Chile por un
 * monto en USD. Usa las mismas reglas que el pedido de pago (localAmount),
 * así que lo que se ve acá es lo que va a decir el mail.
 */
export default function FxComparison() {
  const [data, setData] = useState<FxResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usd, setUsd] = useState(1000);

  useEffect(() => {
    fetch('/api/admin/fx')
      .then(async (res) => {
        if (!res.ok) { setError(`No se pudieron cargar las cotizaciones (${res.status}).`); return; }
        setData(await res.json() as FxResponse);
      })
      .catch(() => setError('Error de conexión.'));
  }, []);

  const cell = { padding: '8px 10px', borderBottom: `1px solid ${c.border}`, fontSize: 13, color: c.text, textAlign: 'left' as const };
  const head = { ...cell, ...s.label, marginBottom: 0 };

  return (
    <div style={{ ...s.card, maxWidth: 640, marginTop: 20 }}>
      <p style={s.sectionTitle}>Cotización para cobrar en pesos</p>

      <div style={{ marginBottom: 14, maxWidth: 200 }}>
        <label htmlFor="fx-usd" style={s.label}>Monto en USD</label>
        <input
          id="fx-usd"
          type="number"
          min={0}
          style={s.input}
          value={usd}
          onChange={(e) => setUsd(Number(e.target.value) || 0)}
        />
      </div>

      {error && <p style={s.errorText}>{error}</p>}
      {!data && !error && <p style={s.hint}>Cargando cotizaciones…</p>}

      {data && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={head}>Moneda</th>
                <th style={head}>Cotización</th>
                <th style={head}>Se cobra</th>
              </tr>
            </thead>
            <tbody>
              {data.rates.map((row) => (
                <tr key={row.currency}>
                  <td style={cell}>{row.currency}</td>
                  {'unavailable' in row ? (
                    <td style={{ ...cell, color: c.textDim }} colSpan={2}>
                      Sin cotización: el mail de pago sale solo en USD.
                    </td>
                  ) : (
                    <>
                      <td style={cell}>
                        {fmt(row.rate, 2)} <span style={{ color: c.textDim }}>· {row.source}</span>
                      </td>
                      <td style={{ ...cell, fontFamily: 'monospace', fontWeight: 700 }}>
                        {`${row.currency} ${fmt(localAmount(usd, row.rate))}`}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={s.hint}>
            Cotización + {Math.round(data.margin * 100)} %, redondeada para arriba a {fmt(data.roundStep)}.
            El monto del mail de pago vale {data.validHours} h.
          </p>
        </>
      )}
    </div>
  );
}
