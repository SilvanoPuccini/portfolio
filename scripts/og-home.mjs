import { chromium } from 'playwright';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

/**
 * Saca la portada social del home con un navegador de verdad.
 *
 * Por qué un script y no una ruta que la genere al vuelo: un crawler baja el
 * og:image y espera muy poco. Arrancar Chromium tarda segundos, así que
 * generarla a demanda haría que LinkedIn y X se cansen y muestren el texto
 * pelado, que es justo lo que queremos arreglar. Un PNG estático se sirve al
 * instante.
 *
 * Y por qué no reconstruir el hero con satori, que es lo que usa /api/og: ese
 * renderizador entiende un subconjunto chico de CSS y no tiene Tailwind ni las
 * variables del sitio. Saldría parecido, nunca igual, y se desincronizaría con
 * el hero real igual que un screenshot viejo.
 *
 *   npm run og:home              usa https://silvanopuccini.dev
 *   npm run og:home -- --local   usa http://localhost:3000
 */

const OUT = path.join(process.cwd(), 'public', 'og-home.png');
const local = process.argv.includes('--local');
const url = local ? 'http://localhost:3000' : 'https://silvanopuccini.dev';

/** El tamaño que piden X, LinkedIn y WhatsApp para la tarjeta grande. */
const WIDTH = 1200;
const HEIGHT = 630;

async function main() {
  console.log(`Abriendo ${url} ...`);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      // Escala 1: sale exactamente 1200x630, que es lo que piden las tarjetas.
      // Con escala 2 el PNG pesaba 2,9 MB y los crawlers lo bajan lento o lo
      // descartan; a escala 1 pesa una fracción y el texto se lee igual,
      // porque casi siempre se muestra a menos de 1200 px de ancho.
      deviceScaleFactor: 1,
      colorScheme: 'dark',
      locale: 'es-AR',
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });

    // El hero anima al entrar: sin esperar, la foto sale a mitad de camino con
    // el texto traslúcido y desplazado.
    await page.waitForTimeout(2500);

    // El sitio rota las capturas de proyecto cada 3,6 s. Se congela la
    // animación para que la foto no salga en medio de una transición.
    await page.addStyleTag({
      content: `*, *::before, *::after {
        animation-play-state: paused !important;
        transition: none !important;
      }`,
    });
    await page.waitForTimeout(400);

    await mkdir(path.dirname(OUT), { recursive: true });
    await page.screenshot({ path: OUT, type: 'png' });

    const { size } = await stat(OUT);
    console.log(`Listo: public/og-home.png (${WIDTH}x${HEIGHT}, ${Math.round(size / 1024)} KB)`);
    if (size > 1_000_000) {
      console.warn('Pesa más de 1 MB: conviene comprimirlo antes de publicar.');
    }
    console.log('Acordate de commitear el archivo.');
  } finally {
    await browser.close();
  }
}

main().catch((reason) => {
  console.error('No se pudo sacar la portada:', reason.message);
  console.error(local
    ? 'Con --local hace falta que `npm run dev` esté corriendo.'
    : 'Probá con: npm run og:home -- --local');
  process.exit(1);
});
