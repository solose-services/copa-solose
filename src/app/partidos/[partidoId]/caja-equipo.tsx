"use client";

import Link from "next/link";
import { useState } from "react";
import { urlImagen } from "@/lib/imagen";

export function CajaEquipo({
  equipoId,
  nombre,
  logoUrl,
}: {
  equipoId: string;
  nombre: string;
  logoUrl: string | null;
}) {
  const [fallo, setFallo] = useState(false);
  const url = urlImagen(logoUrl, 200);

  return (
    <Link
      href={`/equipos/${equipoId}`}
      className="flex min-w-0 flex-col items-center gap-2.5 hover:opacity-80"
    >
      <div
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-md font-tit text-3xl sm:h-24 sm:w-24 sm:text-5xl"
        style={{ background: "var(--vino)", color: "var(--amarillo)" }}
      >
        {url && !fallo ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria pegada por el admin
          <img
            src={url}
            alt=""
            referrerPolicy="no-referrer"
            decoding="async"
            className="h-full w-full object-cover"
            onError={() => setFallo(true)}
          />
        ) : (
          nombre.charAt(0).toUpperCase()
        )}
      </div>
      <span className="max-w-full text-center font-tit text-sm uppercase leading-tight tracking-wide text-vino sm:text-lg">
        {nombre}
      </span>
    </Link>
  );
}
