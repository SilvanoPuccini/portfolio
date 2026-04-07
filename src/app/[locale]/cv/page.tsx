import { redirect } from "next/navigation";
import { resolveLocale } from "@/lib/i18n";

export default async function LocalizedCvPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const currentLocale = resolveLocale(locale);

  redirect(`/${currentLocale}/about#cv`);
}
