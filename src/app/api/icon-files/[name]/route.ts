import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "data", "icons");

function contentType(name: string): string {
  const ext = path.extname(name).toLowerCase();
  switch (ext) {
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    case ".ico": return "image/x-icon";
    case ".svg": return "image/svg+xml";
    default: return "application/octet-stream";
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await context.params;

    if (!/^[a-zA-Z0-9._-]+$/.test(name)) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, name);
    const stat = await fs.stat(filePath);

    const etag = `W/"${stat.size}-${stat.mtimeMs}"`;
    const ifNoneMatch = req.headers.get("if-none-match");

    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Last-Modified": stat.mtime.toUTCString(),
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Type": contentType(name),
        },
      });
    }

    const buf = await fs.readFile(filePath);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        ETag: etag,
        "Last-Modified": stat.mtime.toUTCString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType(name),
      },
    });
  } catch (e: unknown) {
    const err = e as NodeJS.ErrnoException;
    if (err?.code === "ENOENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Serve icon failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
