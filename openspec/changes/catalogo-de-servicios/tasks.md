# Tasks: Catálogo de servicios como fuente única

Este proyecto es TDD: cada tarea de lógica arranca por el test que falla.

## Fase 1 · El modelo

- [ ] 1.1 Extender `FixedPackage` en `src/content/packages.ts`: sumar `servicio`, `horas`, `plazoDias`, `destacado`, `calificacion`, `plantillas?`
- [ ] 1.2 Crear los tipos `Servicio`, `PreguntaCalificacion` y `PlantillaDiseno` en `src/content/servicios.ts`
- [ ] 1.3 RED: `src/content/servicios.test.ts` — slugs únicos, un solo destacado por servicio, todo paquete con horas y plazo
- [ ] 1.4 GREEN: cargar los 6 servicios con sus paquetes, extras y preguntas de calificación
- [ ] 1.5 RED+GREEN: `precioCierra(paquete, tarifa)` — falla si el precio se aparta más del 15 % de horas × tarifa
- [ ] 1.6 RED+GREEN: `calificaParaComprar(paquete, respuestas)` — sin respuestas false; una respuesta fuera de límite false; todas dentro true
- [ ] 1.7 Mantener los slugs viejos (`web-presence`, `full-stack-builds`, `automation-ai`, `product-ux-engineering`) como alias

## Fase 2 · La venta

- [ ] 2.1 RED: `PackageBanner.test.tsx` — sin responder, botón deshabilitado
- [ ] 2.2 RED: dentro del límite muestra «Contratar»; fuera del límite muestra «Agendar»
- [ ] 2.3 GREEN: preguntas de calificación y botón condicional en `PackageBanner.tsx`
- [ ] 2.4 Extras con casilla y total que se actualiza, máximo seis visibles
- [ ] 2.5 Banner: etiqueta de destacado, precio, plazo, qué incluye y qué no
- [ ] 2.6 Migración: `pedido_snapshot jsonb` en `leads`
- [ ] 2.7 RED+GREEN: `POST /api/pedido` crea el lead con paquete, extras y total, y devuelve el link de firma con `externalId`
- [ ] 2.8 El botón de contratar pasa por `/api/pedido` en vez de ir directo a Documenso
- [ ] 2.9 RED+GREEN: el webhook de Documenso reconoce la venta por `externalId`; si no viene, cae a la plantilla como hasta ahora
- [ ] 2.10 El mail de pago usa el total del pedido, no el precio de lista del paquete

## Fase 3 · Las pantallas

- [ ] 3.1 RED: `services/page.test.tsx` — muestra las tarjetas por problema y NO renderiza el formulario
- [ ] 3.2 GREEN: reescribir `src/app/[locale]/services/page.tsx` con el catálogo liviano
- [ ] 3.3 RED: ficha de servicio — muestra los paquetes del servicio y ninguno de otro
- [ ] 3.4 GREEN: crear `src/app/[locale]/services/[slug]/page.tsx` con banners comparados
- [ ] 3.5 Ficha sin paquetes (sistema de gestión): explica por qué se cotiza y ofrece agendar
- [ ] 3.6 Redirección permanente de los slugs viejos a los nuevos
- [ ] 3.7 Actualizar `src/app/sitemap.ts` con las rutas de servicio

## Fase 4 · El panel

- [ ] 4.1 RED: `modulosSugeridos(service)` devuelve los slugs del servicio; sin servicio, lista vacía
- [ ] 4.2 GREEN: implementarlo en `servicios.ts`
- [ ] 4.3 RED: ficha del lead — con `service` conocido los módulos llegan tildados
- [ ] 4.4 GREEN: pretildar en `src/app/admin/leads/[id]/page.tsx` al cargar los módulos

## Fase 5 · El formulario (último: es por donde entran los leads)

- [ ] 5.1 Verificar en verde los tests actuales del formulario y del alta antes de tocar nada
- [ ] 5.2 Mover `serviceQuestions` y `suggestedBudget` de `IntakeForm.tsx` a `servicios.ts`
- [ ] 5.3 RED+GREEN: el formulario muestra las preguntas del servicio elegido y ninguna de otro
- [ ] 5.4 Verificar que `/api/leads` sigue recibiendo `service` y `service_data` igual que antes

## Fase 6 · Cierre

- [ ] 6.1 Suite completa y build en verde
- [ ] 6.2 Revisar que no quede ningún precio ni pregunta declarada fuera de `servicios.ts`
- [ ] 6.3 Probar el circuito completo: elegir servicio → calificar → contratar o agendar
