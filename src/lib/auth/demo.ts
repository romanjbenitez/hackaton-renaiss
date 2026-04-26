import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import type { AppRole } from "@/lib/auth/config";
import demoUsersJson from "@/lib/auth/demo-users.json";

export const demoSessionCookieName = "proptech-demo-session";

export type DemoUserRecord = {
  id: string;
  role: AppRole;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  source: "excel" | "seed";
  reference?: string;
};

type DemoSessionPayload = {
  id: string;
  role: AppRole;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
};

export const demoUsers = demoUsersJson as DemoUserRecord[];

function encodeSession(payload: DemoSessionPayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeSession(value: string) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as DemoSessionPayload;
  } catch {
    return null;
  }
}

function buildSessionPayload(user: DemoUserRecord): DemoSessionPayload {
  return {
    id: user.id,
    role: user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    companyName: user.companyName,
  };
}

export function findDemoUserByCredentials(role: AppRole, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return (
    demoUsers.find(
      (user) =>
        user.role === role &&
        user.email.toLowerCase() === normalizedEmail &&
        user.password === password
    ) ?? null
  );
}

export function findDemoUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return demoUsers.find((user) => user.email.toLowerCase() === normalizedEmail) ?? null;
}

export function getDemoUserForUi() {
  return demoUsers.map((user) => ({
    ...user,
    label: `${user.firstName} ${user.lastName}`.trim(),
  }));
}

export async function setDemoSessionCookie(user: DemoUserRecord) {
  const cookieStore = await cookies();

  cookieStore.set(demoSessionCookieName, encodeSession(buildSessionPayload(user)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearDemoSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(demoSessionCookieName);
}

export async function getDemoSessionFromCookies() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(demoSessionCookieName)?.value;

  if (!raw) {
    return null;
  }

  const payload = decodeSession(raw);

  if (!payload) {
    return null;
  }

  return {
    role: payload.role,
    session: {
      access_token: raw,
      refresh_token: "",
      expires_at: 0,
      expires_in: 0,
      token_type: "bearer",
      user: {
        id: payload.id,
        email: payload.email,
        app_metadata: { role: payload.role },
        user_metadata: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          company_name: payload.companyName,
          role: payload.role,
        },
      },
    },
    user: {
      id: payload.id,
      email: payload.email,
      app_metadata: { role: payload.role },
      user_metadata: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        company_name: payload.companyName,
        role: payload.role,
      },
    },
  };
}

export function attachDemoSessionHeader(response: NextResponse, user: DemoUserRecord) {
  response.cookies.set(demoSessionCookieName, encodeSession(buildSessionPayload(user)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function readDemoSessionFromRequest(request: NextRequest) {
  const raw = request.cookies.get(demoSessionCookieName)?.value;

  if (!raw) {
    return null;
  }

  return decodeSession(raw);
}

export const getDemoSessionFromRequest = readDemoSessionFromRequest;
