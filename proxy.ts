import { NextResponse, type NextRequest } from "next/server";

import { getDefaultRolePath, getLoginRedirect, getRoleFromPathname } from "./src/lib/auth/config";
import { updateSession } from "./src/lib/auth/proxy";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiredRole = getRoleFromPathname(pathname);
  const { response, role, user } = await updateSession(request);

  if (!requiredRole) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(
      new URL(getLoginRedirect("Iniciá sesión para continuar."), request.url)
    );
  }

  if (!role) {
    return NextResponse.redirect(
      new URL(getLoginRedirect("Tu cuenta no tiene un rol asignado."), request.url)
    );
  }

  if (role !== requiredRole) {
    return NextResponse.redirect(new URL(getDefaultRolePath(role), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/tenant/:path*", "/agency/:path*", "/admin/:path*"],
};
