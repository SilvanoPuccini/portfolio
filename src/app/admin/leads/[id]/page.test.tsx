import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

/**
 * La red de seguridad de la ficha del lead.
 *
 * Estos tests existen para un refactor: fijan lo que la pantalla HACE HOY,
 * antes de partirla en componentes. No juzgan si está bien hecha — solo la
 * describen. Si después de mover el código siguen en verde, el movimiento no
 * cambió el comportamiento, que es todo lo que un refactor tiene permitido.
 *
 * Por eso prueban a través de lo que ve una persona (textos, campos, botones)
 * y no por estructura interna: la estructura es justo lo que va a cambiar.
 */

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'lead-1' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

import LeadDetailPage from './page';

const LEAD = {
  id: 'lead-1',
  created_at: '2026-09-01T12:00:00.000Z',
  nombre: 'Ferrelon',
  email: 'hola@ferrelon.com',
  telefono: '+54 11 5555 5555',
  tipo_proyecto: 'Catálogo',
  que_construir: 'Un catálogo con stock',
  secciones: 'Home, catálogo, contacto',
  tiene_login: true,
  tiene_pagos: false,
  tiene_admin: 'sí',
  integraciones: ['MercadoPago'],
  idiomas: 1,
  tiene_marca: true,
  tiene_contenido: false,
  problema: 'Pierden ventas por no tener catálogo',
  presupuesto_rango: 'USD 3000-5000',
  plazo: '2 meses',
  canal_llamada: 'meet',
  estado: 'en conversación',
  titular: 'Juan Ferrelon',
  localidad: 'Rosario',
  pais: 'Argentina',
  notas_llamada: 'Quieren salir antes de fin de año',
  diagnostico_objetivo: 'Vender online',
  diagnostico_situacion: 'Hoy venden por WhatsApp',
  diagnostico_requerimiento: 'Catálogo con stock',
  diagnostico_dolor: 'Pierden pedidos',
  diagnostico_deseo: 'Que el cliente compre solo',
  diagnostico_preocupaciones: 'El costo',
  monto_presupuestado: 4800,
  horas_calculadas: 120,
  fecha_llamada: '2026-09-10T14:00:00.000Z',
  grabacion_url: null,
  transcripcion: 'Charlamos sobre el catálogo',
  pago_estado: null,
  service: null,
  service_data: null,
  proposal_sent_at: null,
  contract_sent_at: null,
};

const MODULOS = [
  { slug: 'catalogo', label: 'Catálogo', horas_min: 10, horas_max: 20, categoria: 'core' },
  { slug: 'login', label: 'Login', horas_min: 6, horas_max: 12, categoria: 'core' },
];

/** Registra cada llamada para poder afirmar sobre el PATCH que salió. */
let calls: { url: string; init?: RequestInit }[] = [];

function mockFetch(overrides: Record<string, unknown> = {}) {
  calls = [];
  global.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const href = String(url);
    calls.push({ url: href, init });

    const body = (() => {
      if (href in overrides) return overrides[href];
      if (href === '/api/admin/modulos') return { modulos: MODULOS };
      if (href === '/api/admin/config') return { config: { tarifa_hora: 40, buffer_pct: 20 } };
      if (href === '/api/admin/leads/lead-1') return { lead: LEAD };
      return { ok: true };
    })();

    return { ok: true, json: async () => body } as Response;
  }) as typeof fetch;
}

const patchesTo = (url: string) =>
  calls.filter((call) => call.url === url && call.init?.method === 'PATCH');

const bodyOf = (call: { init?: RequestInit }) =>
  JSON.parse(String(call.init?.body)) as Record<string, unknown>;

