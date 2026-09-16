"use client";

import { useState } from "react";

export function CajaEquipo({ nombre, logoUrl }: { nombre: string; logoUrl: string | null }) {
  const [fallo, setFallo] = useState(false);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-md border font-tit text-lg"
        style={{ borderColor: "rgba(244,237,224,.35)", color: "var(--crema)" }}
      >
        {logoUrl && !fallo ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL arbitraria pegada por el admin
          <img
            src={logoUrl}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setFallo(true)}
          />
        ) : (
          nombre.charAt(0).toUpperCase()
        )}
      </div>
      <span
        className="font-mono text-[.62rem] uppercase tracking-wider"
        style={{ color: "rgba(244,237,224,.7)" }}
      >
        {nombre}
      </span>
    </div>
  );
}
