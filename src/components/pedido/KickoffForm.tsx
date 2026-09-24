'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CloudUpload, Loader2, Paperclip } from 'lucide-react';

import type { DatoKickoff, GrupoKickoff, PlanKickoff } from '@/content/kickoff';
import type { Locale } from '@/content/servicios';

/**
 * El material del proyecto, cargado por el cliente.
 *
 * Se guarda solo mientras escribe. Nadie junta el logo, las fotos y los
 * textos de su negocio de una sentada: se distrae, cierra la pestaña, vuelve
 * al otro día. Perder lo cargado es perder al cliente, así que no hay un
 * botón de guardar del que dependa nada.
 *
 * El botón del final no guarda: avisa que terminó. Son dos cosas distintas.
 */

type Valor = string | string[] | Record<string, string>[];
type Datos = Record<string, Valor>;

const copy = {
  es: {
    guardando: 'Guardando…',
    guardado: 'Guardado',
    subir: 'Elegir archivo',
    subiendo: 'Subiendo…',
    subido: 'Subido',
    noSubio: 'No se pudo subir',
    opcional: 'opcional',
    falta: 'Falta',
    listo: 'Ya está, terminé',
    avisando: 'Avisando…',
    completado: 'Listo. Ya tengo todo para arrancar.',
    pendientes: (n: number) => `Te faltan ${n} ${n === 1 ? 'dato obligatorio' : 'datos obligatorios'}`,
    todoListo: 'Está todo lo obligatorio. Podés avisarme cuando quieras.',
    demora: 'Se guarda solo. Podés cerrar y seguir después desde este mismo link.',
  },
  en: {
    guardando: 'Saving…',
    guardado: 'Saved',
    subir: 'Choose file',
    subiendo: 'Uploading…',
    subido: 'Uploaded',
    noSubio: 'Could not upload',
    opcional: 'optional',
    falta: 'Missing',
    listo: 'That is it, I am done',
    avisando: 'Letting you know…',
    completado: 'All set. I have everything to start.',
    pendientes: (n: number) => `${n} required ${n === 1 ? 'field' : 'fields'} left`,
    todoListo: 'Everything required is in. Tell me whenever you want.',
    demora: 'It saves itself. You can close this and continue later from the same link.',
  },
} as const;

