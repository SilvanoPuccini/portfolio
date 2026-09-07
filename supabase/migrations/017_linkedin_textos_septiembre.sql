-- Migration 017: textos finales de LinkedIn de las tres semanas de septiembre
--
-- Seis piezas derivadas de los artículos del 13, 20 y 27 de septiembre.
-- Escritas con las reglas de `Marketing y marca/Reglas de publicación.md`:
-- cero links en el cuerpo, primera línea menor a 140 caracteres, entre 1.300
-- y 1.800 caracteres, El Radar mencionado por nombre y no por URL, dos
-- hashtags técnicos como máximo, cero emojis.
--
-- Quedan en 'planificado': el guion del carrusel y el PDF final todavía no
-- existen, y la regla del vault es que una semana no se marca lista hasta
-- que los carruseles estén revisados y exportados.

UPDATE linkedin_posts SET body = $post$Tenés tres opciones de frontend y las tres funcionan. Ese es el problema, no la solución.

React con Vite, Next.js y Angular pueden construir el mismo producto. La diferencia no aparece el primer día. Aparece a los seis meses.

Lo que estás eligiendo en realidad es qué parte del problema resolvés vos y qué parte viene resuelta.

React es una biblioteca. Vite es una herramienta de build. Next.js es un framework con capa de servidor. Angular es un framework completo con convenciones propias.

No están en el mismo nivel. Elegir React con Vite es elegir dejar afuera lo que Next.js trae adentro.

En My Marketing Agency, un SaaS de gestión para agencias, elegí React 19 sobre Vite. La razón no fue técnica en el sentido que se suele discutir: no hay una sola pantalla pública que alguien tenga que encontrar en un buscador. Todo está detrás de un login.

Con esa restricción, el renderizado en servidor no compra nada.

Gané velocidad de desarrollo. Perdí las barandas.

El enrutamiento, la protección de rutas y la organización de carpetas las definís vos. No hay CLI que te corrija. Con una persona más en el proyecto, eso ya obliga a sostener convenciones a mano.

Ese costo no se ve en un benchmark. Se ve cuando entra alguien nuevo.

La pregunta útil no es cuál es mejor. Es qué vas a estar pagando dentro de seis meses, y si estás dispuesto a pagarlo.

Escribí el análisis completo en El Radar, con los tres proyectos y lo que descarté en cada uno.

¿Vos elegís frontend por el producto o por lo que ya sabés usar?

#React #NextJS$post$ WHERE slug = 'li-que-estas-eligiendo-realmente';

UPDATE linkedin_posts SET body = $post$Tengo tres proyectos en producción. Ninguno comparte la decisión de frontend con otro. No fue casualidad.

Cada uno arrancó con una restricción distinta, y esa restricción eliminó opciones antes de que yo tuviera que elegir nada.

My Marketing Agency es un SaaS de gestión para agencias. Todo vive detrás de un login. Nadie llega desde un buscador.

Decisión: React 19 con Vite, Supabase para datos, autenticación, almacenamiento y tiempo real, Stripe por Edge Functions.

Consecuencia: desarrollo inmediato, cero preguntas sobre qué corre dónde. A cambio, las convenciones las sostenés a mano.

PEDIACORE es una plataforma de gestión clínica pediátrica. Turnos, historia clínica, curvas de crecimiento, portal para padres.

Ahí el valor no está en la interfaz. Está en las reglas y en datos que no pueden estar mal.

Decisión: Django 5.2 con DRF del lado del servidor, React 19 con TypeScript del lado del cliente.

Consecuencia: 827 tests, casi todos contra el backend. A cambio, una API que mantener y un borde nuevo donde las cosas se rompen.

FerrelonStock es un e-commerce para una ferretería. Catálogo, stock, checkout con dos pasarelas, seguimiento de envíos.

Decisión: ninguno de los dos anteriores. Django con plantillas, HTMX y Alpine.js. Cero líneas de React.

Consecuencia: una sola cosa desplegada, un solo repositorio, sin contrato de API. A cambio, un techo de interactividad que no se arregla con un refactor.

Tres productos. Tres restricciones. Tres decisiones que no se pueden intercambiar.

El análisis completo está en El Radar.

¿Cuál de las tres restricciones se parece más a tu proyecto actual?

#Django #React$post$ WHERE slug = 'li-tres-productos-tres-decisiones';

UPDATE linkedin_posts SET body = $post$La pregunta llega casi siempre en la peor forma posible: cuál backend es más rápido.

Siempre hay un benchmark que responde eso. Siempre a favor de quien lo publicó. Siempre midiendo una operación que tu producto no hace.

Casi ningún proyecto se muere por milisegundos.

Se muere porque las reglas quedaron desparramadas. Porque nadie sabe qué pasa cuando falla un cobro. Porque hay tres servicios corriendo y una sola persona para mirarlos.

Nada de eso lo resuelve el lenguaje.

En FerrelonStock elegí Django. No por rendimiento. Porque casi todo el sistema es reglas: qué pasa si el stock cambia mientras alguien tiene el producto en el carrito, qué se factura, qué zona de envío corresponde.

Ninguna de esas preguntas se responde más rápido en otro lenguaje.

Autenticación, permisos, panel administrativo y migraciones vinieron con el framework. Ese tiempo se fue directo al catálogo y al checkout.

Lo que pagué: adopté las convenciones enteras. Cuando algo no encaja bien con el ORM, escribís alrededor del framework, y eso siempre se ve peor que el resto del código.

Elegir backend no es elegir velocidad de ejecución.

Es elegir dónde vas a estar peleando dentro de seis meses.

