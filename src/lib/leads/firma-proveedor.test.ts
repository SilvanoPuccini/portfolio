import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ getSupabaseAdmin: vi.fn() }));

import { getSupabaseAdmin } from '@/lib/supabase';
import { firmaDelProveedor, olvidarFirmaDelProveedor, RUTA_FIRMA_PROVEEDOR } from './firma-proveedor';

/**
 * La firma del Proveedor, impresa en todos los contratos.
 *
 * El generador del PDF sabía dibujarla, pero en producción nadie se la pasaba:
 * solo la cargaba un test, desde la carpeta de Descargas. Todos los contratos
 * salían con un renglón vacío donde tenía que estar la firma.
 */

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);

function storage(resultado: { data: Blob | null; error: unknown }) {
  const download = vi.fn().mockResolvedValue(resultado);
  const from = vi.fn().mockReturnValue({ download });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ storage: { from } } as never);
  return { download, from };
}

beforeEach(() => {
  olvidarFirmaDelProveedor();
  delete process.env.FIRMA_PROVEEDOR_PNG_B64;
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe('firmaDelProveedor', () => {
  it('la trae del Storage privado de contratos', async () => {
    const { from, download } = storage({ data: new Blob([PNG]), error: null });

    const firma = await firmaDelProveedor();

    expect(from).toHaveBeenCalledWith('contratos');
    expect(download).toHaveBeenCalledWith(RUTA_FIRMA_PROVEEDOR);
    expect(firma?.equals(PNG)).toBe(true);
  });

  it('prefiere la variable de entorno, sin ir a la red', async () => {
    process.env.FIRMA_PROVEEDOR_PNG_B64 = PNG.toString('base64');
    const { download } = storage({ data: null, error: { message: 'no' } });

    const firma = await firmaDelProveedor();

    expect(firma?.equals(PNG)).toBe(true);
    expect(download).not.toHaveBeenCalled();
  });

  it('una vez encontrada no la vuelve a bajar en cada firma', async () => {
    const { download } = storage({ data: new Blob([PNG]), error: null });

    await firmaDelProveedor();
    await firmaDelProveedor();

    expect(download).toHaveBeenCalledTimes(1);
  });

  it('si no está, avisa fuerte y no tira abajo el contrato', async () => {
    storage({ data: null, error: { message: 'Object not found' } });

    const firma = await firmaDelProveedor();

    expect(firma).toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('firma del Proveedor'), expect.anything());
  });

  it('no se queda con el fallo: la próxima vez la vuelve a buscar', async () => {
    const { download } = storage({ data: null, error: { message: 'caído' } });
    await firmaDelProveedor();

    download.mockResolvedValue({ data: new Blob([PNG]), error: null });
    const firma = await firmaDelProveedor();

    expect(firma?.equals(PNG)).toBe(true);
  });

  it('rechaza lo que no es una imagen PNG o JPG', async () => {
    storage({ data: new Blob([Buffer.from('<script>alert(1)</script>')]), error: null });

    expect(await firmaDelProveedor()).toBeUndefined();
  });
});
