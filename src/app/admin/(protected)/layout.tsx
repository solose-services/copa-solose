import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";
import { SignOutButton } from "./sign-out-button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-linea px-6 py-4">
        <div className="flex items-baseline gap-2">
          <Logo />
          <span className="font-mono text-[.62rem] uppercase tracking-wider text-tinta-2">
            Administración
          </span>
        </div>
        <SignOutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
