import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const sessionCookie = req.cookies.has("session");

  if (!sessionCookie) {
    if (pathname === "/" || pathname === "/login" || pathname === "/register") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (sessionCookie) {
    if (pathname === "/lobby" || pathname.startsWith("/game/")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/lobby", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/((?!api|_next|favicon.ico|login|_static|ajax).*)"],
};
