"use client";

import { useState } from "react";
import { inicialDe } from "./avatar-helpers";

interface AvatarProps {
  src: string | null;
  nombre: string;
  size?: number;
  tono?: "azul" | "vino" | "vinoSolido";
}

export function Avatar({ src, nombre, size = 24, tono = "azul" }: AvatarProps) {
  const [fallo, setFallo] = useState(false);
  const solido = tono === "vinoSolido";
  const color = tono === "azul" ? "var(--azul)" : "var(--vino)";

  if (!src || fallo) {
    return (
      <span
        aria-hidden="true"
        className="inline-flex flex-none items-center justify-center rounded-full font-tit"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.45,
          background: solido ? "var(--vino)" : `color-mix(in srgb, ${color} 14%, var(--papel))`,
          color: solido ? "var(--amarillo)" : color,
        }}
      >
        {inicialDe(nombre)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- URLs arbitrarias pegadas por el admin, next/image exigiría lista blanca de dominios
    <img
      src={src}
      alt=""
      onError={() => setFallo(true)}
      className="flex-none rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
