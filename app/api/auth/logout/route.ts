import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Intentamos leer cualquier variable que pueda contener la URL de Authentik
  const authentikUrl =
    process.env.AUTHENTIK_URL || process.env.NEXT_PUBLIC_AUTHENTIK_URL;

  const appUrl = new URL(request.url).origin;

  console.log(`[Logout Debug] Redirection start`);
  console.log(`[Logout Debug] Authentik URL from Env: ${authentikUrl}`);

  // 1. Si tenemos la URL de Authentik (ej: https://auth.jonasotoaguilar.space)
  if (
    authentikUrl &&
    authentikUrl.startsWith("http") &&
    !authentikUrl.includes("warranty-system")
  ) {
    const destination = `${authentikUrl}/if/flow/default-invalidation-flow/?next=${appUrl}`;
    return NextResponse.redirect(destination);
  }

  // 2. Si no hay URL configurada o apunta a la misma App, usamos el Outpost
  // IMPORTANTE: Cambiamos /logout por /sign_out que es el estándar actual para evitar redirigir a /akprox/
  const fallback = `${appUrl}/outpost.goauthentik.io/sign_out`;
  return NextResponse.redirect(fallback);
}