Y el criterio que más se subestima es el de operación. Es el único que no se paga una vez. Se paga todos los meses.

En El Radar publiqué los seis criterios que uso antes de abrir una sola documentación.

¿Cuántas piezas tenés desplegadas hoy y cuántas mirás de verdad?

#Django #PostgreSQL$post$ WHERE slug = 'li-no-existe-el-mejor-backend';

UPDATE linkedin_posts SET body = $post$FerrelonStock y PEDIACORE tienen el mismo backend. Y dos arquitecturas que no se parecen en nada.

Los dos son Django. Los dos van contra PostgreSQL. Ahí termina el parecido.

FerrelonStock es un e-commerce: Django con plantillas, HTMX, una sola aplicación desplegada. Siete apps modulares, catorce modelos, 65 tests.

Una cosa que operar.

PEDIACORE es gestión clínica: Django con DRF exponiendo una API, React del otro lado, tareas asíncronas con django-q2, todo empaquetado con Docker sobre DigitalOcean. 827 tests.

Cuatro cosas que pueden fallar por separado. Una sola persona mirándolas.

El mismo framework. Decisiones opuestas.

La diferencia no es el lenguaje. Es qué necesita hacer cada producto y cuánta superficie de operación estoy dispuesto a sostener.

Y hay un tercer caso que rompe la pregunta.

En My Marketing Agency no escribí backend. Éramos dos personas y el producto necesitaba autenticación, base de datos, almacenamiento, tiempo real y cobros. Escribir todo eso a mano se habría comido el proyecto antes de tener una pantalla útil.

Supabase resolvió esa parte. Stripe entró por Edge Functions.

Gané semanas.

Lo que pagué apareció fuera del código: cuando el backend es un servicio, delegás también parte de tu diagnóstico. Hay fallas que no encontrás leyendo tu propio repositorio.

Un producto no necesita el mismo backend en todas sus etapas. Necesita el que corresponde a la restricción que tiene hoy.

El análisis completo está en El Radar.

¿Alguna vez cambiaste de arquitectura sin cambiar de framework?

#Django #Supabase$post$ WHERE slug = 'li-mismo-producto-otro-backend';

UPDATE linkedin_posts SET body = $post$El primer deploy sale bien. La URL responde, se saca la captura, se festeja.

El que enseña es el segundo.

Ese va encima de datos que ya existen, con una versión anterior que funcionaba y con alguien usando el sistema en ese momento.

La palabra deploy tapa cuatro cosas distintas que fallan por motivos distintos.

Build: convertir el repositorio en algo ejecutable. Fallan dependencias y versiones.

Configuración: lo que cambia entre entornos sin cambiar el código. Fallan variables y secretos.

Despliegue: poner esa versión a atender pedidos reales. Fallan migraciones y arranque.

Verificación: comprobar que el sistema hace su trabajo, no solo que responde. Falla lo que nadie miró.

Confundirlas tiene un costo concreto. Cuando algo se rompe no sabés en cuál de las cuatro estás, y terminás cambiando código para arreglar un problema de configuración.

En FerrelonStock esa diferencia se ve a simple vista. Los archivos estáticos se preparan en el build y los sirve WhiteNoise. Los archivos que sube un usuario viven en Cloudinary y no dependen del build.

Si el CSS no aparece, el problema está en el build. Si no se ve la foto de un producto, el build no tiene nada que ver.

Parecen la misma cosa. Se rompen en momentos distintos.

Y hay una parte que no se revierte: los datos. Volver a la versión anterior del código no deshace una migración que ya transformó una columna.

Escribí el proceso completo en El Radar, con los tres proyectos.

¿Cuál de las cuatro etapas es la que más veces te mordió?

#Django #DevOps$post$ WHERE slug = 'li-del-commit-a-produccion';

UPDATE linkedin_posts SET body = $post$Volver atrás no es una sola cosa. Son tres, y confundirlas es el error más caro que vi.

Revertir la aplicación es volver a la versión anterior del código. Rápido y casi siempre reversible.

Recuperar datos es arreglar información que quedó mal por un error de la versión nueva. No se resuelve cambiando de versión.

Restaurar un backup es volver la base entera a un momento previo. Recupera lo roto y borra todo lo que pasó desde entonces.

Tratarlas como equivalentes lleva a la peor decisión posible: restaurar un backup para arreglar algo que se solucionaba revirtiendo el código, y perder en el camino operaciones legítimas.

El fallo más útil que tuve no fue de código.

En My Marketing Agency apareció un problema de acceso a la organización de Supabase gestionada desde Vercel. El repositorio estaba bien. El build estaba bien.

No había nada que revertir, porque el problema no estaba en ninguna versión mía.

La reacción instintiva era tocar el código. La decisión correcta fue no tocarlo. Se resolvió del lado del acceso, en el panel.

Lo que me dejó es la lección más cara de las tres: cuando delegás parte de tu backend a un servicio, delegás también parte de tu diagnóstico.

Hay fallas que no vas a encontrar leyendo tu propio repositorio, por más que lo leas entero.

Y hay una cuarta cosa que todavía no tengo resuelta en ninguno de mis tres proyectos: el aviso. El que se entera de que algo se rompió sigo siendo yo, y solo si estoy mirando.

Un sistema que se cae un domingo a la noche y me espera hasta el lunes está tan caído como uno que nadie monitorea.

En El Radar publiqué el proceso completo de entrega y recuperación.

¿Cómo te enterás vos de que algo se cayó?

#DevOps #Supabase$post$ WHERE slug = 'li-volver-a-una-version-estable';
