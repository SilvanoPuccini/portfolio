-- Migration 018: soft delete for the editorial agenda and MDX draft backfill.

ALTER TABLE post_publications
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_post_publications_active_scheduled
  ON post_publications (scheduled_at)
  WHERE deleted_at IS NULL;

-- Preserve administrative edits: only hydrate rows that still have no draft.
UPDATE post_publications AS publication
SET raw_content = source.raw_content,
    updated_at = now()
FROM (
  VALUES
    ('nextjs-vite-o-angular', $nextjs$
Elegir frontend se parece a elegir entre tres respuestas correctas. La factura no llega el día que arrancás: llega seis meses después, cuando el proyecto necesita justo aquello que tu herramienta resuelve de la forma más cara.

La discusión casi siempre empieza mal. Alguien pregunta cuál es mejor y la respuesta llega en forma de lista de características, o peor, de benchmark aislado. Nadie pregunta primero qué tiene que hacer el producto.

Y las tres opciones funcionan. Ese es el problema real. Podés construir el mismo producto con React sobre Vite, con Next.js o con Angular, y las tres versiones van a andar. Lo que cambia no es si funciona: es cuánto trabajo queda de tu lado, qué se vuelve difícil después y quién puede sostenerlo cuando el proyecto deja de ser tuyo solo.

Este post no elige un ganador. Compara qué trae resuelto cada uno, qué te deja para resolver a vos, y en qué tipo de producto cada decisión se paga barata o cara.

## Para quién sirve esto y desde dónde lo escribo

Esto no aplica a un equipo de cincuenta personas con un design system propio y una plataforma interna que ya decidió por vos. Ahí la pregunta está respondida por la organización, no por vos.

Aplica al que decide solo o con una persona más, sobre un producto que todavía no existe, sin nadie que le banque una migración a los ocho meses. Escribo desde ese lugar: proyectos donde la persona que elige la herramienta es también la que la mantiene.

## Las cuatro cosas que estás comparando no están en el mismo nivel

Antes de comparar hay que aclarar qué es cada cosa, porque la conversación se ensucia rápido.

<FrontendLineupBlock />

React es una biblioteca de interfaz. Te da componentes y estado, nada más. No trae enrutamiento, ni obtención de datos, ni build.

Vite es una herramienta de desarrollo y empaquetado. Te da el servidor local, el recargado instantáneo y el bundle de producción. No te da una arquitectura de aplicación.

Next.js es un framework construido sobre React. Además de la interfaz define rutas, estrategias de renderizado, caché y una capa de servidor propia.

Angular es un framework completo con su propio lenguaje de plantillas, inyección de dependencias, organización en módulos y un CLI que genera piezas con una forma esperada.

Entonces "React con Vite" no compite contra Next.js en igualdad de condiciones. Compite eligiendo dejar afuera lo que Next.js trae adentro, y asumir vos esas decisiones. Esa asimetría es toda la discusión.

## Los seis criterios que miro antes de abrir una sola documentación

<FrontendMatrixBlock />

Los seis pesan distinto según el proyecto, y ninguna columna gana en todas. Pero hay un patrón que se repite: cuando el primer criterio y el último apuntan en la misma dirección, la decisión ya está casi tomada y el resto es confirmación.

Vale una aclaración sobre la matriz. Las barras no son un puntaje. Indican cuánto trae resuelto cada opción en ese criterio, y traer mucho resuelto no siempre es bueno: es exactamente lo que te ata a una convención.

## React con Vite: máxima libertad, cero barandas

Lo que te da es velocidad de arranque. Un proyecto nuevo levanta en segundos, el recargado es instantáneo y no hay una capa de servidor que entender. Todo corre en el navegador, y esa simplicidad mental es real: cuando algo se rompe, hay un solo lugar donde pudo romperse.

Lo que te deja a vos es la arquitectura entera. El enrutamiento lo elegís, la protección de rutas la escribís, la organización de carpetas la inventás. No hay CLI que te corrija ni convención que te frene.

Esa libertad se cobra en un lugar específico, y no es el que uno espera. No se cobra en rendimiento: se cobra en el equipo. Con una sola persona, decidir todo es velocidad. Con dos, ya hay que acordar convenciones y sostenerlas por disciplina. Con cinco, aparecen tres formas distintas de hacer lo mismo dentro del mismo repositorio.

Es la mejor opción cuando el producto vive detrás de un login, cuando el proyecto es de una o dos personas, y cuando el trabajo pesado no está en la interfaz sino en la lógica que la interfaz consume.

Es la peor cuando alguien tiene que encontrar tu contenido en un buscador. Ahí vas a terminar reconstruyendo a mano lo que un framework ya integró.

## Next.js: el servidor que no pediste pero que a veces necesitás

Lo que te da es todo lo que hace falta para que un contenido exista hacia afuera. HTML armado en el servidor, rutas basadas en el sistema de archivos, vistas previas dinámicas por página, estrategias de caché y una capa de servidor donde poner lo que no puede vivir en el navegador.

Cuando el producto necesita ser encontrado y compartido, esto deja de ser una preferencia técnica y pasa a ser un requisito. Una aplicación de una sola página obliga a resolver por afuera el HTML inicial, las etiquetas para compartir y el rastreo. Se puede. Pero cada pieza que reconstruís es una pieza que después mantenés.

Lo que te cobra es un modelo mental partido. Tenés que saber en todo momento qué código corre en el servidor y cuál en el navegador. Cuando algo falla, la primera pregunta ya no es qué se rompió sino dónde se ejecutó. Es una capa de diagnóstico que con Vite simplemente no existe.

Es la mejor opción para sitios públicos, catálogos, documentación y cualquier producto donde el contenido es parte del valor. Este mismo sitio, donde estás leyendo esto, existe por esa razón: un portfolio que no se indexa no cumple su función.

Es la peor cuando todo el producto está detrás de una sesión y nadie va a compartir una URL. Ahí estás pagando una capa de servidor que nunca vas a usar.

## Angular: la estructura que discutís al principio o sufrís al final

Lo que te da es la decisión ya tomada. Inyección de dependencias, organización en módulos, plantillas con su propia sintaxis, y un CLI que genera componentes y servicios con una forma consistente. En Angular hay una manera esperada de hacer casi todo.

Eso ataca directamente el punto donde React con Vite se rompe: la variedad. Si van a entrar y salir personas del proyecto durante años, tener una única forma correcta reduce la cantidad de decisiones malas que alguien puede tomar sin que nadie se entere.

Lo que te cobra es tiempo por adelantado. La curva inicial es más larga y las convenciones se pagan aunque el proyecto sea chico. Un producto de dos pantallas con Angular es un producto de dos pantallas con mucha estructura alrededor.

Es la mejor opción cuando la restricción principal es de equipo y no de producto: proyectos largos, con rotación, donde la consistencia vale más que la velocidad del primer mes.

Es la peor para un prototipo o un producto que todavía está buscando su forma. Ahí la estructura que te protege también te frena.

Acá hace falta una aclaración honesta: Angular está en mi formación, no en mi producción. Lo cursé, entiendo su modelo y puedo leerlo, pero no tengo un proyecto propio en producción hecho con Angular. Lo que escribo sobre él es evaluación, no experiencia, y prefiero decirlo antes que inventar una historia.

## Tres tipos de producto, tres decisiones distintas

<FrontendScenariosBlock />

El mismo equipo puede elegir distinto en tres productos y acertar las tres veces. Eso no es incoherencia: es que la restricción cambió.

Y hay un cuarto escenario que rompe la pregunta original. Cuando casi todo el valor está en reglas de negocio y la interfaz solo tiene que ser rápida y correcta, la mejor decisión de frontend puede ser no usar ninguno de los tres. Plantillas del lado del servidor con actualizaciones parciales resuelven muchísimo producto real con una sola aplicación desplegada. En un e-commerce que mantengo, el carrito se actualiza sin recargar la página y no hay una línea de React en el proyecto.

Eso tiene su propio techo, claro. El día que esa interfaz necesite algo realmente complejo, no hay refactor: se reescribe la capa de presentación entera.

## Lo que sacrifiqué en cada decisión

Elegir React con Vite para una herramienta interna significó descartar Next.js aunque lo manejo mejor. Lo descarté porque sumaba una capa de servidor a una aplicación que no la necesita, y con ella un modelo de ejecución que solo iba a complicar el diagnóstico. Gané velocidad y perdí las barandas. Con una persona más en el proyecto, esa falta de barandas ya se notó.

Elegir Next.js para un sitio público significó descartar la simplicidad de una aplicación de una sola página. La descarté porque sin HTML servido el contenido no cumple su función. Gané descubrimiento y acepté cargar para siempre con la pregunta de qué corre dónde.

Descartar Angular en los dos casos fue una decisión de contexto, no de calidad. Lo descarté porque en proyectos de una o dos personas su mayor fortaleza, que es imponer una única forma correcta, todavía no tiene a quién proteger. Gané tiempo al principio y acepté sostener convenciones a mano.

Ninguna de las opciones descartadas era la elección tonta. Eso es lo que convierte esto en una decisión y no en una respuesta.

## Lo que todavía no sé

Lo que no puedo responderme es dónde está exactamente el punto de cruce. Sé que con una persona la libertad de Vite es velocidad y que con veinte la estructura de Angular es supervivencia. No sé en qué número deja de compensar una y empieza a compensar la otra, y sospecho que ese número no es el mismo para todos los equipos ni para todos los productos. Lo único que tengo claro es que cuando te das cuenta, ya estás del otro lado.

---

Comparar frameworks por sus características es fácil y no decide nada. Compararlos por lo que dejan sin resolver, y por quién va a pagar eso seis meses después, es el trabajo que documento cada semana en El Radar.

El Radar es donde publico las decisiones técnicas que tomo en proyectos reales, con el costo que tuvo cada una.

Si querés recibirlo, suscribite acá abajo.
$nextjs$),
    ('django-nodejs-o-go', $backend$
Ningún backend elimina la complejidad de un sistema. La mueve de lugar. Lo que estás eligiendo no es cuál es más rápido, sino en qué parte del proyecto vas a estar peleando dentro de seis meses.

La pregunta llega casi siempre en la peor forma posible: cuál es más rápido. Y siempre hay un benchmark que responde eso, siempre a favor de quien lo publicó, siempre midiendo una operación que tu producto no hace.

El problema es que casi ningún proyecto se muere por milisegundos. Se muere porque las reglas de negocio quedaron desparramadas, porque nadie sabe qué pasa cuando falla un cobro, o porque hay tres servicios corriendo y una sola persona para mirarlos. Nada de eso lo resuelve el lenguaje.

Este es el contrapunto del artículo anterior sobre frontend. Misma lógica, otra capa: qué trae resuelto cada opción, qué te deja para escribir a vos y en qué tipo de sistema cada decisión sale barata o cara.

## Para quién sirve esto y desde dónde lo escribo

Esto no aplica a una empresa con equipo de plataforma, presupuesto de infraestructura y gente de guardia. Ahí la elección viene condicionada por lo que ya opera la organización, y con razón.

Aplica al que va a construir y además operar lo que construye. Si sos la persona que escribe el código y también la que se entera de que algo se cayó, la ecuación cambia entera.

## Django, Node.js y Go tampoco están en el mismo nivel

Igual que con el frontend, la comparación arranca torcida si no se aclara qué es cada cosa.

<BackendLineupBlock />

Django es un framework de aplicación en Python. Trae ORM, migraciones, autenticación, permisos, formularios y panel administrativo. Es la opción que más decisiones toma por vos.

Node.js es un entorno de ejecución de JavaScript en el servidor. No te da nada de lo anterior: te da la capacidad de correr JavaScript fuera del navegador y un ecosistema enorme para armar el resto pieza por pieza, normalmente empezando por Express.

Go es un lenguaje, no un framework. Trae concurrencia en el propio lenguaje, una biblioteca estándar fuerte y un binario único como resultado de la compilación. La capa de aplicación la escribís vos.

Entonces cuando alguien compara "Django contra Node", está comparando un framework contra un ecosistema de piezas sueltas. Y cuando compara contra Go, está comparando decisiones ya tomadas contra decisiones por tomar. Eso no hace mejor a ninguno: define qué recibís hecho y qué armás.

## Los seis criterios que uso

| Criterio | La pregunta concreta |
|---|---|
| Dominio | ¿El valor está en reglas de negocio o en mover datos rápido? |
| Velocidad de desarrollo | ¿Cuánto tarda en existir la primera versión usable? |
| Tiempo real | ¿Alguien necesita ver un cambio sin recargar? |
| Concurrencia | ¿Hay muchas operaciones simultáneas compitiendo por lo mismo? |
| Equipo | ¿Quién lo mantiene y qué lenguaje ya conoce? |
| Operación | ¿Cuántos procesos tengo que desplegar, monitorear y recuperar? |

El sexto es el que más se subestima. Es el único que no se paga una vez, se paga todos los meses.

## Django: el framework que ya decidió casi todo

Lo que te da es un sistema con reglas funcionando en días, no en semanas. Autenticación, permisos, migraciones y panel administrativo vienen incluidos. Cuando el dominio es lo difícil, eso no es comodidad: es tiempo que se va directo al problema real.

Es la mejor opción cuando el valor del sistema está en las reglas. Un catálogo con stock, un checkout, una historia clínica con permisos por rol, una facturación. En esos casos la pregunta difícil nunca es cuántos pedidos por segundo aguanta, sino qué pasa si el stock cambia mientras alguien tiene el producto en el carrito. Esa pregunta no se responde más rápido en otro lenguaje.

Lo que te cobra son sus convenciones. Adoptás el ORM, la estructura de aplicaciones y su forma de pensar los modelos. Cuando algo no encaja bien con esa forma, la salida es escribir alrededor del framework, y ese código siempre se ve peor que el resto.

Es la peor opción cuando el sistema es sobre todo tiempo real o cuando la carga simultánea es el problema central. Se puede resolver, pero estás peleando contra el diseño de la herramienta en lugar de apoyarte en él.

## Node.js: un solo lenguaje en las dos puntas

Lo que te da es continuidad. Si el frontend ya está escrito en TypeScript, seguir en TypeScript del lado del servidor elimina el costo de cambiar de contexto varias veces por día. No es un detalle estético: es tiempo real de trabajo.

Además su modelo asíncrono encaja natural con lo que muchos backends modernos hacen la mayor parte del tiempo, que es orquestar. Llamar a un servicio, esperar, transformar, responder. Ahí Node no está peleando contra su naturaleza.

Lo que te cobra es todo lo que Django te regala. ORM, validación, permisos, estructura de carpetas y convenciones las elegís y las sostenés vos. Empezás más rápido y a los seis meses tenés un conjunto de decisiones que nadie documentó.

Es la mejor opción cuando el equipo ya vive en TypeScript y el backend es sobre todo integración: pasarelas de pago, servicios externos, webhooks, transformación de datos.

Es la peor cuando el sistema es denso en reglas y permisos, y no hay nadie con tiempo para construir esa base a mano.

Acá va una aclaración honesta: Node con Express está en mi stack y lo trabajé, pero no lo tengo en producción en un proyecto propio. Lo más cerca que estuve es TypeScript del lado del servidor en funciones de borde sobre Deno, que es el mismo lenguaje y no es el mismo entorno. Decir lo contrario sería vender una experiencia que no tengo.

## Go: eficiencia a cambio de escribir más

Lo que te da es previsibilidad bajo carga y un despliegue trivial. Compila a un binario único, sin entorno de ejecución que instalar al lado. La concurrencia está en el lenguaje, no en una biblioteca que agregaste.

Lo que te cobra es velocidad de desarrollo. Casi nada del dominio viene hecho. Un panel administrativo que en Django existe el primer día, en Go lo escribís vos o no lo tenés.

Es la mejor opción para un servicio acotado con un requisito medible: procesar muchas operaciones simultáneas, mantener un consumo de recursos bajo, o responder dentro de un límite de latencia que alguien va a verificar.

La palabra clave es medible. Elegir Go por rendimiento sin un número que lo justifique es elegir por estética, y el costo lo vas a pagar en cada funcionalidad que escribas desde cero.

Es la peor opción cuando el producto todavía está buscando su forma y las reglas cambian cada semana.

Go tampoco está en mi producción. Lo estudié y entiendo su modelo, pero cuando tenga un proyecto propio corriendo con Go lo voy a escribir acá con el resultado real, bueno o malo.

## Ninguno elimina la complejidad: la mueve

<BackendComplexityBlock />

Esta es la parte que los benchmarks no muestran. Cada opción te ahorra trabajo en una punta y te lo cobra en otra, y ese intercambio es la decisión completa.

Hay una cuarta salida que conviene nombrar, porque cada vez es más común: no escribir backend. Delegar base de datos, autenticación, almacenamiento y tiempo real a un servicio administrado, y dejar solo la lógica propia en funciones. Cuando el equipo es chico y el tiempo es la restricción real, eso puede ser la decisión correcta.

Tiene su propio costo, y no está en el código. Cuando el backend es un servicio, delegás también parte de tu diagnóstico. Hay fallas que no vas a encontrar leyendo tu repositorio, porque no están ahí. Me pasó: un problema de acceso a la organización de un servicio administrado, con el repositorio impecable y nada que revertir.

## Lo que sacrifiqué en cada decisión

Elegir Django para un sistema denso en reglas significó descartar un backend a medida donde cada pieza fuera exactamente la que quiero. Lo descarté porque ese control se paga en semanas antes de tener algo usable. Gané tiempo hacia el dominio y acepté escribir alrededor del framework cuando algo no encaja.

Elegir separar la API del frontend en un sistema significó descartar el monolito con plantillas, que en otro proyecto me funcionó muy bien. Lo descarté porque la interfaz necesitaba interacciones que las plantillas vuelven trabajosas. Gané una interfaz que puede crecer y acepté cuatro piezas para operar en lugar de una.

Delegar el backend a un servicio administrado en un tercer caso significó descartar exactamente lo que más practiqué. Lo descarté porque éramos dos personas y el tiempo real, la autenticación y el almacenamiento habrían sido el proyecto entero. Gané semanas y acepté que parte del diagnóstico vive en un panel ajeno.

Las tres alternativas descartadas eran defendibles. Por eso fueron decisiones.

## Lo que todavía no sé

Lo que no sé es cuánto aguanta la cuarta opción cuando el producto crece. Delegar el backend es claramente correcto para arrancar de a dos, pero cada regla de negocio que queda repartida entre el cliente y una función suelta es una regla que no está en un solo lugar donde probarla. En un monolito sé exactamente dónde mirar cuando el dominio está mal. En el modelo delegado todavía no tengo esa certeza, y no sé si el día que la necesite voy a poder recuperarla sin reescribir.

---

Elegir backend por velocidad de ejecución es la comparación fácil y casi nunca es la que importa. Elegirlo por dónde vas a estar peleando el año que viene, y por cuántas piezas vas a tener que mirar vos solo, es la que documento cada semana en El Radar.

El Radar es donde publico las decisiones técnicas que tomo en proyectos reales, con el costo que tuvo cada una.

Si querés recibirlo, suscribite acá abajo.
$backend$),
    ('deploy-no-es-subir-una-carpeta', $deploy$
En local, si algo se rompe, lo arreglás y volvés a correr. En producción hay una versión anterior que funcionaba, datos que ya existen y gente adentro. Ahí "volver atrás" deja de ser una tecla y pasa a ser una decisión que conviene tener tomada antes.

El día que un proyecto sale a producción, la mayoría de la atención está puesta en que ande. Y anda. El deploy sale bien, la URL responde, se saca la captura.

Lo que casi nunca se prepara es el segundo deploy. El que va encima de datos que ya existen, con una versión anterior que sí funcionaba y con alguien que en ese momento está usando el sistema. Ese es el que enseña qué era realmente entregar software.

Los dos artículos anteriores fueron sobre elegir: frontend primero, backend después. Este es sobre lo que pasa cuando lo elegido tiene que salir de tu máquina y quedarse afuera.

## Para quién sirve esto y desde dónde lo escribo

Esto no aplica a un equipo con plataforma interna, entornos provistos y alguien de guardia. Ahí la mayor parte de lo que sigue ya viene resuelto y hasta prohibido de tocar.

Aplica al que despliega lo que escribe y además atiende cuando se cae. Todo lo que sigue viene de operar sistemas en tres modelos distintos: una plataforma administrada, contenedores sobre un servidor propio, y estáticos con servicios administrados detrás.

## Entregar son cuatro cosas, no una

La palabra deploy tapa cuatro pasos que fallan por motivos diferentes y se arreglan de formas diferentes.

<DeliveryStagesBlock />

Confundirlos tiene un costo concreto: cuando algo se rompe, no sabés en cuál de los cuatro estás parado, y terminás cambiando código para arreglar un problema de configuración.

Hay un ejemplo que lo muestra a simple vista. En un proyecto con archivos estáticos y archivos subidos por usuarios, los primeros se preparan durante el build y los sirve la aplicación; los segundos viven en un servicio externo y no dependen del build en absoluto. Son dos cosas que parecen la misma y se rompen en momentos distintos. Si el CSS no aparece, el problema está en el build. Si no se ve una foto cargada por alguien, el build no tiene nada que ver.

## La configuración no es lo mismo que el secreto

La restricción acá es simple: hay valores que cambian entre entornos y no todos tienen el mismo nivel de riesgo. La dirección de la base de datos cambia entre local y producción. La clave de una pasarela de pago también cambia, pero además no puede quedar registrada en ningún lado.

La decisión que aplico en todos los proyectos es la misma: nada sensible entra al repositorio, ni siquiera en un archivo de ejemplo con el valor real puesto. La configuración se lee del entorno, y todo lo que sea una credencial vive del lado del servidor. Cualquier cosa que llegue al navegador es pública aunque esté minificada.

Lo que se paga es fricción diaria. Cada vez que sumás una variable tenés que acordarte de agregarla en la plataforma, y no hay compilador que te avise. La aplicación arranca bien y falla más tarde, en la primera pantalla que necesitaba ese valor.

## Los datos son la parte que no se revierte

Este es el punto donde el deploy deja de parecerse a copiar archivos.

El código de una versión anterior está en el repositorio y se puede volver a poner. Los datos no. Si una migración transformó una columna, deshacer el despliegue no deshace la transformación.

Cuanto más sensible es el dominio, más pesa. En un sistema donde perder un dato no es una opción, cada cambio de esquema tiene que poder convivir con la versión anterior mientras dura la entrega, en lugar de ser un corte instantáneo.

En la práctica eso significa agregar antes de quitar. Primero se suma la columna nueva y el código escribe en las dos. Recién cuando la versión vieja no está corriendo en ningún lado se elimina la anterior.

Lo bueno es que durante la ventana en la que conviven las dos versiones, ninguna rompe a la otra. Lo que se paga es que una entrega que conceptualmente es un cambio termina siendo dos o tres despliegues separados, y hay que acordarse de terminar la secuencia. Un cambio que agrega sin su limpieza posterior no molesta a nadie, y por eso queda ahí meses.

## Qué reviso antes de exponer la versión nueva

La restricción real de un proyecto chico es que no hay nadie más que mire. No hay un revisor que atrape lo que se te pasó.

La decisión fue apoyarme en pruebas automáticas para lo que ya sé que duele, no para cubrir todo. En un e-commerce eso son unas decenas de pruebas concentradas donde el negocio se rompe: stock, carrito, checkout. En un sistema clínico son cientos, y la enorme mayoría corre contra el backend, que es donde vive la lógica que no puede estar mal.

Esa diferencia es deliberada. No es que uno esté mejor cubierto que el otro: son dos sistemas con superficies de riesgo distintas.

Lo que se paga es que las pruebas te dicen que la lógica está bien, no que la entrega esté bien. Un test en verde no sabe que a la plataforma le falta una variable de entorno. Después de cada despliegue hay una revisión manual corta que sigue siendo manual: entrar, hacer la operación más cara del sistema y confirmar que responde.

## Que la página abra no significa que funcione

Que la página cargue prueba que un proceso está vivo. No prueba que el sistema haga su trabajo.

Un sitio de venta puede mostrar el catálogo entero, impecable, con el cobro roto. El usuario ve todo bien y descubre el problema en el peor momento posible. Una API puede responder mientras el proceso que manda los correos está caído: las operaciones se guardan y las confirmaciones simplemente no salen. Nadie se entera hasta que alguien reclama.

Son cuatro preguntas distintas: si la aplicación responde, si los errores se ven, si las tareas de fondo avanzan y si los eventos externos llegan. Una respuesta afirmativa a la primera no dice nada de las otras tres.

Lo que se paga acá es que las señales existen pero no te buscan. Esa parte, la de que el sistema avise en lugar de esperar a que vos preguntes, es exactamente la que sigo teniendo pendiente.

## Volver atrás son tres cosas distintas

<RollbackOptionsBlock />

Acá se concentra la mayor cantidad de confusión, y es la que más caro sale. Tratarlas como equivalentes lleva a la peor decisión posible: restaurar un backup para arreglar un problema que se resolvía revirtiendo el código, y perder en el camino operaciones legítimas.

El fallo más útil que tuve no fue de código. Apareció un problema de acceso a un servicio administrado que estaba conectado desde otra plataforma. El repositorio estaba bien, el build estaba bien y no había nada que revertir, porque el problema no estaba en ninguna versión mía.

La decisión ahí fue no tocar el código, que era la reacción instintiva. Se resolvió del lado del acceso. Lo que me dejó es la lección más cara de las tres: cuando delegás parte de tu sistema a un servicio, delegás también parte de tu diagnóstico.

## Lo que sacrifiqué en cada decisión

Elegir una plataforma administrada para un proyecto con una sola aplicación significó descartar la infraestructura manejada por mí, que me habría dado control total sobre el proceso y los recursos. La descarté porque para un proyecto de una persona ese control se paga todos los meses en atención. Gané una superficie mínima y acepté hacer las cosas como la plataforma las quiere.

Elegir contenedores sobre un servidor propio en otro sistema significó descartar la plataforma que resuelve todo sola. La descarté porque hay procesos que necesitan comportarse igual en todos lados, y ahí el entorno reproducible deja de ser una preferencia. Gané previsibilidad y acepté administrar más piezas.

Elegir servicios administrados en un tercer caso significó descartar escribir y desplegar un backend propio. Lo descarté porque el tiempo era la restricción real. Gané semanas y acepté que parte del diagnóstico vive en un panel que no controlo.

## Lo que todavía no sé

Lo que no tengo resuelto es el aviso. Sé revertir, sé qué migración fue riesgosa y sé dónde mirar en cada proyecto. Pero el que se entera primero de que algo se rompió sigo siendo yo, y solo si estoy mirando. Un sistema que se cae un domingo a la noche y me espera hasta el lunes está tan caído como uno que nadie monitorea. No sé en qué punto conviene invertir en que el sistema me busque, y sospecho que ese punto ya pasó.

Lo que sí quedó claro después de tres modelos distintos es que la mitad de los problemas de entrega son problemas de entorno: algo que en mi máquina era de una manera y en el servidor era de otra. De eso se trata el próximo artículo.

---

Entregar es fácil el día del lanzamiento. Lo difícil empieza en el segundo despliegue, cuando ya hay datos adentro y una versión anterior que funcionaba. Ese tipo de decisión, y lo que cuesta cuando se toma tarde, es lo que documento cada semana en El Radar.

El Radar es donde publico las decisiones técnicas que tomo en proyectos reales, con el costo que tuvo cada una.

Si querés recibirlo, suscribite acá abajo.
$deploy$)
) AS source(post_slug, raw_content)
WHERE publication.post_slug = source.post_slug
  AND (publication.raw_content IS NULL OR btrim(publication.raw_content) = '');
