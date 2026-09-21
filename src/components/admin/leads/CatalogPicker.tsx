'use client';

import { s } from '@/components/admin/AdminShell';
import { c } from '@/components/admin/tokens';
import { SERVICIOS, paquetePorSlug, servicioPorSlug } from '@/content/servicios';

/**
 * Lo que el cliente eligió del catálogo.
 *
 * Es la primera capa del presupuesto y la que resuelve el caso normal: un
 * paquete con precio cerrado y sus extras. Recién cuando algo no entra en el
 * catálogo hace falta bajar a estimar horas.
 */
export function CatalogPicker(props: {
  paqueteSlug: string | null;
  extrasIds: string[];
  onPaquete: (slug: string | null) => void;
  onExtra: (id: string, elegido: boolean) => void;
}) {
  const { paqueteSlug, extrasIds, onPaquete, onExtra } = props;

  const paquete = paquetePorSlug(paqueteSlug);
  const servicio = paquete ? servicioPorSlug(paquete.servicio) : null;
  const extras = servicio?.extras ?? [];

  const precioDe = (precio: number | null, desde?: number, recurrente?: 'mes') => {
    if (precio === null) return desde ? `desde $${desde}` : 'a cotizar';
    return recurrente ? `$${precio}/mes` : `$${precio}`;
  };

  return (
    <div style={{ marginTop: 18 }}>
      <label htmlFor="paquete" style={{ ...s.label, marginBottom: 6, display: 'block' }}>
        Paquete del catálogo
      </label>
      <select
        id="paquete"
        style={{ ...s.input, maxWidth: 420 }}
        value={paqueteSlug ?? ''}
        onChange={(event) => onPaquete(event.target.value || null)}
      >
        <option value="">Sin paquete (todo a medida)</option>
        {SERVICIOS.filter((servicioItem) => servicioItem.paquetes.length > 0).map((servicioItem) => (
          <optgroup key={servicioItem.slug} label={servicioItem.nombre.es}>
            {servicioItem.paquetes.map((pkg) => (
              <option key={pkg.slug} value={pkg.slug}>
                {pkg.nombre.es} · {precioDe(pkg.precioUsd, pkg.desdeUsd, pkg.recurrente)}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {paquete && paquete.precioUsd === null && (
        <p style={s.hint}>
          Este paquete se cotiza: el número sale de lo que estimes abajo, fuera de catálogo.
        </p>
      )}

      {extras.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ ...s.label, marginBottom: 8, color: '#94a3b8' }}>Extras</p>
          {extras.map((extra) => {
            const id = `extra-${extra.id}`;
            const elegido = extrasIds.includes(extra.id);
            return (
              <div key={extra.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                <input
                  id={id}
                  type="checkbox"
                  checked={elegido}
                  onChange={(event) => onExtra(extra.id, event.target.checked)}
                  style={{ marginTop: 3 }}
                />
                <div>
                  <label htmlFor={id} style={{ fontSize: 13, color: '#e2e8f0', cursor: 'pointer' }}>
                    {extra.label.es}
                    <span style={{ color: '#00d4d4', fontFamily: 'monospace', marginLeft: 8 }}>
                      +${extra.precioUsd}
                      {extra.recurrente ? '/mes' : ''}
                    </span>
                  </label>
                  <p style={{ fontSize: 11, color: c.textDim, margin: '2px 0 0' }}>{extra.detalle.es}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
