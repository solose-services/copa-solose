"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Users, CalendarDays, ListOrdered, Trophy, Menu, X } from "lucide-react";

export function BottomNav({ torneoId }: { torneoId: string | null }) {
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const enlaces = [
    { href: "/", etiqueta: "Inicio", Icono: Home, habilitado: true },
    {
      href: torneoId ? `/torneos/${torneoId}/equipos` : "",
      etiqueta: "Equipos",
      Icono: Users,
      habilitado: Boolean(torneoId),
    },
    {
      href: torneoId ? `/torneos/${torneoId}/calendario` : "",
      etiqueta: "Calendario",
      Icono: CalendarDays,
      habilitado: Boolean(torneoId),
    },
    {
      href: torneoId ? `/torneos/${torneoId}/posiciones` : "",
      etiqueta: "Posiciones",
      Icono: ListOrdered,
      habilitado: Boolean(torneoId),
    },
    {
      href: torneoId ? `/torneos/${torneoId}/goleadoras` : "",
      etiqueta: "Goleadoras",
      Icono: Trophy,
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
        className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[1160px] items-stretch justify-around border-t border-linea bg-crema px-1"
        style={{ paddingBottom: "calc(.4rem + env(safe-area-inset-bottom))", paddingTop: ".35rem" }}
      >
        {enlaces.map((enlace) => {
          const activo = enlace.habilitado && pathname === enlace.href;
          const color = activo ? "text-azul" : enlace.habilitado ? "text-tinta-2" : "text-tinta-3";
          const contenido = (
            <>
              <enlace.Icono size={24} strokeWidth={activo ? 2.1 : 1.7} />
              <span className="w-full truncate text-center font-mono text-[.56rem] font-medium uppercase">
                {enlace.etiqueta}
              </span>
            </>
          );
          return enlace.habilitado ? (
            <Link
              key={enlace.etiqueta}
              href={enlace.href}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-2 ${color}`}
            >
              {contenido}
            </Link>
          ) : (
            <span
              key={enlace.etiqueta}
              aria-disabled="true"
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-0.5 py-2 ${color}`}
            >
              {contenido}
            </span>
          );
        })}

        <div className="relative flex min-w-0 flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            disabled={!torneoId}
            aria-label="Más opciones"
            className={
              menuAbierto || menuActivo
                ? "flex w-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 text-azul disabled:text-tinta-3"
                : "flex w-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 py-2 text-tinta-2 disabled:text-tinta-3"
            }
          >
            {menuAbierto ? (
              <X size={24} strokeWidth={1.9} />
            ) : (
              <Menu size={24} strokeWidth={1.7} />
            )}
            <span className="w-full truncate text-center font-mono text-[.56rem] font-medium uppercase">
              Más
            </span>
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
                        ? "whitespace-nowrap px-4 py-3 text-sm font-medium text-azul"
                        : "whitespace-nowrap px-4 py-3 text-sm text-tinta hover:text-azul"
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
