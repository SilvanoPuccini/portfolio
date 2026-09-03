import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import { themeScript } from "@/lib/theme";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Silvano Puccini | Full Stack Developer",
  description:
    "Portfolio editorial de Silvano Puccini enfocado en producto, sistemas web y experiencias premium.",
  metadataBase: new URL("https://silvanopuccini.dev"),
  alternates: {
    languages: {
      es: "/es",
      en: "/en",
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const lang = headersList.get("x-locale") ?? "es";
  // Lo pone el middleware. Sin él, la CSP bloquea este script y la página
  // arrancaría con el tema equivocado hasta que hidrate.
  const nonce = headersList.get("x-nonce") ?? undefined;
  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
      >
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
