"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function BottomNav({ torneoId }: { torneoId: string | null }) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = [
    { href: "/", etiqueta: "Inicio", habilitado: true },
    {
      href: torneoId ? `/torneos/${torneoId}/calendario` : "",
      etiqueta: "Calendario",
      habilitado: Boolean(torneoId),
    },
    {
      href: torneoId ? `/torneos/${torneoId}/posiciones` : "",
      etiqueta: "Posiciones",
      habilitado: Boolean(torneoId),
    },
    {
      href: torneoId ? `/torneos/${torneoId}/goleadoras` : "",
      etiqueta: "Goleadoras",
      habilitado: Boolean(torneoId),
    },
  ];

  const enlacesMenu = torneoId
    ? [
        { href: `/torneos/${torneoId}/suspendidas`, etiqueta: "Suspendidas" },
        { href: `/torneos/${torneoId}/reglamento`, etiqueta: "Reglamento" },
      ]
    : [];

  const menuActivo = enlacesMenu.some((enlace) => pathname === enlace.href);

  return (
    <>
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-10"
          style={{ background: "rgba(36,29,20,.35)" }}
        />
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[1160px] items-center justify-around border-t border-linea bg-crema px-2"
        style={{ paddingBottom: "calc(.5rem + env(safe-area-inset-bottom))", paddingTop: ".5rem" }}
      >
        {enlaces.map((enlace) => {
          const activo = enlace.habilitado && pathname === enlace.href;
          return enlace.habilitado ? (
            <Link
              key={enlace.etiqueta}
              href={enlace.href}
              className={
                activo
                  ? "font-mono text-[.62rem] font-medium uppercase tracking-wider text-azul"
                  : "font-mono text-[.62rem] uppercase tracking-wider text-tinta-2"
              }
            >
              {enlace.etiqueta}
            </Link>
          ) : (
            <span
              key={enlace.etiqueta}
              aria-disabled="true"
              className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-3"
            >
              {enlace.etiqueta}
            </span>
          );
        })}

        <div className="relative flex items-center">
          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            disabled={!torneoId}
            aria-label="Más opciones"
            className={
              menuAbierto || menuActivo
                ? "text-azul disabled:text-tinta-3"
                : "text-tinta-2 disabled:text-tinta-3"
            }
          >
            {menuAbierto ? (
              <X size={18} strokeWidth={1.7} />
            ) : (
              <Menu size={18} strokeWidth={1.7} />
            )}
          </button>

          {menuAbierto && enlacesMenu.length > 0 && (
            <div className="absolute bottom-full right-0 z-20 mb-3 flex flex-col overflow-hidden rounded-md border border-linea bg-papel shadow-lg">
              {enlacesMenu.map((enlace) => {
                const activo = pathname === enlace.href;
                return (
                  <Link
                    key={enlace.href}
                    href={enlace.href}
                    onClick={() => setMenuAbierto(false)}
                    className={
                      activo
                        ? "whitespace-nowrap px-4 py-2.5 text-sm font-medium text-azul"
                        : "whitespace-nowrap px-4 py-2.5 text-sm text-tinta hover:text-azul"
                    }
                  >
                    {enlace.etiqueta}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
