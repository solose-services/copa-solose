"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function EnlaceNav({
  href,
  etiqueta,
  activo,
}: {
  href: string;
  etiqueta: string;
  activo: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        activo
          ? "border-b-2 border-azul pb-1 font-mono text-[.68rem] uppercase tracking-wider text-azul"
          : "border-b-2 border-transparent pb-1 font-mono text-[.68rem] uppercase tracking-wider text-tinta-2 hover:text-tinta-2"
      }
    >
      {etiqueta}
    </Link>
  );
}

export function TorneoNav({ torneoId }: { torneoId: string }) {
  const pathname = usePathname();

  const secundarios = [
    { href: `/torneos/${torneoId}/suspendidas`, etiqueta: "Suspendidas" },
    { href: `/torneos/${torneoId}/reglamento`, etiqueta: "Reglamento" },
  ];

  return (
    <nav className="flex gap-5 overflow-x-auto">
      {secundarios.map((enlace) => (
        <EnlaceNav key={enlace.href} {...enlace} activo={pathname === enlace.href} />
      ))}
    </nav>
  );
}
