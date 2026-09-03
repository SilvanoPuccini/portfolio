/**
 * Marca si la fila tiene el texto en bruto cargado.
 *
 * Sin esto, un post con título y fecha se ve igual que uno con el texto ya
 * guardado, y no había forma de saber de un vistazo cuáles faltan escribir.
 */
export function ContentBadge({
  hasContent,
  chars,
}: {
  hasContent: boolean;
  chars: number;
}) {
  const palabras = Math.round(chars / 6);

  return (
    <span
      title={
        hasContent
          ? `Texto en bruto cargado (${chars.toLocaleString('es-AR')} caracteres, ~${palabras.toLocaleString('es-AR')} palabras)`
          : 'Todavía no se cargó el texto de este post'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 10.5,
        fontFamily: 'monospace',
        letterSpacing: '0.04em',
        padding: '2px 8px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
        background: hasContent ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.12)',
        color: hasContent ? '#4ade80' : '#fbbf24',
        border: `1px solid ${hasContent ? 'rgba(74,222,128,0.25)' : 'rgba(251,191,36,0.35)'}`,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'currentColor',
          flexShrink: 0,
        }}
      />
      {hasContent ? 'con texto' : 'sin texto'}
    </span>
  );
}
