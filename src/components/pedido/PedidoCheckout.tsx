'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';


/**
 * Los tres datos que hacen falta para firmar. Nada más.
 *
 * Tres y no más: el nombre y el mail van escritos en el contrato, y el país
 * define la ley que aplica y la moneda en la que se cobra. Todo lo demás se
 * pide después de firmar, cuando ya hay una venta y no un visitante.
 *
 * Antes este mismo componente se transformaba en el contrato sin cambiar de
 * dirección. El cliente dejaba sus datos, aparecía el contrato, y la URL
 * seguía siendo la misma: tocar «atrás» lo sacaba del pedido entero porque
 * para el navegador nunca había avanzado. Ahora navega al paso de la firma,
 * que tiene su propia dirección, y volver atrás lo trae de vuelta acá a
 * corregir lo que haya escrito mal.
 */

const PAISES = ['Argentina', 'Chile', 'Uruguay', 'México', 'España', 'Otro'];

export function PedidoCheckout({ pedidoId }: { pedidoId: string }) {
  const [datos, setDatos] = useState({ nombre: '', email: '', pais: PAISES[0] });
  const [demorado, setDemorado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const cambiar = (campo: keyof typeof datos) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setDatos((actuales) => ({ ...actuales, [campo]: event.target.value }));

  async function preparar(event: React.FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setError('');

    try {
      const res = await fetch(`/api/pedido/${pedidoId}/contrato`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const body = await res.json() as {
        token?: string; signingUrl?: string; error?: string; demorado?: boolean; modo?: string;
      };

      // 202: la venta quedó registrada pero el contrato no se pudo crear
      // ahora. Se le avisa que llega por correo en vez de mostrarle un error
      // a alguien que acaba de decidir comprar.
      if (body.demorado) {
        setDemorado(true);
        return;
      }

      // La venta quedó creada, con contrato propio o de Documenso. El paso de
      // la firma decide cuál mostrar: acá solo hay que llevarlo hasta ahí.
      if (body.modo === 'propia' || (res.ok && body.token)) {
        // `assign` y no `replace`: atrás tiene que devolverlo a esta pantalla
        // si escribió mal su nombre y lo quiere corregir.
        window.location.assign(`${window.location.pathname}/firmar`);
        return;
      }

      setError(body.error ?? 'No se pudo preparar el contrato. Probá de nuevo en un momento.');
    } catch {
      setError('Se cortó la conexión. Nada se perdió: probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (demorado) {
    return (
      <div className="surface-panel border border-brand-primary/25 px-6 py-8">
        <h2 className="section-title-sm">Tu pedido quedó registrado</h2>
        <p className="mt-3 max-w-xl text-base leading-7 text-text-secondary">
          El contrato tuvo una demora técnica de mi lado. Te lo mando por correo en unos minutos,
          al mismo mail que acabás de dejar. No hace falta que hagas nada.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={preparar} className="surface-panel border border-outline-ghost/10 px-5 py-6 sm:px-8 sm:py-8">
      <h2 className="section-title-sm">Tus datos para el contrato</h2>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        Van escritos en el contrato que firmás acá abajo. Firmar no dispara ningún cobro.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="technical-label">Nombre y apellido</span>
          <input type="text" required className="form-field mt-2" value={datos.nombre} onChange={cambiar('nombre')} />
        </label>

        <label className="block">
          <span className="technical-label">Email</span>
          <input type="email" required className="form-field mt-2" value={datos.email} onChange={cambiar('email')} />
        </label>

        <label className="block sm:col-span-2">
          <span className="technical-label">País</span>
          <select className="form-field mt-2" value={datos.pais} onChange={cambiar('pais')}>
            {PAISES.map((pais) => <option key={pais} value={pais}>{pais}</option>)}
          </select>
          <span className="mt-1.5 block text-xs leading-5 text-text-tertiary">
            Define la ley que aplica al contrato y la moneda en la que se te cobra.
          </span>
        </label>
      </div>

      {error && <p role="alert" className="mt-4 text-sm leading-6 text-red-400">{error}</p>}

      <button type="submit" className="button-primary mt-6 gap-2" disabled={enviando}>
        <span>{enviando ? 'Preparando el contrato…' : 'Ver el contrato y firmar'}</span>
        {!enviando && <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />}
      </button>
    </form>
  );
}
