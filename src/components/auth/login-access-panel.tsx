"use client";

import { useState } from "react";
import Link from "next/link";

import type { AppRole } from "@/lib/auth/config";
import { roleLabels } from "@/lib/auth/config";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DemoUserUi = {
  role: AppRole;
  email: string;
  password: string;
  label: string;
  reference?: string;
};

type LoginAccessPanelProps = {
  selectedRole: AppRole;
  nextPath: string;
  error?: string;
  message?: string;
  isConfigured: boolean;
  demoUsers: DemoUserUi[];
  signInWithPasswordAction: (formData: FormData) => void | Promise<void>;
  signInWithGoogleAction: (formData: FormData) => void | Promise<void>;
};

export function LoginAccessPanel({
  selectedRole,
  nextPath,
  error,
  message,
  isConfigured,
  demoUsers,
  signInWithPasswordAction,
  signInWithGoogleAction,
}: LoginAccessPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">Acceso</p>
        <h2 className="mt-3 text-3xl font-semibold">Entrar como {roleLabels[selectedRole]}</h2>
      </div>

      {error ? (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-2xl border px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="border-border bg-muted rounded-2xl border px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      {demoUsers.length > 0 ? (
        <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <p>
            {isConfigured
              ? "Las credenciales demo se sincronizan automáticamente con Supabase Auth en el primer login."
              : "Falta configurar `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Mientras tanto, el login funciona en modo demo con credenciales mock."}
          </p>
          <p className="text-xs">
            Tocá `Usar` para cargar credenciales en el formulario o `Entrar` para iniciar sesión directo.
          </p>
          <ul className="space-y-3">
            {demoUsers.map((user) => (
              <li key={user.email} className="rounded-2xl border border-amber-200 bg-white/60 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {roleLabels[user.role]} · {user.label}
                    </p>
                    <p className="break-all font-mono text-xs">{user.email}</p>
                    <p className="font-mono text-xs">{user.password}</p>
                    <p className="text-xs opacity-80">{user.reference}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
                      onClick={() => {
                        setEmail(user.email);
                        setPassword(user.password);
                      }}
                    >
                      Usar
                    </button>
                    <form action={signInWithPasswordAction}>
                      <input type="hidden" name="role" value={selectedRole} />
                      <input type="hidden" name="next" value={nextPath} />
                      <input type="hidden" name="email" value={user.email} />
                      <input type="hidden" name="password" value={user.password} />
                      <button className={cn(buttonVariants(), "rounded-2xl")}>Entrar</button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form action={signInWithPasswordAction} className="space-y-4">
        <input type="hidden" name="role" value={selectedRole} />
        <input type="hidden" name="next" value={nextPath} />

        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            className="border-input bg-background h-12 w-full rounded-2xl border px-4"
            name="email"
            type="email"
            placeholder="nombre@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium">Contraseña</span>
          <input
            className="border-input bg-background h-12 w-full rounded-2xl border px-4"
            name="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        <button className={cn(buttonVariants({ size: "lg" }), "w-full rounded-2xl")}>
          Ingresar con email
        </button>
      </form>

      <form action={signInWithGoogleAction}>
        <input type="hidden" name="role" value={selectedRole} />
        <input type="hidden" name="next" value={nextPath} />
        <button
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full rounded-2xl")}
        >
          Continuar con Google
        </button>
      </form>

      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
        <span>¿Todavía no tenés cuenta?</span>
        <Link
          href={selectedRole === "admin" ? "/register" : `/register/${selectedRole}`}
          className="text-foreground font-medium underline underline-offset-4"
        >
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
