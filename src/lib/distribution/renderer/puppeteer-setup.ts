import type { Browser } from 'puppeteer-core';

// Importaciones lazy para evitar que Next.js bundlee Chromium en el cliente.
// puppeteer-core + @sparticuz/chromium están declarados en serverExternalPackages.

async function getExecutablePath(): Promise<string> {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return chromium.executablePath();
  }

  // Dev local: buscar Chrome/Chromium instalado en el sistema
  const fs = await import('fs');
  const localPaths = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ];

  for (const p of localPaths) {
    if (fs.existsSync(p)) return p;
  }

  // Fallback: variable de entorno explícita
  if (process.env.CHROME_EXECUTABLE_PATH) {
    return process.env.CHROME_EXECUTABLE_PATH;
  }

  // Último recurso: sparticuz descarga una versión compatible
  const chromium = (await import('@sparticuz/chromium')).default;
  return chromium.executablePath();
}

export async function launchBrowser(): Promise<Browser> {
  const isProd = process.env.NODE_ENV === 'production';
  const puppeteer = (await import('puppeteer-core')).default;

  let args: string[] = ['--no-sandbox', '--disable-setuid-sandbox'];

  if (isProd) {
    const chromium = (await import('@sparticuz/chromium')).default;
    args = chromium.args;
  }

  const executablePath = await getExecutablePath();

  return puppeteer.launch({
    args,
    executablePath,
    headless: true,
    defaultViewport: { width: 1080, height: 1080 },
  });
}
