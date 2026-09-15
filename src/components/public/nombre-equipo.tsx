import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";

export function NombreEquipo({
  id,
  nombre,
  logoUrl = null,
}: {
  id: string;
  nombre: string;
  logoUrl?: string | null;
}) {
  return (
    <Link href={`/equipos/${id}`} className="inline-flex items-center gap-1.5 underline">
      <Avatar src={logoUrl} nombre={nombre} size={20} />
      {nombre}
    </Link>
  );
}
