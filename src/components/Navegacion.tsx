"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  { href: "/", texto: "Nueva cotización", corto: "Nueva" },
  { href: "/cotizaciones", texto: "Historial", corto: "Historial" },
  { href: "/carta-garantia", texto: "Carta de garantía", corto: "Garantía" },
];

export default function Navegacion() {
  const ruta = usePathname();
  const activo = (href: string) => (href === "/" ? ruta === "/" : ruta.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-stone-800 bg-stone-950 text-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Spacio Home" width={92} height={36} priority className="h-8 w-auto" />
          <span className="hidden text-sm text-stone-400 sm:inline">Cotizador</span>
        </Link>
        <nav className="flex gap-1">
          {enlaces.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                activo(e.href) ? "bg-white text-stone-950" : "text-stone-300 hover:bg-stone-800 hover:text-white"
              }`}
            >
              <span className="sm:hidden">{e.corto}</span>
              <span className="hidden sm:inline">{e.texto}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
