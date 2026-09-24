import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function NombreEquipo({
  id,
  nombre,
  logoUrl = null,
  tono = "azul",
}: {
  id: string;
  nombre: string;
  logoUrl?: string | null;
  tono?: "azul" | "vino" | "vinoSolido";
}) {
  return (
    <Link href={`/equipos/${id}`} className="inline-flex items-center gap-1.5 hover:text-azul">
      <Avatar src={logoUrl} nombre={nombre} size={20} tono={tono} />
      {nombre}
    </Link>
  );
}
