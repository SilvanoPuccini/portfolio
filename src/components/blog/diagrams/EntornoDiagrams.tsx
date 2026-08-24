/**
 * Diagramas HTML/CSS del post "Cada herramienta que sumo tiene que ganarse
 * su lugar". Viven en .tsx (no en el .mdx) porque next-mdx-remote/rsc pierde
 * cualquier prop pasado como expresión JS (`prop={...}`) escrito directamente
 * en el body de un .mdx al evaluarlo en runtime — atributos de string plano
 * (`prop="..."`) sobreviven, `style={{}}` y `w={1200}` no. Por eso el propio
 * <Diagram w={...}> también vive acá adentro: los componentes *Block ya
 * incluyen el wrapper con su ancho fijo, y el .mdx solo los referencia con
 * un tag autocontenido, sin props entre llaves.
 */

import { Diagram } from '../PostRich';

export function StackDiagram() {
  return (
    <div style={{ boxSizing: 'border-box', width: '1200px', height: '800px', background: '#0a0e14', border: '1px solid #1a2230', borderRadius: '14px', padding: '56px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0' }}>
      <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '13px', letterSpacing: '.16em', color: '#8b94a3', marginBottom: '34px' }}>EL STACK, CAPA POR CAPA</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '26px', padding: '18px 26px', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#54606e', width: '70px' }}>BASE</div>
        <div style={{ fontSize: '24px', fontWeight: '700', flex: '1' }}>Windows</div>
        <div style={{ fontSize: '15px', color: '#8b94a3' }}>el equipo que tengo hoy</div>
      </div>
      <div style={{ height: '22px', width: '2px', background: '#22d3d3', marginLeft: '130px', opacity: '.55' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '26px', padding: '18px 26px', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#54606e', width: '70px' }}>01</div>
        <div style={{ fontSize: '24px', fontWeight: '700', flex: '1' }}>WSL2</div>
        <div style={{ fontSize: '15px', color: '#8b94a3' }}>kernel Linux real sobre Windows</div>
      </div>
      <div style={{ height: '22px', width: '2px', background: '#22d3d3', marginLeft: '130px', opacity: '.55' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '26px', padding: '18px 26px', background: '#0d1c22', border: '1px solid #22d3d3', borderRadius: '10px' }}>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#22d3d3', width: '70px' }}>02</div>
        <div style={{ fontSize: '26px', fontWeight: '800', flex: '1', color: '#eef2f5' }}>Ubuntu</div>
        <div style={{ fontSize: '15px', color: '#a9e8e8' }}>acá viven los proyectos, en <span style={{ fontFamily: 'ui-monospace,monospace' }}>~/</span></div>
      </div>
      <div style={{ height: '22px', width: '2px', background: '#22d3d3', marginLeft: '130px', opacity: '.55' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '26px', padding: '18px 26px', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#54606e', width: '70px' }}>03</div>
        <div style={{ fontSize: '24px', fontWeight: '700', flex: '1' }}>Warp</div>
        <div style={{ fontSize: '15px', color: '#8b94a3' }}>bloques en vez de scroll infinito</div>
      </div>
      <div style={{ height: '22px', width: '2px', background: '#22d3d3', marginLeft: '130px', opacity: '.55' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '26px', padding: '18px 26px', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#54606e', width: '70px' }}>04</div>
        <div style={{ fontSize: '24px', fontWeight: '700', flex: '1' }}>Zsh + Powerlevel10k</div>
        <div style={{ fontSize: '15px', color: '#8b94a3' }}>autosugerencias, rama de git en el prompt</div>
      </div>
      <div style={{ height: '22px', width: '2px', background: '#22d3d3', marginLeft: '130px', opacity: '.55' }}></div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '26px', padding: '18px 26px' }}>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#54606e', width: '70px' }}>05</div>
        <div style={{ flex: '1', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '14px' }}>
          <div style={{ padding: '16px 18px', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>Claude Code</div>
            <div style={{ fontSize: '13px', color: '#8b94a3', marginTop: '4px' }}>agente principal</div>
          </div>
          <div style={{ padding: '16px 18px', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>OpenCode</div>
            <div style={{ fontSize: '13px', color: '#8b94a3', marginTop: '4px' }}>modelo intercambiable</div>
          </div>
          <div style={{ padding: '16px 18px', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>Gentle AI</div>
            <div style={{ fontSize: '13px', color: '#8b94a3', marginTop: '4px' }}>Engram · GGA</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CommandsDiagram() {
  return (
    <div style={{ width: '1600px', background: '#0a0e14', border: '1px solid #1a2230', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: '#0c1219', borderBottom: '1px solid #1a2230' }}>
        <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#2a3a4a' }}></div>
        <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#2a3a4a' }}></div>
        <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#2a3a4a' }}></div>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#8b94a3', marginLeft: '14px' }}>silvano@ubuntu: ~/proyecto</div>
      </div>
      <div style={{ padding: '26px 30px', fontFamily: "ui-monospace,'Courier New',monospace", fontSize: '16px', lineHeight: '2', color: '#a9e8e8' }}>
        <div><span style={{ color: '#22d3d3' }}>➜ </span><span style={{ color: '#8b94a3' }}>~ </span>cd proyecto</div>
        <div><span style={{ color: '#22d3d3' }}>➜ </span><span style={{ color: '#8b94a3' }}>proyecto </span>ls -la</div>
        <div style={{ color: '#b6bfca' }}>total 48</div>
        <div style={{ color: '#b6bfca' }}>drwxr-xr-x  8 silvano silvano  4096 nov 12 10:22 <span style={{ color: '#22d3d3' }}>.</span></div>
        <div style={{ color: '#b6bfca' }}>drwxr-xr-x 21 silvano silvano  4096 nov 12 09:58 <span style={{ color: '#22d3d3' }}>..</span></div>
        <div style={{ color: '#b6bfca' }}>drwxr-xr-x  9 silvano silvano  4096 nov 12 10:21 <span style={{ color: '#22d3d3' }}>.git</span></div>
        <div style={{ color: '#b6bfca' }}>-rw-r--r--  1 silvano silvano    58 nov 11 18:40 .gitignore</div>
        <div style={{ color: '#b6bfca' }}>-rw-r--r--  1 silvano silvano  1204 nov 12 10:04 package.json</div>
        <div style={{ color: '#b6bfca' }}>drwxr-xr-x  4 silvano silvano  4096 nov 12 10:20 <span style={{ color: '#22d3d3' }}>src</span></div>
        <div style={{ color: '#b6bfca' }}>-rw-r--r--  1 silvano silvano   842 nov 10 21:15 README.md</div>
        <div><span style={{ color: '#22d3d3' }}>➜ </span><span style={{ color: '#8b94a3' }}>proyecto </span>grep &quot;error&quot; src/*.js</div>
        <div style={{ color: '#b6bfca' }}>src/api.js:42:  console.<span style={{ color: '#22d3d3' }}>error</span>(&quot;fetch falló&quot;, err)</div>
        <div><span style={{ color: '#22d3d3' }}>➜ </span><span style={{ color: '#8b94a3' }}>proyecto </span><span style={{ color: '#eef2f5' }}>▌</span></div>
      </div>
    </div>
  );
}

export function CloneToPublishDiagram() {
  return (
    <div style={{ boxSizing: 'border-box', width: '1200px', height: '400px', background: '#0a0e14', border: '1px solid #1a2230', borderRadius: '14px', padding: '48px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '34px' }}>
      <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '13px', letterSpacing: '.16em', color: '#8b94a3' }}>DE CLONAR A PUBLICAR</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: '1', padding: '18px 12px', textAlign: 'center', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '15px', color: '#a9e8e8' }}>git clone</div>
          <div style={{ fontSize: '12px', color: '#54606e', marginTop: '6px' }}>traer el repo</div>
        </div>
        <div style={{ color: '#22d3d3', fontSize: '20px' }}>→</div>
        <div style={{ flex: '1', padding: '18px 12px', textAlign: 'center', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '15px', color: '#a9e8e8' }}>cd</div>
          <div style={{ fontSize: '12px', color: '#54606e', marginTop: '6px' }}>entrar</div>
        </div>
        <div style={{ color: '#22d3d3', fontSize: '20px' }}>→</div>
        <div style={{ flex: '1', padding: '18px 12px', textAlign: 'center', background: '#0d1c22', border: '1px solid #22d3d3', borderRadius: '10px' }}>
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '15px', color: '#22d3d3' }}>code .</div>
          <div style={{ fontSize: '12px', color: '#8b94a3', marginTop: '6px' }}>abrir editor</div>
        </div>
        <div style={{ color: '#22d3d3', fontSize: '20px' }}>→</div>
        <div style={{ flex: '1', padding: '18px 12px', textAlign: 'center', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '15px', color: '#a9e8e8' }}>editar</div>
          <div style={{ fontSize: '12px', color: '#54606e', marginTop: '6px' }}>trabajar</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: '1', padding: '18px 12px', textAlign: 'center', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '15px', color: '#a9e8e8' }}>git status</div>
          <div style={{ fontSize: '12px', color: '#54606e', marginTop: '6px' }}>qué cambió</div>
        </div>
        <div style={{ color: '#22d3d3', fontSize: '20px' }}>→</div>
        <div style={{ flex: '1', padding: '18px 12px', textAlign: 'center', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '15px', color: '#a9e8e8' }}>git add .</div>
          <div style={{ fontSize: '12px', color: '#54606e', marginTop: '6px' }}>preparar</div>
        </div>
        <div style={{ color: '#22d3d3', fontSize: '20px' }}>→</div>
        <div style={{ flex: '1', padding: '18px 12px', textAlign: 'center', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px' }}>
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '15px', color: '#a9e8e8' }}>git commit</div>
          <div style={{ fontSize: '12px', color: '#54606e', marginTop: '6px' }}>confirmar</div>
        </div>
        <div style={{ color: '#22d3d3', fontSize: '20px' }}>→</div>
        <div style={{ flex: '1', padding: '18px 12px', textAlign: 'center', background: '#0d1c22', border: '1px solid #22d3d3', borderRadius: '10px' }}>
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '15px', color: '#22d3d3' }}>git push</div>
          <div style={{ fontSize: '12px', color: '#8b94a3', marginTop: '6px' }}>publicar</div>
        </div>
      </div>
    </div>
  );
}

export function WarpBlocksDiagram() {
  return (
    <div style={{ width: '1600px', background: '#0a0e14', border: '1px solid #1a2230', borderRadius: '14px', padding: '26px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#8b94a3', padding: '0 6px 8px' }}>
        <span>~/proyecto — bloque por comando</span>
        <span style={{ color: '#54606e' }}>3 bloques</span>
      </div>
      <div style={{ background: '#0c1219', border: '1px solid #1e2937', borderLeft: '3px solid #22d3d3', borderRadius: '0 10px 10px 0', padding: '16px 20px', fontFamily: 'ui-monospace,monospace', fontSize: '15px', lineHeight: '1.9' }}>
        <div style={{ color: '#eef2f5' }}><span style={{ color: '#22d3d3' }}>proyecto</span> <span style={{ color: '#8b94a3' }}>git:(</span><span style={{ color: '#e0a34a' }}>main</span><span style={{ color: '#8b94a3' }}>) ✗ </span>npm run build</div>
        <div style={{ color: '#b6bfca' }}>✓ compilado en 3.4s · 214 kB</div>
      </div>
      <div style={{ background: '#0c1219', border: '1px solid #1e2937', borderLeft: '3px solid #22d3d3', borderRadius: '0 10px 10px 0', padding: '16px 20px', fontFamily: 'ui-monospace,monospace', fontSize: '15px', lineHeight: '1.9' }}>
        <div style={{ color: '#eef2f5' }}><span style={{ color: '#22d3d3' }}>proyecto</span> <span style={{ color: '#8b94a3' }}>git:(</span><span style={{ color: '#e0a34a' }}>main</span><span style={{ color: '#8b94a3' }}>) ✗ </span>git status -sb</div>
        <div style={{ color: '#b6bfca' }}>## main...origin/main</div>
        <div style={{ color: '#b6bfca' }}> M src/api.js</div>
        <div style={{ color: '#b6bfca' }}>?? src/hooks/useEnv.js</div>
      </div>
      <div style={{ background: '#0c1219', border: '1px solid #1e2937', borderLeft: '3px solid #22d3d3', borderRadius: '0 10px 10px 0', padding: '16px 20px', fontFamily: 'ui-monospace,monospace', fontSize: '15px', lineHeight: '1.9' }}>
        <div style={{ color: '#eef2f5' }}><span style={{ color: '#22d3d3' }}>proyecto</span> <span style={{ color: '#8b94a3' }}>git:(</span><span style={{ color: '#e0a34a' }}>main</span><span style={{ color: '#8b94a3' }}>) ✗ </span>claude</div>
        <div style={{ color: '#a9e8e8' }}>agente listo en ~/proyecto · contexto del repo cargado</div>
      </div>
    </div>
  );
}

export function PromptDetailDiagram() {
  return (
    <div style={{ width: '1200px', background: '#0a0e14', border: '1px solid #1a2230', borderRadius: '14px', padding: '44px 40px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
      <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'ui-monospace,monospace', fontSize: '22px' }}>
        <span style={{ background: '#123039', color: '#22d3d3', padding: '10px 18px' }}>~/proyecto</span>
        <span style={{ background: '#2a2113', color: '#e0a34a', padding: '10px 18px' }}>⎇ feat/entorno</span>
        <span style={{ background: '#2b1a1a', color: '#e07a7a', padding: '10px 18px' }}>✗ 2 sin commitear</span>
      </div>
      <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '22px', lineHeight: '1.8' }}>
        <span style={{ color: '#22d3d3' }}>➜ </span><span style={{ color: '#eef2f5' }}>git com</span><span style={{ color: '#4c586a' }}>mit -m &quot;feat: warp + zsh&quot;</span>
      </div>
      <div style={{ display: 'flex', gap: '34px', fontFamily: 'ui-monospace,monospace', fontSize: '13px', color: '#54606e', borderTop: '1px solid #1a2230', paddingTop: '20px' }}>
        <span><span style={{ color: '#22d3d3' }}>■</span> carpeta actual</span>
        <span><span style={{ color: '#e0a34a' }}>■</span> rama de git</span>
        <span><span style={{ color: '#e07a7a' }}>■</span> cambios pendientes</span>
        <span><span style={{ color: '#4c586a' }}>■</span> autosugerencia del historial</span>
      </div>
    </div>
  );
}

export function EditorWslDiagram() {
  return (
    <div style={{ width: '1600px', height: '760px', background: '#0a0e14', border: '1px solid #1a2230', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '12px 20px', background: '#0c1219', borderBottom: '1px solid #1a2230', fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#8b94a3' }}>
        <span style={{ color: '#eef2f5' }}>proyecto</span>
        <span>archivo</span>
        <span>editar</span>
        <span>ver</span>
        <span>terminal</span>
      </div>
      <div style={{ flex: '1', display: 'flex', minHeight: '0' }}>
        <div style={{ width: '260px', borderRight: '1px solid #1a2230', padding: '18px 16px', fontFamily: 'ui-monospace,monospace', fontSize: '13px', color: '#8b94a3', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ color: '#54606e', letterSpacing: '.1em', fontSize: '11px' }}>EXPLORADOR</div>
          <div style={{ color: '#eef2f5' }}>▾ src</div>
          <div style={{ paddingLeft: '16px' }}>api.js</div>
          <div style={{ paddingLeft: '16px', color: '#22d3d3' }}>index.js</div>
          <div style={{ paddingLeft: '16px' }}>env.config.js</div>
          <div>▸ public</div>
          <div>package.json</div>
          <div>README.md</div>
        </div>
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minWidth: '0' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #1a2230', fontFamily: 'ui-monospace,monospace', fontSize: '13px' }}>
            <div style={{ padding: '12px 20px', color: '#eef2f5', background: '#0c1219', borderRight: '1px solid #1a2230', borderTop: '2px solid #22d3d3' }}>index.js</div>
            <div style={{ padding: '12px 20px', color: '#54606e', borderRight: '1px solid #1a2230' }}>api.js</div>
          </div>
          <div style={{ flex: '1', padding: '22px 26px', fontFamily: 'ui-monospace,monospace', fontSize: '15px', lineHeight: '2', color: '#b6bfca' }}>
            <div><span style={{ color: '#54606e' }}>1</span>  <span style={{ color: '#22d3d3' }}>import</span> {'{ createServer }'} <span style={{ color: '#22d3d3' }}>from</span> <span style={{ color: '#a9e8e8' }}>&quot;./server.js&quot;</span></div>
            <div><span style={{ color: '#54606e' }}>2</span>  <span style={{ color: '#22d3d3' }}>import</span> {'{ env }'} <span style={{ color: '#22d3d3' }}>from</span> <span style={{ color: '#a9e8e8' }}>&quot;./env.config.js&quot;</span></div>
            <div><span style={{ color: '#54606e' }}>3</span></div>
            <div><span style={{ color: '#54606e' }}>4</span>  <span style={{ color: '#22d3d3' }}>const</span> {'app = createServer({ port: env.PORT })'}</div>
            <div><span style={{ color: '#54606e' }}>5</span></div>
            <div><span style={{ color: '#54606e' }}>6</span>  {'app.listen(() => {'}</div>
            <div><span style={{ color: '#54606e' }}>7</span>    console.log(<span style={{ color: '#a9e8e8' }}>{'`escuchando en :${env.PORT}`'}</span>)</div>
            <div><span style={{ color: '#54606e' }}>8</span>  {'})'}</div>
          </div>
          <div style={{ borderTop: '1px solid #1a2230', padding: '16px 26px', fontFamily: 'ui-monospace,monospace', fontSize: '14px', color: '#a9e8e8', background: '#0c1219' }}>
            <div style={{ color: '#54606e', fontSize: '11px', letterSpacing: '.1em', marginBottom: '8px' }}>TERMINAL INTEGRADA — UBUNTU</div>
            <div><span style={{ color: '#22d3d3' }}>➜ </span>node src/index.js</div>
            <div style={{ color: '#b6bfca' }}>escuchando en :3000</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '0', background: '#0c1219', borderTop: '1px solid #1a2230', fontFamily: 'ui-monospace,monospace', fontSize: '13px', color: '#8b94a3' }}>
        <div style={{ background: '#1c6b52', color: '#eafff6', padding: '10px 18px' }}>⇄ WSL: Ubuntu</div>
        <span>⎇ feat/entorno</span>
        <span>JavaScript</span>
        <span>UTF-8</span>
        <span>LF</span>
      </div>
    </div>
  );
}

export function ModelSwapDiagram() {
  return (
    <div style={{ boxSizing: 'border-box', width: '1200px', height: '600px', background: '#0a0e14', border: '1px solid #1a2230', borderRadius: '14px', padding: '48px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '30px' }}>
      <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '13px', letterSpacing: '.16em', color: '#8b94a3' }}>UN AGENTE, VARIOS MODELOS INTERCAMBIABLES</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
        <div style={{ width: '300px', padding: '30px 26px', background: '#0d1c22', border: '1px solid #22d3d3', borderRadius: '12px' }}>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#eef2f5' }}>OpenCode</div>
          <div style={{ fontSize: '15px', color: '#a9e8e8', marginTop: '8px', lineHeight: '1.5' }}>open source · el endpoint se cambia, el flujo no se frena</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: '1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '1px', background: '#22d3d3', opacity: '.6' }}></div>
            <div style={{ flex: '1', padding: '16px 22px', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '700' }}>Codex</span>
              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#54606e' }}>nube</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '1px', background: '#22d3d3', opacity: '.6' }}></div>
            <div style={{ flex: '1', padding: '16px 22px', background: '#0c1219', border: '1px solid #1e2937', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '700' }}>Kimi</span>
              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#54606e' }}>abierto · barato para tareas largas</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '1px', background: '#22d3d3', opacity: '.6' }}></div>
            <div style={{ flex: '1', padding: '16px 22px', background: '#0c1219', border: '1px solid #22d3d3', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#22d3d3' }}>Ollama</span>
              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#8b94a3' }}>local · sin API, sin internet</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '1px', background: '#22d3d3', opacity: '.6' }}></div>
            <div style={{ flex: '1', padding: '16px 22px', background: '#0c1219', border: '1px dashed #2a3a4a', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#8b94a3' }}>cualquier otro endpoint</span>
              <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#54606e' }}>compatible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VerificationDiagram() {
  return (
    <div style={{ width: '1400px', background: '#0a0e14', border: '1px solid #1a2230', borderRadius: '14px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 20px', background: '#0c1219', borderBottom: '1px solid #1a2230' }}>
        <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#2a3a4a' }}></div>
        <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#2a3a4a' }}></div>
        <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: '#2a3a4a' }}></div>
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: '12px', color: '#8b94a3', marginLeft: '14px' }}>silvano@ubuntu: ~</div>
      </div>
      <div style={{ padding: '26px 30px', fontFamily: "ui-monospace,'Courier New',monospace", fontSize: '16px', lineHeight: '2', color: '#b6bfca' }}>
        <div><span style={{ color: '#22d3d3' }}>➜ </span>gentle-ai doctor</div>
        <div style={{ color: '#54606e', marginTop: '6px' }}>verificando ecosistema…</div>
        <div><span style={{ color: '#4ade80' }}>✓</span> Homebrew instalado y en PATH</div>
        <div><span style={{ color: '#4ade80' }}>✓</span> tap Gentleman-Programming confiado</div>
        <div><span style={{ color: '#4ade80' }}>✓</span> gentle-ai v1.4.2</div>
        <div><span style={{ color: '#4ade80' }}>✓</span> Engram — contexto persistente activo</div>
        <div><span style={{ color: '#4ade80' }}>✓</span> GGA — hooks de git instalados</div>
        <div><span style={{ color: '#4ade80' }}>✓</span> credenciales de modelo configuradas</div>
        <div><span style={{ color: '#4ade80' }}>✓</span> shell Zsh detectada</div>
        <div><span style={{ color: '#4ade80' }}>✓</span> Node 22.11.0</div>
        <div style={{ marginTop: '10px' }}><span style={{ color: '#4ade80', fontWeight: '700' }}>Status: healthy</span> <span style={{ color: '#54606e' }}>— 8/8 checks</span></div>
        <div><span style={{ color: '#22d3d3' }}>➜ </span><span style={{ color: '#eef2f5' }}>▌</span></div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// *Block — cada diagrama ya envuelto en <Diagram w={...}>, listas para
// referenciar desde el .mdx como un tag autocontenido sin props entre
// llaves (ese es justo el prop que next-mdx-remote/rsc pierde).
// ─────────────────────────────────────────────────────────────────

export function StackDiagramBlock() {
  return (
    <Diagram w={1200} caption="El stack completo, capa por capa">
      <StackDiagram />
    </Diagram>
  );
}

export function CommandsDiagramBlock() {
  return (
    <Diagram w={1600} caption="Los comandos base, en uso real">
      <CommandsDiagram />
    </Diagram>
  );
}

export function CloneToPublishDiagramBlock() {
  return (
    <Diagram w={1200} caption="De clonar a publicar">
      <CloneToPublishDiagram />
    </Diagram>
  );
}

export function WarpBlocksDiagramBlock() {
  return (
    <Diagram w={1600} caption="Un bloque por comando">
      <WarpBlocksDiagram />
    </Diagram>
  );
}

export function PromptDetailDiagramBlock() {
  return (
    <Diagram w={1200} caption="El prompt, en detalle">
      <PromptDetailDiagram />
    </Diagram>
  );
}

export function EditorWslDiagramBlock() {
  return (
    <Diagram w={1600} caption="El editor conectado a WSL2">
      <EditorWslDiagram />
    </Diagram>
  );
}

export function ModelSwapDiagramBlock() {
  return (
    <Diagram w={1200} caption="Un agente, varios modelos intercambiables">
      <ModelSwapDiagram />
    </Diagram>
  );
}

export function VerificationDiagramBlock() {
  return (
    <Diagram w={1400} caption="Verificación del entorno en un comando">
      <VerificationDiagram />
    </Diagram>
  );
}
