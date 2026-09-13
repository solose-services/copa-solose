import type { ReactNode } from "react";
import { SignOutButton } from "./sign-out-button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="font-semibold">Copa Solose — Administración</span>
        <SignOutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
