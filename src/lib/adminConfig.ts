export function getAllowedAdmins(): string[] {
  const raw = process.env.ADMIN_USERS || "";
  return raw
    .split(",")
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);
}

export function getHeaderName(): string {
  return process.env.ADMIN_HEADER_NAME || "x-windows-user";
}

// DOMAIN\user -> user
export function normalizeWindowsUser(v: string | null): string | null {
  if (!v) return null;
  return v.replace(/^.*\\/, "").toLowerCase();
}
