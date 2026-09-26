'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { carePrice } from '@/content/service-policy';
import { periodPaymentStatus, type AdminCommand, type CareView, type ClientCommand } from '@/lib/care/model';

const inputClass = 'mt-1 w-full rounded border border-outline-ghost/30 bg-transparent p-2 text-text-primary';
const sectionClass = 'surface-panel space-y-4 border border-outline-ghost/20 p-5 sm:p-7';
const stateLabels: Record<string, string> = { offered:'Oferta pendiente', accepted:'Aceptado · pendiente de activación', active:'Activo', cancel_pending:'Baja al fin del período', transfer_requested:'Transferencia solicitada', closed:'Finalizado', pending:'Pendiente de revisión', included:'Dentro del cupo', warranty:'Garantía · sin consumo de cupo', quote_required:'Requiere cotización separada', completed:'Resuelto', paid:'Pagado', due:'Vence hoy', overdue:'Pendiente vencido', upcoming:'Próximo' };

export function CarePanel({ orderId, admin=false, locale='es' }: { orderId: string; admin?: boolean; locale?: 'es' | 'en' }) {
  const endpoint = `/api/${admin ? 'admin/pedidos' : 'pedido'}/${orderId}/cuidado`;
  const [view, setView] = useState<CareView | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState('');
  const retry = useRef<{ serialized: string; body: string } | null>(null);
  const en = locale === 'en';
  const t = (es: string, english: string) => en ? english : es;
  const today = new Date().toISOString().slice(0,10);
  const load = useCallback(async () => {
    setError('');
    try {
      const res = await fetch(endpoint, { cache:'no-store' });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error);
      setView(body); setAccepted(false);
    } catch { setError('No se pudo cargar el cuidado. Actualice la vista o contacte al proveedor. / Unable to load care. Refresh or contact the provider.'); }
  }, [endpoint]);
  useEffect(() => { void load(); }, [load]);

  async function act(command: ClientCommand | AdminCommand) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    const serialized=JSON.stringify(command);
    if (!retry.current || retry.current.serialized !== serialized) retry.current={ serialized, body:JSON.stringify({ requestId:crypto.randomUUID(), expectedVersion:view?.subscription?.version ?? 0, command }) };
    try {
      const response = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:retry.current.body });
      const body = await response.json();
      if (!response.ok) {
        if (response.status < 500) retry.current=null;
        throw new Error(body.error);
      }
      setView(body); retry.current=null; setAccepted(false); setNotice(t('Cambio registrado.','Change recorded.'));
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo guardar. / Could not save.'); }
    finally { setBusy(false); }
  }
  function form(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); return new FormData(event.currentTarget); }
  const sub=view?.subscription;
  const currentPeriods=view?.periods.filter(period=>period.generation===sub?.generation) ?? [];
  const currentRequests=view?.requests.filter(request=>request.generation===sub?.generation) ?? [];
  const lastPeriod=currentPeriods.at(-1);
  const paidCurrent=currentPeriods.some(period=>Boolean(period.paid_at)&&period.starts_on<=today&&period.ends_on>today);
  const canOffer=admin && (!sub || ['offered','accepted','closed'].includes(sub.status) || (sub.status==='active' && !!lastPeriod && lastPeriod.ends_on<today)) && !currentRequests.some(request=>['pending','included','warranty'].includes(request.status)) && !(sub?.source_requested_at && !sub.source_completed_at);
  const label=(value:string)=>en ? value.replaceAll('_',' ') : stateLabels[value] ?? value;

  return <div className="space-y-6 text-text-primary" aria-busy={busy}>
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-ghost/20 pb-4">
      <div><p className="technical-label">{t('Operación del proyecto','Project operations')}</p><h2 className="mt-2 text-2xl">{t('Hosting y cuidado','Hosting and care')}</h2></div>
      <button className="button-secondary" disabled={busy} onClick={()=>void load()}>{t('Actualizar','Refresh')}</button>
    </header>
    <p className="text-sm text-text-secondary">{t('Pagos manuales. Sin débito automático ni suspensión automática por deuda. Dominio e IA/API se pagan por separado.','Manual payments. No automatic debit or debt-based shutdown. Domain and AI/API costs are separate.')}</p>
    {error && <p role="alert" className="border border-red-400/40 p-3 text-red-400">{error}</p>}
    {notice && <p role="status">{notice}</p>}
    {!view && !error && <p role="status">{t('Cargando…','Loading…')}</p>}
    {view && !sub && <p>{t('El proveedor debe registrar la entrega y preparar una oferta para este proyecto firmado. No hay abono ni deuda activa.','The provider must record delivery and prepare an offer for this signed project. No subscription or debt is active.')}</p>}
    {canOffer && <form className={sectionClass} onSubmit={event=>{
      const data=form(event); const amount=String(data.get('amount') ?? '');
      void act({action:'offer',deliveredOn:String(data.get('delivered')),startsOn:String(data.get('start')),inspectionNote:String(data.get('inspection')),...(amount ? {quote:{amountUsd:Number(amount),scope:String(data.get('scope'))}} : {})});
    }}>
      <h3 className="text-lg">{sub?.status==='closed'||sub?.status==='active' ? 'Preparar nuevo acuerdo tras inspección · conserva el historial y requiere nueva aceptación' : 'Preparar oferta · requiere nueva aceptación'}</h3>
      <div className="grid gap-4 sm:grid-cols-2"><label>Entrega real (UTC)<input className={inputClass} type="date" name="delivered" required max={today} /></label><label>Inicio acordado (UTC, al menos entrega + 30 días)<input className={inputClass} type="date" name="start" required min={today} /></label></div>
      <label className="block">Inspección del proyecto y confirmación del estado actual (obligatorio, especialmente tras una pausa)<textarea className={inputClass} name="inspection" required minLength={8} maxLength={2000} /></label>
      <details><summary>Cotización para sistema a medida (no usar en planes estándar)</summary><label>USD por mes<input className={inputClass} name="amount" type="number" min="250" max="100000" /></label><label>Alcance escrito<textarea className={inputClass} name="scope" minLength={8} maxLength={2000} /></label></details>
      <p className="text-sm text-text-secondary">La oferta se calcula desde el proyecto original. Un inicio vencido requiere una oferta nueva; no se activa retroactivamente.</p>
      <button className="button-primary" disabled={busy}>Guardar oferta</button>
    </form>}
    {sub && <>
      <section className={sectionClass}>
        <div className="flex flex-wrap justify-between gap-3"><h3 className="font-mono text-xl">{carePrice(sub.offer,locale)}</h3><span>{label(sub.status)}</span></div>
        <dl className="grid gap-4 text-sm sm:grid-cols-3"><div><dt>{t('Entrega','Delivery')}</dt><dd>{sub.offer.deliveredOn}</dd></div><div><dt>{t('Inicio aceptable','Agreed start')}</dt><dd>{sub.offer.startsOn} UTC</dd></div><div><dt>{t('Cupo por período','Period allowance')}</dt><dd>{sub.offer.requests} {t('solicitudes','requests')} · {sub.offer.minutes} min</dd></div></dl>
        <p>{sub.offer.scope}</p><p className="text-sm">{sub.offer.inspectionNote}</p>
        <details open={sub.status==='offered'}><summary>{t('Condiciones exactas de esta oferta','Exact terms of this offer')} · {sub.offer.version}</summary><div className="mt-3 space-y-3 text-sm leading-6">{sub.offer.terms[locale].map((paragraph)=><p key={paragraph}>{paragraph}</p>)}<p className="break-all font-mono text-xs">{sub.offer.revision}</p></div></details>
        {sub.accepted_at && <p className="text-sm">{t('Aceptado','Accepted')}: {sub.accepted_at}</p>}
        {!admin && sub.status==='offered' && <div className="space-y-3"><label className="flex gap-3"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} /><span>{t('He leído y acepto este precio, cupo, renovación y fecha de inicio.','I have read and accept this price, allowance, renewal and start date.')}</span></label><button className="button-primary" disabled={!accepted||busy} onClick={()=>void act({action:'accept',revision:sub.offer.revision})}>{t('Aceptar este plan y fecha','Accept this plan and date')}</button></div>}
        {admin && sub.status==='accepted' && <button className="button-primary" disabled={busy||sub.offer.startsOn!==today} onClick={()=>void act({action:'activate'})}>Activar hoy según aceptación</button>}
        {admin && sub.status==='active' && <><button className="button-secondary" disabled={busy||lastPeriod?.ends_on!==today||!lastPeriod?.paid_at} onClick={()=>void act({action:'renew'})}>Registrar próximo período hoy (no confirma pago)</button>{lastPeriod&&lastPeriod.ends_on<today&&<p className="text-sm text-text-secondary">La fecha de renovación pasó. No se generan cargos retroactivos: inspeccione el proyecto y prepare un nuevo acuerdo con fecha futura o de hoy.</p>}</>}
        {admin && sub.status==='closed' && <p className="text-sm text-text-secondary">Este abono está cerrado. Si el cliente regresa, inspeccione el proyecto y prepare un nuevo acuerdo; el historial anterior se conserva.</p>}
      </section>
      <section className={sectionClass}><h3 className="text-lg">{t('Períodos y pagos','Periods and payments')}</h3>
        {view?.paymentInstructions && <div className="whitespace-pre-wrap border-l-2 border-brand-primary pl-4 text-sm">{view.paymentInstructions}</div>}
        {!currentPeriods.length && <p>{t('Sin períodos facturados. La aceptación no confirma un pago.','No billed periods. Acceptance does not confirm payment.')}</p>}
        {currentPeriods.map(period=><article key={period.id} className="border-t border-outline-ghost/20 pt-4">
          <p className="font-mono">{period.starts_on} → {period.ends_on} · USD {period.amount_usd}</p><p>{label(periodPaymentStatus(period,today))}{period.payment_reference ? ` · ${period.payment_reference}` : ''}</p>
          <p className="text-xs text-text-secondary">{t('Inicio incluido, fin excluido. Vencimiento de pago: inicio.','Start inclusive, end exclusive. Payment due: period start.')}</p>
          {admin && !period.paid_at && <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={event=>{ const data=form(event); void act({action:'pay',periodId:period.id,amountUsd:period.amount_usd,reference:String(data.get('reference')),paidOn:String(data.get('paidOn'))}); }}><label>Referencia bancaria única<input className={inputClass} name="reference" required minLength={4} maxLength={160} /></label><label>Fecha de recepción real<input className={inputClass} name="paidOn" type="date" required max={today} /></label><label className="sm:col-span-2"><input type="checkbox" required /> Verifiqué en la cuenta la recepción íntegra de USD {period.amount_usd}; no es solo un comprobante.</label><button className="button-primary" disabled={busy}>Confirmar pago recibido</button></form>}
          {!admin && !period.paid_at && <p className="mt-2 text-sm">{t('Solicite al proveedor las instrucciones vigentes para transferir e indique el inicio del período como referencia. Solo el proveedor confirma la recepción.','Ask the provider for current transfer instructions and reference the period start. Only the provider confirms receipt.')}</p>}
        </article>)}
      </section>
      <section className={sectionClass}><h3 className="text-lg">{t('Solicitudes y cupo','Requests and allowance')}</h3>
        <p className="text-sm text-text-secondary">{t('La revisión reserva minutos dentro del cupo; fuera de alcance se cotiza por separado. Defectos cubiertos por la garantía no consumen el cupo.','Review reserves minutes within the allowance; out-of-scope work is quoted separately. Covered warranty defects do not consume allowance.')}</p>
        {!admin && !paidCurrent && <p className="text-sm">{t('Los cambios de cuidado se habilitan con el período pagado. Puede reportar defectos para revisión de garantía.','Care changes unlock once the current period is paid. You can report defects for warranty review.')}</p>}
        {!admin && sub.status!=='closed' && <form className="space-y-3" onSubmit={event=>{const data=form(event); void act({action:'request',kind:data.get('kind') as 'small'|'defect',description:String(data.get('description'))});}}><label>{t('Tipo','Type')}<select className={inputClass} name="kind" defaultValue={paidCurrent ? 'small' : 'defect'}><option value="small" disabled={!paidCurrent}>{t('Cambio pequeño','Small change')}</option><option value="defect">{t('Posible defecto (requiere revisión)','Possible defect (requires review)')}</option></select></label><label className="block">{t('Detalle','Details')}<textarea className={inputClass} name="description" required minLength={8} maxLength={2000} /></label><button className="button-primary" disabled={busy}>{t('Enviar solicitud','Submit request')}</button></form>}
        {currentRequests.map(request=><article key={request.id} className="space-y-2 border-t border-outline-ghost/20 pt-4"><p className="whitespace-pre-wrap">{request.description}</p><p className="text-sm">{label(request.status)} · {request.minutes} min</p>{request.note&&<p className="text-sm">{request.note}</p>}
          {admin && request.status!=='completed' && <form className="grid gap-3 sm:grid-cols-2" onSubmit={event=>{const data=form(event); void act({action:'resolve',requestId:request.id,resolution:data.get('resolution') as 'included'|'warranty'|'quote_required'|'completed',minutes:Number(data.get('minutes')),note:String(data.get('note'))});}}><label>Decisión<select className={inputClass} name="resolution"><option value="included">Reservar dentro del cupo</option><option value="warranty">Defecto cubierto por garantía</option><option value="quote_required">Requiere cotización separada</option><option value="completed">Finalizar con esfuerzo real</option></select></label><label>Minutos estimados / reales<input className={inputClass} name="minutes" type="number" min="0" max="180" required defaultValue={request.minutes} /></label><label className="sm:col-span-2">Resolución o próximo paso<textarea className={inputClass} name="note" required minLength={8} maxLength={2000} /></label><button className="button-secondary" disabled={busy}>Registrar revisión</button></form>}
        </article>)}
      </section>
      <section className={sectionClass}><h3 className="text-lg">{t('Código fuente y salida','Source code and exit')}</h3><p className="text-sm">{t('Pedir el código no cancela el hosting. La baja evita nuevas renovaciones y requiere coordinar la transferencia; no elimina ni apaga el proyecto.','Requesting source does not cancel hosting. Cancellation stops renewals and requires an arranged transfer; it does not delete or shut down the project.')}</p>
        {sub.cancel_on&&<p>{t('Fin del período / fecha mínima de salida','Period end / earliest exit date')}: {sub.cancel_on}</p>}{sub.exit_note&&<p>{sub.exit_note}</p>}
        {sub.source_requested_at&&<p>{t('Código solicitado','Source requested')}: {sub.source_requested_at} · {sub.source_completed_at ? t('Entrega registrada','Delivery recorded') : t('Pendiente','Pending')}{sub.source_note ? ` · ${sub.source_note}`:''}</p>}
        {!admin&&<form className="space-y-3" onSubmit={event=>{const data=form(event);void act({action:data.get('action') as 'source'|'transfer',note:String(data.get('note'))});}}><label>{t('Acción','Action')}<select className={inputClass} name="action"><option value="source">{t('Solicitar copia del código','Request source copy')}</option>{sub.status!=='closed'&&<option value="transfer">{t('Solicitar transferencia y detener renovación','Request transfer and stop renewal')}</option>}</select></label><label className="block">{t('Detalle para coordinar','Coordination details')}<textarea className={inputClass} name="note" required minLength={8} maxLength={2000} /></label><button className="button-secondary" disabled={busy}>{t('Registrar solicitud','Record request')}</button></form>}
        {!admin&&!['closed','cancel_pending','transfer_requested'].includes(sub.status)&&<button className="button-secondary" disabled={busy} onClick={()=>{if(window.confirm(t('¿Detener renovaciones y coordinar la salida al fin del período?','Stop renewal and arrange transfer at the period end?'))) void act({action:'cancel'});}}>{t('Solicitar baja al fin del período','Cancel at period end')}</button>}
        {admin&&<form className="space-y-3" onSubmit={event=>{const data=form(event);void act({action:data.get('action') as 'close'|'source_done',note:String(data.get('note'))});}}><label>Confirmación operativa<select className={inputClass} name="action"><option value="source_done">Código entregado de forma segura</option><option value="close">Transferencia acordada completada (sin apagar/eliminar)</option></select></label><label className="block">Referencia de entrega y coordinación<textarea className={inputClass} name="note" required minLength={8} maxLength={2000} /></label><label><input type="checkbox" required /> Verifiqué la entrega y coordinación con el cliente.</label><button className="button-secondary" disabled={busy}>Registrar finalización</button></form>}
      </section>
      {!!view?.agreements.length && <section className={sectionClass}><h3 className="text-lg">{t('Acuerdos anteriores (solo lectura)','Previous agreements (read only)')}</h3><p className="text-sm text-text-secondary">{t('Los importes y solicitudes anteriores no forman parte del cupo actual. Un acuerdo nuevo nunca crea cargos retroactivos.','Previous payments and requests do not count toward the current allowance. A new agreement never creates retroactive charges.')}</p>{view.agreements.map(agreement=><details key={agreement.generation}><summary>{t('Acuerdo','Agreement')} {agreement.generation} · {carePrice(agreement.subscription.offer,locale)} · {label(agreement.subscription.status)}</summary><div className="mt-3 space-y-2 text-sm"><p>{t('Aceptado','Accepted')}: {agreement.subscription.accepted_at ?? '—'} · {t('Archivado','Archived')}: {agreement.archived_at}</p><p className="break-all font-mono text-xs">{agreement.subscription.offer.revision}</p>{view.periods.filter(period=>period.generation===agreement.generation).map(period=><p key={period.id}>{period.starts_on} → {period.ends_on} · USD {period.amount_usd} · {period.paid_at ? label('paid') : t('Sin pago registrado','No payment recorded')}</p>)}{view.requests.filter(request=>request.generation===agreement.generation).map(request=><p key={request.id} className="whitespace-pre-wrap">{label(request.status)} · {request.description}</p>)}</div></details>)}</section>}
    </>}
  </div>;
}
