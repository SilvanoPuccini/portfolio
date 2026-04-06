import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PreferencesProvider from "@/components/providers/PreferencesProvider";

export const metadata: Metadata = {
  title: "Silvano Puccini | Full Stack Developer",
  description:
    "Portfolio profesional de Silvano Puccini enfocado en productos web modernos y escalables.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-slate-50 transition-colors duration-300">
        <PreferencesProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </PreferencesProvider>
      </body>
    </html>
  );
}
