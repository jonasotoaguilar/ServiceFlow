import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const authentikUrl = process.env.NEXT_PUBLIC_AUTHENTIK_URL;
  const baseUrl = new URL(request.url).origin;

  console.log(`[Logout] Authentik URL Configured: ${authentikUrl}`);

  // Si la URL de Authentik es distinta a la de la web, vamos al servidor de identidad directamente
  if (authentikUrl && authentikUrl !== baseUrl) {
    const finalUrl = `${authentikUrl}/if/flow/default-invalidation-flow/?next=${baseUrl}`;
    console.log(`[Logout] Redirecting to absolute Authentik: ${finalUrl}`);
    return NextResponse.redirect(finalUrl);
  }

  // Si no hay URL o es la misma, usamos el endpoint del outpost
  const fallbackUrl = `${baseUrl}/outpost.goauthentik.io/auth/logout`;
  console.log(`[Logout] Fallback to relative outpost: ${fallbackUrl}`);
  return NextResponse.redirect(fallbackUrl);
}
