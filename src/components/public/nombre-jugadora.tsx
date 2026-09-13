import Link from "next/link";

export function NombreJugadora({ id, nombre }: { id: string; nombre: string }) {
  return (
    <Link href={`/jugadoras/${id}`} className="underline">
      {nombre}
    </Link>
  );
}
