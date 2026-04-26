import Link from "next/link";

import { signOutAction } from "@/lib/auth/actions";
import { requireUserRole } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireUserRole("admin");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.14),_transparent_32%),linear-gradient(to_bottom,_transparent,_rgba(15,23,42,0.03))]">
      <header className="bg-background/80 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-rose-700 uppercase">Administrador</p>
            <h1 className="text-xl font-semibold">{session.user?.email}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Panel
            </Link>
            <Link
              href="/admin/agencies"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Inmobiliarias
            </Link>
            <Link
              href="/admin/documents-queue"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Documentos
            </Link>
            <form action={signOutAction}>
              <button className={cn(buttonVariants({ variant: "ghost" }), "rounded-2xl")}>
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
