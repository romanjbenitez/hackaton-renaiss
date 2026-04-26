import type { BrowserContext } from "@playwright/test";

type DemoRole = "tenant" | "agency" | "admin";

const DEMO_SESSION_COOKIE = "proptech-demo-session";

const DEMO_USERS = {
  tenant: {
    id: "demo-tenant-monica-alustiza",
    role: "tenant" as DemoRole,
    email: "monica.rosa.alustiza+13452513@demo.proptech.ar",
    firstName: "Monica Rosa",
    lastName: "Alustiza",
  },
  agency: {
    id: "demo-agency-remax-palermo",
    role: "agency" as DemoRole,
    email: "contacto@remax-palermo.ar",
    firstName: "Roberto",
    lastName: "Sánchez",
    companyName: "RE/MAX Palermo",
  },
  admin: {
    id: "demo-admin-plataforma",
    role: "admin" as DemoRole,
    email: "admin@proptech.ar",
    firstName: "Admin",
    lastName: "Plataforma",
  },
} as const;

export function encodeDemoSession(role: DemoRole) {
  const payload = DEMO_USERS[role];
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export async function injectDemoSession(context: BrowserContext, role: DemoRole) {
  await context.addCookies([
    {
      name: DEMO_SESSION_COOKIE,
      value: encodeDemoSession(role),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
