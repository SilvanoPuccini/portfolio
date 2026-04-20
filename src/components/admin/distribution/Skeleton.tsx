'use client';

// Skeleton genérico reutilizable para estados de carga del admin

const pulse = `
  @keyframes skeleton-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`;

export function SkeletonBlock({
  width = '100%',
  height = 16,
  borderRadius = 6,
  style: extraStyle,
}: {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <>
      <style>{pulse}</style>
      <div style={{
        width,
        height,
        borderRadius,
        background: '#1e293b',
        animation: 'skeleton-pulse 1.4s ease-in-out infinite',
        flexShrink: 0,
        ...extraStyle,
      }} />
    </>
  );
}

// ── Skeleton para una fila de la lista de distribuciones ──────

export function DistributionRowSkeleton() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '14px 0', borderBottom: '1px solid #1e293b',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginRight: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <SkeletonBlock width="40%" height={14} />
          <SkeletonBlock width={64} height={20} borderRadius={20} />
        </div>
        <SkeletonBlock width="60%" height={11} />
      </div>
      <SkeletonBlock width={72} height={30} borderRadius={8} />
    </div>
  );
}

// ── Skeleton para la página de detalle ───────────────────────

export function DistributionDetailSkeleton() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <SkeletonBlock width={120} height={11} style={{ marginBottom: 10 }} />
        <SkeletonBlock width="55%" height={26} style={{ marginBottom: 12 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <SkeletonBlock width={80} height={22} borderRadius={20} />
          <SkeletonBlock width={200} height={14} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #1e293b', paddingBottom: 0 }}>
        {[80, 90, 70].map((w, i) => (
          <SkeletonBlock key={i} width={w} height={38} borderRadius={0} style={{ marginBottom: -1 }} />
        ))}
      </div>

      {/* Grid preview + editor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SkeletonBlock width="100%" height={0} style={{ paddingBottom: '100%', borderRadius: 10 }} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <SkeletonBlock width={64} height={34} borderRadius={8} />
            <SkeletonBlock width={64} height={34} borderRadius={8} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[1,2,3,4,5,6].map((i) => <SkeletonBlock key={i} width={44} height={44} borderRadius={6} />)}
          </div>
        </div>

        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: 28 }}>
            <SkeletonBlock width={100} height={11} style={{ marginBottom: 16 }} />
            <SkeletonBlock width="100%" height={38} style={{ marginBottom: 16 }} />
            <SkeletonBlock width="100%" height={120} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <SkeletonBlock width={80} height={32} borderRadius={8} />
              <SkeletonBlock width={100} height={32} borderRadius={8} />
            </div>
          </div>
          <div style={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 12, padding: 28 }}>
            <SkeletonBlock width={80} height={11} style={{ marginBottom: 12 }} />
            <SkeletonBlock width="100%" height={60} />
          </div>
        </div>
      </div>
    </div>
  );
}
