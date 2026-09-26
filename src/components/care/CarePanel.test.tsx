import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { CarePanel } from './CarePanel';
import { buildCareOffer } from '@/lib/care/model';
const offer = { ...buildCareOffer('landing','2026-10-31','2026-09-30'), revision:'a'.repeat(64) };
beforeEach(() => { vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>({ subscription:{order_id:'x',version:1,generation:1,status:'offered',offer},agreements:[],periods:[],requests:[] })})); });
it('requires explicit acceptance and posts the exact revision, never a client price', async () => {
 render(<CarePanel orderId="x" locale="es" />);
 const button=await screen.findByRole('button',{name:'Aceptar este plan y fecha'});
 expect(button).toBeDisabled();
 fireEvent.click(screen.getByLabelText(/He leído/)); fireEvent.click(button);
 await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));
 const body=JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string);
 expect(body.command).toEqual({action:'accept',revision:offer.revision});
 expect(screen.queryByRole('button',{name:'Confirmar pago recibido'})).not.toBeInTheDocument();
});
it('shows a recoverable loading failure rather than blank activation controls', async () => {
 vi.mocked(fetch).mockRejectedValue(new Error('offline'));
 render(<CarePanel orderId="x" locale="es" />);
 expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo');
 expect(screen.getByRole('button',{name:'Actualizar'})).toBeInTheDocument();
});
it('offers a new inspected agreement after closure while showing prior generations read only', async () => {
 vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>({subscription:{order_id:'x',version:7,generation:2,status:'closed',offer},agreements:[{generation:1,archived_at:'2026-09-01T00:00:00Z',subscription:{order_id:'x',version:5,generation:1,status:'closed',offer,accepted_at:'2026-08-01T00:00:00Z'}}],periods:[{id:'old',generation:1,ordinal:0,starts_on:'2026-08-01',ends_on:'2026-09-01',amount_usd:40,paid_at:'2026-08-01T00:00:00Z'}],requests:[]})} as Response);
 render(<CarePanel orderId="x" admin />);
 expect(await screen.findByText(/Preparar nuevo acuerdo tras inspección/)).toBeInTheDocument();
 expect(screen.getByText(/Acuerdos anteriores/)).toBeInTheDocument();
 expect(screen.getByText(/Los importes y solicitudes anteriores/)).toBeInTheDocument();
 expect(screen.queryByRole('button',{name:'Confirmar pago recibido'})).not.toBeInTheDocument();
});
it('does not unlock current small-change requests using an older paid period', async () => {
 vi.mocked(fetch).mockResolvedValue({ok:true,json:async()=>({subscription:{order_id:'x',version:8,generation:2,status:'active',offer},agreements:[],periods:[{id:'old',generation:1,ordinal:0,starts_on:'2020-01-01',ends_on:'2090-01-01',amount_usd:40,paid_at:'2020-01-01T00:00:00Z'},{id:'new',generation:2,ordinal:1,starts_on:'2020-01-01',ends_on:'2090-01-01',amount_usd:40,paid_at:null}],requests:[]})} as Response);
 render(<CarePanel orderId="x" locale="es" />);
 expect(await screen.findByText(/Los cambios de cuidado se habilitan/)).toBeInTheDocument();
 expect(screen.getByRole('option',{name:'Cambio pequeño'})).toBeDisabled();
});
