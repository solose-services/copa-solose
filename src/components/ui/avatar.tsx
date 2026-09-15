"use client";

import { useState } from "react";
import { inicialDe } from "./avatar-helpers";

interface AvatarProps {
  src: string | null;
  nombre: string;
  size?: number;
}

export function Avatar({ src, nombre, size = 24 }: AvatarProps) {
  const [fallo, setFallo] = useState(false);

  if (!src || fallo) {
    return (
      <span
        className="inline-flex flex-none items-center justify-center rounded-full font-mono font-medium"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.45,
          background: "color-mix(in srgb, var(--azul) 14%, var(--papel))",
          color: "var(--azul)",
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
