'use client';
import { useRouter } from 'next/navigation';
import { AccesoCliente } from './AccesoCliente';
export function VerifyOrderAccess({ pedidoId }: { pedidoId: string }) {
  const router = useRouter();
  return <AccesoCliente pedidoId={pedidoId} onEntro={() => router.refresh()} />;
}
