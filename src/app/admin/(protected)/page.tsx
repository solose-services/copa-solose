import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-tinta-2">Bienvenida al panel de administración de Copa Solose.</p>
      <nav className="flex flex-col gap-2">
        <Link href="/admin/torneos" className="text-sm font-medium text-azul underline">
          Ir a Torneos
        </Link>
        <Link href="/admin/suspensiones" className="text-sm font-medium text-azul underline">
          Ir a Suspensiones
        </Link>
        <Link href="/admin/avisos" className="text-sm font-medium text-azul underline">
          Ir a Avisos
        </Link>
      </nav>
    </div>
  );
}
