"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav({ torneoId }: { torneoId: string }) {
  const pathname = usePathname();

  const enlaces = [
    { href: "/", etiqueta: "Inicio" },
    { href: `/torneos/${torneoId}/calendario`, etiqueta: "Calendario" },
    { href: `/torneos/${torneoId}/posiciones`, etiqueta: "Posiciones" },
    { href: `/torneos/${torneoId}/goleadoras`, etiqueta: "Goleadoras" },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 mx-auto flex max-w-[1160px] items-center justify-around border-t border-linea bg-crema px-2"
      style={{ paddingBottom: "calc(.5rem + env(safe-area-inset-bottom))", paddingTop: ".5rem" }}
    >
      {enlaces.map((enlace) => {
        const activo = pathname === enlace.href;
        return (
          <Link
            key={enlace.href}
            href={enlace.href}
            className={
              activo
                ? "font-mono text-[.62rem] font-medium uppercase tracking-wider text-azul"
                : "font-mono text-[.62rem] uppercase tracking-wider text-tinta-2"
            }
          >
            {enlace.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
