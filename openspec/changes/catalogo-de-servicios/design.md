# Design: Catálogo de servicios como fuente única

## Enfoque técnico

`src/content/servicios.ts` es contenido tipado, sin efectos ni dependencias: se puede importar desde el servidor, desde el cliente y desde un test sin montar nada. De ahí comen la página, la ficha, el formulario y el panel.

Se **extiende** `src/content/packages.ts`, que ya resuelve lo difícil —banner, link directo, creación del lead desde el webhook de Documenso— en vez de crear un segundo modelo. `FixedPackage` pasa a ser el paquete de un servicio.

## Decisiones

| Decisión | Alternativa descartada | Motivo |
|---|---|---|
| Contenido en TypeScript, no en base | Tabla `servicios` en Supabase | Cambia dos veces al año, no por request. En código va versionado, se revisa en el diff y tiene tests |
| Extender `FixedPackage` | Modelo `Paquete` nuevo | El webhook de Documenso ya busca por `packageForTemplate`; duplicar el modelo obliga a mantener dos |
| Ruta `/[locale]/services/[slug]` | Anclas en la página actual | Cada servicio necesita su URL para SEO y para el link del banner |
| Precio declarado + horas declaradas, verificadas por test | Precio calculado desde horas | El precio es una decisión comercial (790, no 780). El test detecta cuando dejan de cerrar |
| Calificación en el cliente, con el límite en el archivo | Endpoint que califica | Son dos preguntas y una comparación; un viaje al servidor no agrega nada |
| El formulario deriva sus preguntas del archivo | Mantener `serviceQuestions` en `IntakeForm.tsx` | Hoy el formulario declara sus propias preguntas y presupuestos sugeridos: es la segunda fuente de verdad que causó el problema |

## Flujo

```
  servicios.ts ─┬─→ /services            (tarjetas por problema)
                ├─→ /services/[slug]     (banners + preguntas)
                ├─→ IntakeForm           (preguntas del servicio)
                └─→ ficha del lead       (módulos pretildados)

  Cliente elige paquete
        │
        ├─ dentro del límite ─→ link directo Documenso ─→ webhook crea el lead
        └─ fuera del límite  ─→ agendar llamada ─→ formulario ─→ lead 'nuevo'
```

## Archivos

| Archivo | Acción | Qué |
|---|---|---|
| `src/content/servicios.ts` | Crear | Los 6 servicios con paquetes, extras, calificación, módulos y datos de kickoff |
| `src/content/servicios.test.ts` | Crear | Coherencia precio/horas, slugs únicos, un destacado por servicio |
| `src/content/packages.ts` | Modificar | `FixedPackage` gana `servicio`, `horas`, `calificacion`, `destacado` |
| `src/components/site/PackageBanner.tsx` | Modificar | Preguntas de calificación y botón condicional |
| `src/app/[locale]/services/page.tsx` | Modificar | Catálogo liviano, sin formulario |
| `src/app/[locale]/services/[slug]/page.tsx` | Crear | Ficha con banners comparados |
| `src/components/blocks/IntakeForm.tsx` | Modificar | `serviceQuestions` y `suggestedBudget` salen del archivo |
| `src/app/admin/leads/[id]/page.tsx` | Modificar | Pretilda módulos según `lead.service` |

## Contratos

```ts
export interface PreguntaCalificacion {
  id: string;
  texto: string;
  opciones: { valor: string; label: string; califica: boolean }[];
}

export interface Servicio {
  slug: string;
  problema: string;          // la frase del cliente, encabeza la tarjeta
  nombre: string;
  desde: number | null;      // null = sin precio cerrado
  modo: 'directo' | 'llamada';
  modulos: string[];         // slugs de modulos_precio, para pretildar
  preguntas: ServiceQuestion[];
  paquetes: FixedPackage[];
  extras: { id: string; label: string; precio: number }[];
}
```

`calificaParaComprar(paquete, respuestas)` devuelve `true` solo si **todas** las respuestas marcadas tienen `califica: true`. Sin respuestas, `false`: el botón arranca deshabilitado.

## Pruebas

| Capa | Qué | Cómo |
|---|---|---|
| Unidad | Coherencia precio/horas, calificación, slugs únicos | Vitest sobre el contenido |
| Componente | Banner: contrata dentro del límite, agenda fuera | Testing Library |
| Componente | Catálogo sin formulario; ficha muestra los paquetes del servicio | Testing Library |
| Regresión | El formulario sigue mandando `service` y `service_data` | El test existente del alta |

## Despliegue

Sin migración: no toca la base. Se conecta punta por punta, en commits separados, y el formulario se toca al final. Los slugs actuales (`web-presence`, `full-stack-builds`, `automation-ai`, `product-ux-engineering`) se conservan como alias para no romper los leads ya guardados ni los links publicados.

## La venta se registra antes de firmar

El webhook de Documenso hoy reconoce la venta por la plantilla que se firmó. Eso alcanza para un paquete solo, pero se rompe apenas hay extras: no se puede crear una plantilla por cada combinación de paquete y extras.

El botón de contratar deja de apuntar directo a Documenso y pasa primero por el backend:

```
  Banner (paquete + extras tildados)
      │  POST /api/pedido
      ▼
  Se crea el lead con el total real y el detalle de lo elegido
      │  redirige a  …/d/{token}?externalId={leadId}
      ▼
  Documenso: firma
      │  webhook DOCUMENT_COMPLETED trae externalId
      ▼
  Se reconoce la venta por externalId (la plantilla pasa a ser respaldo)
      │
      ▼
  Mail de pago con el monto correcto, en pesos
```

Documenso acepta `?externalId=` en el link directo y lo devuelve en el aviso, así que no hace falta nada de su lado.

Dos beneficios que van más allá del cobro. El primero es que la selección queda registrada aunque el cliente no firme: si veinte personas tildan «agenda de turnos» y ninguna termina, eso es información de negocio que hoy se pierde. El segundo es que el precio queda congelado en la venta, igual que `propuesta_snapshot`: si mañana sube la lista, lo que se firmó ayer no cambia.

Se agrega `pedido_snapshot jsonb` al lead: paquete, extras elegidos, total y fecha.

## Extensión prevista: plantillas por rubro

Más adelante cada paquete va a ofrecer plantillas de diseño por rubro, para que el cliente vea de antemano cómo va a quedar. No se construye ahora, pero el modelo se deja preparado para que no haya que rehacerlo:

```ts
export interface PlantillaDiseno {
  id: string;
  rubro: string;          // 'gastronomia' | 'salud' | 'comercio' | ...
  nombre: string;
  preview: string;        // captura
  demo?: string;          // sitio navegable
}
```

Dos momentos distintos, y conviene no mezclarlos:

- **Antes de comprar**, en la ficha: dos o tres ejemplos del rubro, como prueba de lo que recibe. Es argumento de venta, no una elección.
- **Después de firmar**, en el kickoff: ahí sí elige la suya, como un paso más del pedido de datos.

Elegir antes de pagar suma una decisión más a alguien que todavía no se decidió a comprar, y abre la discusión de «¿y si le cambio esto?» cuando todavía no hay contrato.

Lo único que el modelo de hoy necesita para no bloquearlo: que `Servicio` y `FixedPackage` admitan una lista opcional de plantillas, y que el rubro del cliente se guarde en el lead cuando se defina el kickoff.

## Preguntas abiertas

- [ ] ¿La ficha de servicio reemplaza a las tarjetas largas actuales o convive un tiempo?
- [ ] Los slugs viejos quedan como alias: ¿redirigen a los nuevos o se mantienen como URL canónica?
