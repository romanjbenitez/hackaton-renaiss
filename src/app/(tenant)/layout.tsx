import Link from "next/link";

import { signOutAction } from "@/lib/auth/actions";
import { requireUserRole } from "@/lib/auth/session";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function TenantLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireUserRole("tenant");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(to_bottom,_transparent,_rgba(15,23,42,0.02))]">
      <header className="bg-background/80 border-b backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm tracking-[0.22em] text-emerald-700 uppercase">Inquilino</p>
            <h1 className="text-xl font-semibold">
              {session.user?.user_metadata.first_name ?? session.user?.email}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/tenant"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Panel
            </Link>
            <Link
              href="/tenant/onboarding"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Onboarding
            </Link>
            <Link
              href="/tenant/properties"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Propiedades
            </Link>
            <Link
              href="/tenant/profile"
              className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
            >
              Perfil
            </Link>
            <Link
              href="/tenant/documents"
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
