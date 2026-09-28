import type { Metadata } from 'next';
import BrumaDemo from '@/components/showcase/BrumaDemo';
import { isValidLocale } from '@/lib/i18n';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Bruma | Illustrative design demo',
  description: 'Fictional café design example. No real orders, bookings or customer data.',
  robots: { index: false, follow: false },
};

export default async function BrumaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return <main id="main-content" lang={locale} className="mx-auto max-w-[1440px] p-3 sm:p-6"><BrumaDemo locale={locale} /></main>;
}