/** Un campo suelto o una celda de una fila. */
function Campo({
  dato,
  locale,
  valor,
  onChange,
  onArchivo,
  miniaturas,
  fallidos,
  subiendo,
}: {
  dato: DatoKickoff;
  locale: Locale;
  valor: Valor | undefined;
  onChange: (valor: Valor) => void;
  onArchivo: (archivos: FileList) => void;
  /** Vista previa local de lo recién subido, por nombre. */
  miniaturas: Record<string, string>;
  /** Lo que no se pudo subir, para que no se vaya en silencio. */
  fallidos: string[];
  subiendo: boolean;
}) {
  const labels = copy[locale];
  const texto = typeof valor === 'string' ? valor : '';
  const archivos = Array.isArray(valor) ? (valor as string[]).filter((v) => typeof v === 'string') : [];

  return (
    <label className="block">
      <span className="flex flex-wrap items-baseline gap-2">
        <span className="text-sm font-medium text-text-primary">{dato.label[locale]}</span>
        {!dato.obligatorio && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-tertiary">
            {labels.opcional}
          </span>
        )}
      </span>
      <span className="mt-1 block text-xs leading-5 text-text-tertiary">{dato.ayuda[locale]}</span>

      {dato.tipo === 'parrafo' && (
        <textarea
          rows={3}
          className="form-field mt-2 resize-y"
          value={texto}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {(dato.tipo === 'texto' || dato.tipo === 'enlace') && (
        <input
          type={dato.tipo === 'enlace' ? 'url' : 'text'}
          className="form-field mt-2"
          value={texto}
          onChange={(event) => onChange(event.target.value)}
        />
      )}

      {dato.tipo === 'opcion' && (
        <span className="mt-2 flex flex-wrap gap-2">
          {(dato.opciones?.[locale] ?? []).map((opcion, i) => {
            const valorOpcion = dato.opciones?.es[i] ?? opcion;
            const marcada = texto === valorOpcion;
            return (
              <span
                key={opcion}
                className={`cursor-pointer rounded-pill border px-3 py-1.5 text-sm transition-colors ${
                  marcada
                    ? 'border-brand-primary/50 bg-brand-primary/10 text-text-primary'
                    : 'border-outline-ghost/15 text-text-secondary hover:border-outline-ghost/30'
                }`}
                onClick={() => onChange(valorOpcion)}
                role="radio"
                aria-checked={marcada}
                tabIndex={0}
                onKeyDown={(event) => { if (event.key === 'Enter') onChange(valorOpcion); }}
              >
                {opcion}
              </span>
            );
          })}
        </span>
      )}

      {dato.tipo === 'archivo' && (
        <span className="mt-2 block">
          <span className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-soft)] border border-outline-ghost/15 px-4 py-2.5 text-sm text-text-secondary transition-colors hover:border-brand-primary/40 hover:text-text-primary">
            {subiendo
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              : <CloudUpload className="h-4 w-4" aria-hidden="true" />}
            {subiendo ? labels.subiendo : labels.subir}
            <input
              type="file"
              className="sr-only"
              multiple={dato.multiple}
              onChange={(event) => { if (event.target.files?.length) onArchivo(event.target.files); }}
            />
          </span>

          {/* Confirmar que llegó es la mitad del trabajo. El cliente sube el
              logo de su negocio y se queda sin saber si se adjuntó: el tilde
              y la miniatura son lo que lo dejan seguir tranquilo. */}
          {archivos.length > 0 && (
            <span className="mt-3 block space-y-2">
              {archivos.map((nombre) => (
                <span
                  key={nombre}
                  className="flex items-center gap-2.5 rounded-[var(--radius-soft)] border border-brand-primary/25 bg-brand-primary/[0.04] px-3 py-2"
                >
                  {miniaturas[nombre]
                    ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={miniaturas[nombre]}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded object-cover"
                      />
                    )
                    : <Paperclip className="h-3.5 w-3.5 shrink-0 text-text-tertiary" aria-hidden="true" />}

                  <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
                    {nombre.split('/').pop()}
                  </span>

                  <Check className="h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden="true" />
                  <span className="sr-only">{labels.subido}</span>
                </span>
              ))}
            </span>
          )}

          {/* Un archivo que no sube ya no frena a los demás, pero tampoco
              puede irse en silencio: el cliente creía que estaba todo. */}
          {fallidos.length > 0 && (
            <span role="alert" className="mt-2 block text-xs leading-5 text-red-400">
              {labels.noSubio}: {fallidos.join(', ')}
            </span>
          )}
        </span>
      )}
    </label>
  );
}

