import { cookies } from 'next/headers';
import { CarePanel } from '@/components/care/CarePanel';
import { VerifyOrderAccess } from '@/components/pedido/VerifyOrderAccess';
import { COOKIE_VERIFICADO, tieneVerificacion } from '@/lib/leads/acceso-cliente';
import { resolveLocale } from '@/lib/i18n';
export const dynamic='force-dynamic';
export const metadata={title:'Hosting y cuidado',robots:{index:false,follow:false}};
export default async function CarePage({params}:{params:Promise<{locale:string;id:string}>}) {
  const {id,locale}=await params;
  const verified=tieneVerificacion((await cookies()).get(COOKIE_VERIFICADO)?.value,id);
  return <main className="site-container max-w-4xl py-16"><a className="mb-6 inline-block underline" href={`/${locale}/pedido/${id}`}>{locale==='en'?'Back to order':'Volver al pedido'}</a>{verified?<CarePanel orderId={id} locale={resolveLocale(locale) as 'es'|'en'} />:<VerifyOrderAccess pedidoId={id}/>}</main>;
}
