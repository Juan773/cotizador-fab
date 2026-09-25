import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navegacion from "@/components/Navegacion";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cotizador · Spacio Home",
  description: "Cotizaciones de diseño integral de Muebles Spacio Home",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Navegacion />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </body>
    </html>
  );
}
