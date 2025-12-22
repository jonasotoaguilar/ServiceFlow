import { NextResponse } from "next/server";

export async function GET() {
  const authentikUrl = process.env.NEXT_PUBLIC_AUTHENTIK_URL;

  if (authentikUrl) {
    // Redirección directa al servidor de Authentik (Runtime)
    return NextResponse.redirect(
      `${authentikUrl}/if/flow/default-invalidation-flow/`
    );
  }

  // Fallback si no hay URL configurada
  return NextResponse.redirect(
    new URL(
      "/outpost.goauthentik.io/auth/logout",
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001"
    )
  );
}
