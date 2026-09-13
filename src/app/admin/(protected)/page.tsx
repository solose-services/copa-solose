import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-4">
      <p>Bienvenida al panel de administración de Copa Solose.</p>
      <Link href="/admin/torneos" className="underline">
        Ir a Torneos
      </Link>
      <Link href="/admin/suspensiones" className="underline">
        Ir a Suspensiones
      </Link>
      <Link href="/admin/avisos" className="underline">
        Ir a Avisos
      </Link>
    </div>
  );
}
