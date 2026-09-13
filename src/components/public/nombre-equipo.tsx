import Link from "next/link";

export function NombreEquipo({ id, nombre }: { id: string; nombre: string }) {
  return (
    <Link href={`/equipos/${id}`} className="underline">
      {nombre}
    </Link>
  );
}
