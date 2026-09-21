# Proposal: Catálogo de servicios como fuente única

## Intent

Hoy los servicios viven repartidos: la página los describe, `modulos_precio` cotiza, y el presupuesto se arma a mano. Nada los une, así que un lead que entra por «Sitio web» (USD 450) llega al panel como hoja en blanco y termina cotizado en USD 1.500. El cliente pidió una cosa y la conversación va a otra: fricción desde el minuto uno.

Además no existe el concepto de **paquete** (precio y alcance cerrados), que es lo que permite vender sin llamada.

## Scope

### In Scope
- `src/content/servicios.ts`: 6 servicios con sus paquetes, extras, preguntas de calificación, módulos y datos de kickoff.
- Página `/services` rediseñada: seis tarjetas por problema + banners de paquete.
- Ficha por servicio `/services/[slug]` con sus paquetes comparados.
- Calificación automática: dos preguntas por paquete; si se pasa del límite, el botón cambia a «Agendar».
- Formulario por servicio alimentado desde el archivo.
- Panel: módulos pretildados según el servicio del lead.

### Out of Scope
- Kickoff pack automático por paquete (paso siguiente, depende de esto).
- Plantillas de Documenso por paquete (configuración manual del usuario).
- Rediseño del panel de leads (ya hecho).

## Approach

Un módulo de contenido tipado es la fuente única; las cuatro puntas lo leen. La página y el formulario derivan de él, el panel usa `modulos` para pretildar y `preguntasCalificacion` decide si el botón vende o agenda. Se reutiliza `packages.ts` (ya existe, con banner y webhook de link directo) extendiéndolo, en vez de crear un segundo modelo paralelo.

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `src/content/servicios.ts` | Nuevo | Fuente única |
| `src/content/packages.ts` | Modificado | Se integra al nuevo modelo |
| `src/app/[locale]/services/page.tsx` | Modificado | Catálogo liviano |
| `src/app/[locale]/services/[slug]/` | Nuevo | Ficha por servicio |
| `src/components/blocks/IntakeForm.tsx` | Modificado | Preguntas desde el archivo |
| `src/app/api/leads/route.ts` | Modificado | Guarda servicio y módulos sugeridos |

## Risks

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Romper el formulario público, que hoy capta leads | Media | Tests del formulario antes de tocarlo; el circuito de alta no cambia |
| Precios del archivo divergen de `modulos_precio` | Alta | El paquete declara sus horas; test que verifica precio contra horas y tarifa |
| SEO: cambian las URLs de servicios | Media | Las rutas nuevas se agregan; `/services` sigue existiendo |

## Rollback Plan

Cada punta se conecta en un commit propio. Revertir el commit de la página deja el archivo sin usar pero no rompe nada, porque `servicios.ts` es contenido puro sin efectos. El formulario y `/api/leads` se tocan al final, cuando el resto ya está verificado.

## Dependencies

- Catálogo comercial definido (precios, límites y extras): hecho, en memoria del proyecto.

## Success Criteria

- [ ] Los 6 servicios y sus paquetes salen de un solo archivo.
- [ ] Un lead que elige un servicio llega al panel con sus módulos pretildados.
- [ ] Un paquete cuyo cliente supera el límite ofrece agendar en vez de contratar.
- [ ] `/services` carga sin el formulario embebido.
- [ ] Suite completa en verde y build OK.
