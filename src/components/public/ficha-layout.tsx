import type { ReactNode } from "react";

const ANCHO = "mx-auto w-full max-w-[1160px] px-4 sm:px-6";

export function FichaHero({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--amarillo)",
        color: "var(--vino)",
        borderBottom: "6px solid var(--azul)",
      }}
    >
      <div
        className={`${ANCHO} flex flex-col gap-5 pb-7`}
        style={{ paddingTop: "calc(.75rem + env(safe-area-inset-top))" }}
      >
        {children}
      </div>
    </div>
  );
}

export function FichaCuerpo({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${ANCHO} py-7 ${className}`}>{children}</div>;
}

export function EtiquetaHero({ children }: { children: ReactNode }) {
  return (
    <span className="font-tit text-[.68rem] uppercase tracking-[.12em] text-azul">{children}</span>
  );
}

export function DatoHero({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <EtiquetaHero>{etiqueta}</EtiquetaHero>
      <span className="font-tit text-3xl leading-none text-vino sm:text-4xl">{valor}</span>
    </div>
  );
}
