import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/api/proxy")) {
    // Access environment variable at runtime
    const endpoint =
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "http://localhost";

    // Clean up paths to ensure correct URL construction
    // Remove /api/proxy prefix
    const targetPath = pathname.replace(/^\/api\/proxy/, "");

    // Remove trailing slash from endpoint if present
    const cleanEndpoint = endpoint.replace(/\/$/, "");

    // Construct final URL
    const finalUrl = `${cleanEndpoint}${targetPath}${search}`;

    return NextResponse.rewrite(new URL(finalUrl));
  }
}

export const config = {
  matcher: "/api/proxy/:path*",
};