export function KickoffForm({
  pedidoId,
  plan,
  iniciales,
  yaCompletado,
  locale,
}: {
  pedidoId: string;
  plan: PlanKickoff;
  iniciales: Datos;
  yaCompletado: boolean;
  locale: Locale;
}) {
  const labels = copy[locale];
  const router = useRouter();
  const [datos, setDatos] = useState<Datos>(iniciales);
  const [estado, setEstado] = useState<'quieto' | 'guardando' | 'guardado'>('quieto');
  const [subiendo, setSubiendo] = useState<string | null>(null);

  // La vista previa de lo que se acaba de subir, y lo que no pudo subirse.
  // Los archivos viven en un bucket privado, así que la miniatura sale del
  // archivo que el cliente tiene en la mano: alcanza para confirmarle que lo
  // que eligió es lo que se fue.
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({});
  const [fallidos, setFallidos] = useState<Record<string, string[]>>({});
  const [completado, setCompletado] = useState(yaCompletado);
  const [avisando, setAvisando] = useState(false);

  const pendiente = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ultimo = useRef<Datos>(iniciales);

  const guardar = useCallback(async (valores: Datos, listo = false) => {
    setEstado('guardando');
    try {
      await fetch(`/api/pedido/${pedidoId}/datos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos: valores, ...(listo ? { listo: true } : {}) }),
      });
      setEstado('guardado');
    } catch {
      // Se reintenta con el próximo cambio: no hay nada que avisarle acá.
      setEstado('quieto');
    }
  }, [pedidoId]);

  /** Se guarda sola, un segundo y medio después de la última tecla. */
  useEffect(() => {
    if (datos === ultimo.current) return;
    if (pendiente.current) clearTimeout(pendiente.current);

    pendiente.current = setTimeout(() => {
      ultimo.current = datos;
      void guardar(datos);
    }, 1500);

    return () => { if (pendiente.current) clearTimeout(pendiente.current); };
  }, [datos, guardar]);

  const set = (id: string, valor: Valor) => setDatos((actuales) => ({ ...actuales, [id]: valor }));

  const visible = (condicion?: { id: string; valor: string }) => {
    if (!condicion) return true;
    const actual = datos[condicion.id];
    const opciones = plan.datos.find((d) => d.id === condicion.id)?.opciones?.es ?? [];
    // La condición se escribe con una clave («archivo»), y lo guardado es el
    // texto de la opción: se comparan por posición.
    const indice = condicion.valor === 'archivo' ? 0 : 1;
    return actual === opciones[indice];
  };

  async function subir(campo: string, archivos: FileList, multiple: boolean) {
    setSubiendo(campo);
    setFallidos((previos) => ({ ...previos, [campo]: [] }));

    const subidos: string[] = Array.isArray(datos[campo]) && multiple
      ? [...(datos[campo] as string[])]
      : [];
    const noPudieron: string[] = [];
    const vistas: Record<string, string> = {};

    for (const archivo of Array.from(archivos)) {
      const form = new FormData();
      form.append('archivo', archivo);
      form.append('campo', campo);

      try {
        const res = await fetch(`/api/pedido/${pedidoId}/archivo`, { method: 'POST', body: form });
        const body = await res.json() as { path?: string; nombre?: string };

        if (res.ok && body.path) {
          const nombre = body.nombre ?? body.path;
          subidos.push(nombre);
          // Solo las imágenes: de un PDF o una planilla no hay nada que mirar.
          if (archivo.type.startsWith('image/')) vistas[nombre] = URL.createObjectURL(archivo);
        } else {
          noPudieron.push(archivo.name);
        }
      } catch {
        // Un archivo que no sube no frena a los demás, pero tampoco se va en
        // silencio: el cliente creía que estaba todo cargado.
        noPudieron.push(archivo.name);
      }
    }

    setMiniaturas((previas) => ({ ...previas, ...vistas }));
    setFallidos((previos) => ({ ...previos, [campo]: noPudieron }));
    setSubiendo(null);
    set(campo, subidos);
  }

  // Las vistas previas ocupan memoria hasta que se las suelta. Se leen de una
  // ref para soltarlas SOLO al desmontar: hacerlo en cada cambio borraría las
  // miniaturas que el cliente está mirando.
  const vivas = useRef<Record<string, string>>({});
  vivas.current = miniaturas;
  useEffect(() => () => {
    Object.values(vivas.current).forEach((url) => URL.revokeObjectURL(url));
  }, []);

  /** Lo obligatorio que todavía está vacío. */
  const faltan = plan.datos.filter((dato) => {
    if (!dato.obligatorio || !visible(dato.visibleSi)) return false;
    const valor = datos[dato.id];
    return Array.isArray(valor) ? valor.length === 0 : !String(valor ?? '').trim();
  });

  async function avisar() {
    setAvisando(true);
    await guardar(datos, true);
    setCompletado(true);
    setAvisando(false);
    // Al cierre de la compra: gracias, qué compró y qué viene, con fechas.
    router.push(`/${locale}/pedido/${pedidoId}/listo`);
  }

  if (completado) {
    return (
      <div className="surface-panel border border-brand-primary/25 px-6 py-8">
        <Check className="h-5 w-5 text-brand-primary" aria-hidden="true" />
        <h2 className="section-title-sm mt-4">{labels.completado}</h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-text-secondary">
          Si te olvidaste de algo, escribime y lo sumamos.
        </p>
      </div>
    );
  }

  const filasDe = (grupo: GrupoKickoff): Record<string, string>[] => {
    const guardadas = Array.isArray(datos[grupo.id]) ? datos[grupo.id] as Record<string, string>[] : [];
    const minimo = grupo.veces ?? Math.max(1, guardadas.length);
    return Array.from({ length: Math.max(minimo, guardadas.length) }, (_, i) => guardadas[i] ?? {});
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm leading-6 text-text-tertiary">{labels.demora}</p>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
          {estado === 'guardando' ? labels.guardando : estado === 'guardado' ? labels.guardado : ''}
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {plan.datos.filter((dato) => visible(dato.visibleSi)).map((dato) => (
          <div key={dato.id} className={dato.tipo === 'parrafo' ? 'sm:col-span-2' : ''}>
            <Campo
              dato={dato}
              locale={locale}
              valor={datos[dato.id] ?? (dato.sugerido ? dato.opciones?.es[dato.sugerido === 'archivo' ? 0 : 1] : undefined)}
              onChange={(valor) => set(dato.id, valor)}
              onArchivo={(archivos) => subir(dato.id, archivos, Boolean(dato.multiple))}
              miniaturas={miniaturas}
              fallidos={fallidos[dato.id] ?? []}
              subiendo={subiendo === dato.id}
            />
          </div>
        ))}
      </div>

      {plan.grupos.filter((grupo) => visible(grupo.visibleSi)).map((grupo) => (
        <section key={grupo.id} className="border-t border-outline-ghost/10 pt-8">
          <h2 className="section-title-sm">{grupo.label[locale]}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{grupo.ayuda[locale]}</p>

          <div className="mt-6 space-y-6">
            {filasDe(grupo).map((fila, indice) => (
              <div
                key={`${grupo.id}-${indice}`}
                className="surface-panel border border-outline-ghost/10 px-5 py-5"
              >
                <p className="technical-label">{`${indice + 1}`}</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  {grupo.campos.map((campo) => (
                    <div key={campo.id} className={campo.tipo === 'parrafo' ? 'sm:col-span-2' : ''}>
                      <Campo
                        dato={campo}
                        locale={locale}
                        valor={fila[campo.id]}
                        onChange={(valor) => {
                          const filas = filasDe(grupo).map((f, i) =>
                            (i === indice ? { ...f, [campo.id]: String(valor) } : f));
                          set(grupo.id, filas);
                        }}
                        onArchivo={(archivos) => subir(`${grupo.id}_${indice}_${campo.id}`, archivos, false)}
                        miniaturas={miniaturas}
                        fallidos={fallidos[`${grupo.id}_${indice}_${campo.id}`] ?? []}
                        subiendo={subiendo === `${grupo.id}_${indice}_${campo.id}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {!grupo.veces && (
              <button
                type="button"
                className="button-secondary"
                onClick={() => set(grupo.id, [...filasDe(grupo), {}])}
              >
                + {grupo.label[locale]}
              </button>
            )}
          </div>
        </section>
      ))}

      <div className="border-t border-outline-ghost/10 pt-8">
        <p className="text-sm leading-6 text-text-secondary">
          {faltan.length > 0 ? labels.pendientes(faltan.length) : labels.todoListo}
        </p>
        <button
          type="button"
          onClick={avisar}
          disabled={avisando || faltan.length > 0}
          className="button-primary mt-4"
        >
          {avisando ? labels.avisando : labels.listo}
        </button>
      </div>
    </div>
  );
}
