import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAllowedAdmins, getHeaderName, normalizeWindowsUser } from "@/lib/adminConfig";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function isLocalDev() {
  return process.env.NODE_ENV !== "production";
}

export function middleware(req: NextRequest) {
  const method = req.method.toUpperCase();
  const isMutation = method !== "GET" && method !== "HEAD" && method !== "OPTIONS";

  const { pathname } = new URL(req.url);
  const isProtected =
    pathname.startsWith(`${basePath}/api/applications`) ||
    pathname.startsWith(`${basePath}/api/icons`);

  if (isProtected && isMutation) {
    if (!isLocalDev()) {
      const headerName = getHeaderName();
      const user = normalizeWindowsUser(req.headers.get(headerName));
      const allowed = getAllowedAdmins();
      if (!user || !allowed.includes(user)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [`${basePath}/api/:path*`],
};
