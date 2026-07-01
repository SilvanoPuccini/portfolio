'use client';

import { useState, useEffect, useCallback } from 'react';
import { s } from '@/components/admin/AdminShell';

type RateConfig = { tarifa_hora: number; buffer_pct: number };

export default function ConfigPage() {
  const [config, setConfig] = useState<RateConfig>({ tarifa_hora: 35, buffer_pct: 20 });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/config');
    const data = await res.json() as { config: RateConfig };
    if (data.config) setConfig(data.config);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    setSaved(false);
    await fetch('/api/admin/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <p style={{ color: '#475569', fontSize: 13 }}>Cargando...</p>;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <p style={s.eyebrow}>Configuración</p>
        <h1 style={{ ...s.heading, fontSize: 24 }}>Tarifa y Buffer</h1>
      </div>

      <div style={{ ...s.card, maxWidth: 400 }}>
        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Tarifa por hora (USD)</label>
          <input
            type="number"
            min={1}
            style={s.input}
            value={config.tarifa_hora}
            onChange={(e) => setConfig((c) => ({ ...c, tarifa_hora: Number(e.target.value) || 0 }))}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={s.label}>Buffer (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            style={s.input}
            value={config.buffer_pct}
            onChange={(e) => setConfig((c) => ({ ...c, buffer_pct: Number(e.target.value) || 0 }))}
          />
        </div>

        <p style={s.hint}>
          Precio = (horas PERT × {1 + config.buffer_pct / 100}) × ${config.tarifa_hora}/hr
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button style={s.btn} onClick={save}>Guardar</button>
          {saved && <p style={s.successText}>Guardado</p>}
        </div>
      </div>
    </div>
  );
}
