'use client';
import { useEffect, useState } from 'react';
import { CarePanel } from './CarePanel';
export function LeadCare({leadId}:{leadId:string}) {
  const [orders,setOrders]=useState<{id:string;paquete:string;firmado_at:string|null}[]>([]);
  const [selected,setSelected]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{
    let active=true;
    fetch(`/api/admin/leads/${leadId}/cuidado`).then(async response=>{
      if(!response.ok) throw new Error('No se pudieron cargar los proyectos.');
      const data=await response.json();
      if(active){setOrders(data.orders);setSelected(data.orders[0]?.id??'');}
    }).catch(()=>{if(active)setError('No se pudieron cargar los proyectos de cuidado.');});
    return ()=>{active=false;};
  },[leadId]);
  return <section className="my-8 space-y-4"><h2 className="text-xl">5 · Hosting y cuidado</h2>{error&&<p role="alert">{error}</p>}
    {!orders.length&&!error&&<p>Sin pedido asociado. Para un cliente existente, vincule y revise su proyecto firmado antes de ofrecer cuidado; no cree una compra de importe cero.</p>}
    {orders.length>0&&<><label>Proyecto asociado<select className="ml-3 rounded border p-2" value={selected} onChange={event=>setSelected(event.target.value)}>{orders.map(order=><option key={order.id} value={order.id}>{order.paquete} · {order.id.slice(0,8)}{!order.firmado_at?' · sin firma':''}</option>)}</select></label><a className="ml-4 underline" href={`/es/pedido/${selected}/cuidado`} target="_blank" rel="noreferrer">Abrir acceso del cliente</a>{selected&&<CarePanel key={selected} orderId={selected} admin />}</>}
  </section>;
}
