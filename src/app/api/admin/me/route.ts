import { NextRequest, NextResponse } from "next/server";
import { getAllowedAdmins, getHeaderName, normalizeWindowsUser } from "@/lib/adminConfig";

export async function GET(req: NextRequest) {
  const headerName = getHeaderName();
  let user = normalizeWindowsUser(req.headers.get(headerName));
  let isAdmin = user ? getAllowedAdmins().includes(user) : false;

  // Dev-only convenience: if not behind IIS, treat as admin so UI is visible
  if (process.env.NODE_ENV !== "production" && !user) {
    user = "dev";
    isAdmin = true;
  }

  return NextResponse.json(
    { username: user, isAdmin },
    { headers: { "Cache-Control": "no-store" } }
  );
}