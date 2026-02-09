import { NextRequest, NextResponse } from "next/server";

function parseWindowsUser(raw: string | null): string | null {
  if (!raw) return null;
  // Strip DOMAIN\ from "DOMAIN\\username"
  return raw.replace(/^.*\\/, "") || null;
}

export async function GET(req: NextRequest) {
  const raw =
    req.headers.get("x-windows-user") ||
    req.headers.get("x-auth-user") ||
    req.headers.get("x-arr-logonuser") ||
    req.headers.get("x-iisnode-logon_user") ||
    null;

  const username = parseWindowsUser(raw);

  return NextResponse.json(
    { username },
    { headers: { "Cache-Control": "no-store" } }
  );
}