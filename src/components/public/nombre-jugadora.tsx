import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function NombreJugadora({
  id,
  nombre,
  fotoUrl = null,
  tono = "azul",
}: {
  id: string;
  nombre: string;
  fotoUrl?: string | null;
  tono?: "azul" | "vino";
}) {
  return (
    <Link href={`/jugadoras/${id}`} className="inline-flex items-center gap-1.5 hover:text-azul">
      <Avatar src={fotoUrl} nombre={nombre} size={20} tono={tono} />
      {nombre}
    </Link>
  );
}
