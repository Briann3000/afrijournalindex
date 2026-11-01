import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // 301 Permanent Redirect for www.afrijournalindexing.org to apex domain
  if (host.startsWith("www.")) {
    const newHost = host.replace(/^www\./i, "");
    const url = request.nextUrl.clone();
    url.host = newHost;
    url.protocol = "https";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
