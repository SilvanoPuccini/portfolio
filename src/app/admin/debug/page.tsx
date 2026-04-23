'use client';

import { useState } from 'react';
import { s } from '@/components/admin/AdminShell';

type Results = Record<string, string>;

export default function DebugPage() {
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  async function runTest() {
    setLoading(true);
    setResults(null);
    const res = await fetch('/api/admin/debug');
    const data = await res.json() as { results?: Results; error?: string };
    setResults(data.results ?? { error: data.error ?? 'Error desconocido' });
    setLoading(false);
  }

  return (
    <div>
      <p style={s.eyebrow}>Sistema</p>
      <h1 style={{ ...s.heading, fontSize: 24, marginBottom: 20 }}>Test modelos IA</h1>

      <div style={{ ...s.card, maxWidth: 520 }}>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          Prueba cada modelo de Gemini disponible con tu API key. La clave nunca sale del servidor.
        </p>

        <button onClick={runTest} disabled={loading} style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Probando modelos...' : '▶ Ejecutar test'}
        </button>

        {loading && (
          <p style={{ fontSize: 12, color: '#475569', marginTop: 14, fontFamily: 'monospace' }}>
            Esto puede tardar ~30s mientras prueba cada modelo...
          </p>
        )}

        {results && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(results).map(([model, status]) => (
              <div key={model} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: 8,
                background: status.startsWith('✅') ? 'rgba(74,222,128,0.06)'
                  : status.startsWith('⚠️') ? 'rgba(250,204,21,0.06)'
                  : 'rgba(248,113,113,0.06)',
                border: `1px solid ${status.startsWith('✅') ? 'rgba(74,222,128,0.15)'
                  : status.startsWith('⚠️') ? 'rgba(250,204,21,0.15)'
                  : 'rgba(248,113,113,0.15)'}`,
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>{model}</span>
                <span style={{ fontSize: 12, color: '#e2e8f0' }}>{status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
