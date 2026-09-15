import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function NombreJugadora({
  id,
  nombre,
  fotoUrl = null,
}: {
  id: string;
  nombre: string;
  fotoUrl?: string | null;
}) {
  return (
    <Link href={`/jugadoras/${id}`} className="inline-flex items-center gap-1.5 underline">
      <Avatar src={fotoUrl} nombre={nombre} size={20} />
      {nombre}
    </Link>
  );
}