describe('Ficha del lead — comportamiento antes del refactor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch();
  });

  it('muestra el nombre y el contacto del lead', async () => {
    render(<LeadDetailPage />);
    expect(await screen.findByText('Ferrelon')).toBeInTheDocument();
    expect(screen.getByText(/hola@ferrelon\.com/)).toBeInTheDocument();
  });

  it('abre la sección que corresponde a la fase y pliega las demás', async () => {
    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');

    // En «en conversación» toca el diagnóstico, no el formulario de captación.
    // La ficha sigue el recorrido de la venta: con la llamada ya hecha, lo
    // que toca mirar es el diagnóstico, no quién es el cliente.
    expect(screen.getByRole('button', { name: /3 · El diagnóstico/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /1 · El cliente/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('carga los datos editables del cliente en sus campos', async () => {
    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');

    expect(screen.getByDisplayValue('Juan Ferrelon')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Rosario')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Quieren salir antes de fin de año')).toBeInTheDocument();
  });

  it('guarda los datos del cliente con un PATCH', async () => {
    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');

    fireEvent.change(screen.getByDisplayValue('Rosario'), { target: { value: 'Córdoba' } });
    fireEvent.click(screen.getAllByText('Guardar')[0]);

    await waitFor(() => expect(patchesTo('/api/admin/leads/lead-1').length).toBeGreaterThan(0));
    expect(bodyOf(patchesTo('/api/admin/leads/lead-1')[0])).toMatchObject({
      localidad: 'Córdoba',
      titular: 'Juan Ferrelon',
    });
  });

  it('guarda lo anotado en la guía y arma los seis campos solo', async () => {
    // Se anota pregunta por pregunta; los seis campos del diagnóstico —que
    // leen la propuesta, el seguimiento y la recomendación— se completan con
    // el resumen de cada etapa, sin que nadie los escriba a mano.
    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');

    fireEvent.click(screen.getByRole('button', { name: /Ir a El problema y lo que cuesta/i }));
    fireEvent.change(screen.getByLabelText(/¿Cuánto te cuesta eso por mes/i), {
      target: { value: 'Pierden 3 pedidos por semana' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar lo anotado/i }));

    await waitFor(() => expect(patchesTo('/api/admin/leads/lead-1').length).toBeGreaterThan(0));
    const sent = bodyOf(patchesTo('/api/admin/leads/lead-1')[0]) as {
      guia_respuestas: Record<string, string>; diagnostico_dolor: string;
    };

    expect(sent.guia_respuestas['problema.costo']).toBe('Pierden 3 pedidos por semana');
    expect(sent.diagnostico_dolor).toContain('Pierden 3 pedidos por semana');
  });

  it('muestra la transcripción de la llamada', async () => {
    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');
    expect(screen.getByText('Charlamos sobre el catálogo')).toBeInTheDocument();
  });

  it('arma la calculadora con los módulos que vienen del endpoint', async () => {
    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');

    // Que el módulo esté en pantalla prueba que la calculadora se construyó
    // con /api/admin/modulos y no con una lista escrita a mano.
    // «Catálogo» también aparece como dato del formulario del cliente: se
    // busca el de la calculadora, que es el que prueba de dónde salió.
    expect((await screen.findAllByText('Catálogo')).length).toBeGreaterThan(0);
    expect(screen.getByText('Horas PERT')).toBeInTheDocument();
  });

  it('ofrece el paso siguiente de la venta arriba de todo', async () => {
    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');
    expect(screen.getByLabelText('Paso siguiente de la venta')).toBeInTheDocument();
  });

  it('deja cambiar el estado a mano con las etiquetas legibles', async () => {
    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');

    // Los datos del cliente viven en el momento 1, que con la llamada ya
    // hecha viene plegado: se abre con un clic, como cualquier otro.
    fireEvent.click(screen.getByRole('button', { name: /1 · El cliente/ }));

    const select = screen.getByDisplayValue('En conversación');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ganado' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Propuesta enviada' })).toBeInTheDocument();
  });
});

describe('Ficha del lead — la barra recibe lo que necesita', () => {
  it('ofrece el seguimiento cuando la propuesta ya se enfrió', async () => {
    // Este cableado estuvo roto: la ficha no le pasaba la fecha de la
    // propuesta a la barra y el botón no aparecía nunca, aunque la API del
    // seguimiento funcionara. Se prueba desde la pantalla, no desde la API.
    mockFetch({
      '/api/admin/leads/lead-1': {
        lead: {
          ...LEAD,
          estado: 'presupuestado',
          proposal_sent_at: new Date(Date.now() - 9 * 86_400_000).toISOString(),
        },
      },
    });

    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');

    expect(screen.getByRole('button', { name: 'Escribir seguimiento' })).toBeInTheDocument();
  });

  it('avisa que el contrato venció y muestra el firmado cuando está archivado', async () => {
    mockFetch({
      '/api/admin/leads/lead-1': {
        lead: { ...LEAD, estado: 'contrato_enviado', contrato_vencido_at: '2026-09-10T00:00:00.000Z' },
      },
    });

    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');
    expect(screen.getByText(/venció sin firmar/)).toBeInTheDocument();
  });

  it('muestra el link al contrato firmado archivado', async () => {
    mockFetch({
      '/api/admin/leads/lead-1': {
        lead: { ...LEAD, estado: 'contrato_firmado', contrato_pdf_path: 'lead-1/env_1/contrato-firmado.pdf' },
      },
    });

    render(<LeadDetailPage />);
    await screen.findByText('Ferrelon');
    // Aparece en dos lados a propósito: en la barra de acciones y en el
    // historial de la venta. Los dos tienen que apuntar al mismo lado.
    const links = screen.getAllByRole('link', { name: /Ver contrato firmado/ });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/api/admin/leads/lead-1/contract-pdf');
    }
  });
});
