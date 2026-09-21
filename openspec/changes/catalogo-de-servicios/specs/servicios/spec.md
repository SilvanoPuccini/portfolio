# Especificación: Catálogo de servicios

## Propósito

Definir el catálogo comercial como fuente única: servicios, paquetes, extras y los límites que deciden si un cliente compra o agenda una llamada.

## Requisitos

### Requisito: Fuente única

El catálogo DEBE definirse en un solo módulo de contenido. La página pública, el formulario y el panel NO DEBEN declarar servicios, precios ni módulos por su cuenta.

#### Escenario: un precio se cambia una sola vez

- DADO que un paquete cuesta USD 790
- CUANDO se cambia su precio en el módulo de contenido
- ENTONCES la página, el banner y el presupuesto muestran el precio nuevo
- Y no queda ningún precio viejo en otra pantalla

### Requisito: Servicios y paquetes

Un servicio DEBE tener entre cero y tres paquetes. Un paquete DEBE declarar precio, horas estimadas, plazo, qué incluye y qué no.

Un servicio sin paquetes DEBE mostrarse con llamada obligatoria y explicar por qué no tiene precio cerrado.

#### Escenario: servicio con paquetes

- DADO el servicio «Web de captación» con tres paquetes
- CUANDO se abre su ficha
- ENTONCES se ven los tres, comparables entre sí
- Y uno está marcado como destacado

#### Escenario: servicio sin paquetes

- DADO el servicio «Sistema de gestión», sin paquetes
- CUANDO se abre su ficha
- ENTONCES no se muestra ningún banner de compra
- Y se muestra el motivo por el que se cotiza a medida

### Requisito: Calificación antes de vender

Un paquete DEBE declarar hasta dos preguntas de calificación con su límite. Si la respuesta supera el límite, el sistema NO DEBE ofrecer contratar: DEBE ofrecer agendar una llamada.

#### Escenario: el cliente entra en el límite

- DADO el paquete «Auditoría» con límite de 15 páginas y sin login
- CUANDO el cliente responde «10 páginas» y «sin login»
- ENTONCES se muestra el botón de contratar con su precio

#### Escenario: el cliente se pasa del límite

- DADO el mismo paquete
- CUANDO el cliente responde «40 páginas»
- ENTONCES el botón de contratar NO se muestra
- Y en su lugar se ofrece agendar una llamada

#### Escenario: no contestó

- DADO un paquete con preguntas de calificación
- CUANDO el cliente todavía no respondió
- ENTONCES el botón de contratar permanece deshabilitado

### Requisito: Coherencia entre precio y horas

El precio de un paquete DEBE ser coherente con sus horas y la tarifa vigente. Una diferencia mayor al 15 % DEBE fallar la verificación automática.

#### Escenario: un precio deja de cerrar

- DADO un paquete de 26 horas a una tarifa de USD 30
- CUANDO su precio se fija en USD 300
- ENTONCES la verificación falla e indica el paquete y la diferencia

### Requisito: El servicio predice el presupuesto

Un servicio DEBE declarar los módulos que suele incluir. Cuando un lead llega por ese servicio, el panel DEBE mostrar esos módulos ya tildados.

#### Escenario: lead con servicio conocido

- DADO un lead que entró por «Catálogo + cobro»
- CUANDO se abre su ficha
- ENTONCES los módulos de ese paquete están tildados
- Y el total se calcula con ellos

#### Escenario: lead sin servicio

- DADO un lead que entró sin elegir servicio
- CUANDO se abre su ficha
- ENTONCES no hay módulos tildados y el total es cero

### Requisito: Preguntas del formulario por servicio

El formulario público DEBE mostrar las preguntas del servicio elegido, escritas en lenguaje de negocio.

#### Escenario: preguntas propias del servicio

- DADO que el cliente eligió «Automatización con IA»
- CUANDO abre el formulario
- ENTONCES ve las preguntas de ese servicio
- Y no ve las de los otros

### Requisito: Dos idiomas

Todo texto del catálogo DEBE existir en español e inglés. Un texto sin traducir DEBE fallar la verificación automática, no mostrarse en el idioma equivocado.

#### Escenario: la ficha en inglés

- DADO un visitante en `/en/services/web`
- CUANDO carga la página
- ENTONCES el nombre del servicio, los paquetes y las preguntas están en inglés

#### Escenario: falta una traducción

- DADO un paquete cargado solo en español
- CUANDO corre la verificación del contenido
- ENTONCES falla e indica qué texto falta

### Requisito: Responsive

Las pantallas del catálogo DEBEN ser usables desde 360 px de ancho. En celular los paquetes NO DEBEN quedar fuera de pantalla: se desplazan lateralmente con imán, sin rotación automática.

#### Escenario: paquetes en celular

- DADO un visitante en un celular de 360 px
- CUANDO abre una ficha con tres paquetes
- ENTONCES ve uno completo y descubre los otros deslizando
- Y ningún texto se corta ni desborda

## Requisitos modificados

### Requisito: La página de servicios

La página DEBE listar los servicios por el problema que resuelven y NO DEBE incluir el formulario embebido.
(Antes: cuatro tarjetas largas con el formulario de cuatro pasos dentro de la misma página.)

#### Escenario: catálogo liviano

- DADO un visitante que entra a la página de servicios
- CUANDO carga la página
- ENTONCES ve las tarjetas por problema y ningún formulario
- Y cada tarjeta lleva a la ficha de su servicio
