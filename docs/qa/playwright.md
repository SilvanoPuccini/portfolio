# QA Playwright smoke

## Suite disponible

- Archivo: `src/test/e2e/portfolio-smoke.spec.ts`
- Cobertura actual:
  - redirect `/` -> `/es` y navegación principal
  - switch ES/EN + dark/light + flujo de CV
  - feedback del formulario de contacto

## Cómo correrla

```bash
npm run test:e2e:install
npm run test:e2e
```

## Bloqueo de entorno conocido

Si `npm run test:e2e` falla con `browserType.launch: Executable doesn't exist`, el entorno no tiene descargados los browsers de Playwright.

Eso no indica falta de specs: primero hay que instalar Chromium con `npm run test:e2e:install` (o `npx playwright install`).
