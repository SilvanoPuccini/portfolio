import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { resolveLocale } from '@/lib/i18n';

/** Compatibility route; the rendered demo lives outside the portfolio contact shell. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function BrumaRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/demo/${resolveLocale(locale)}/bruma`);
}
