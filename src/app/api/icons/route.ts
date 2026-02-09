import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { unstable_cache, revalidateTag } from "next/cache";

export const runtime = "nodejs";

const ALLOWED_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".ico", ".svg"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// ---- CACHED READER ----
const getIconsUncached = async () => {
  const icons = await prisma.icons.findMany({
    orderBy: { ico_id: "desc" },
    include: { _count: { select: { applications: true } } },
  });

  return icons.map((i) => ({
    ico_id: i.ico_id,
    ico_name: i.ico_name,
    ico_fileName: i.ico_fileName,
    inUseCount: i._count.applications,
  }));
};

// Tag + TTL (tweak revalidate seconds to preference)
const getIconsCached = unstable_cache(
  getIconsUncached,
  ["icons-cache-key"],                 // cache key seed
  { tags: ["icons"], revalidate: 300 } // 5 min TTL + manual invalidation
);

export async function GET() {
  const data = await getIconsCached();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const ico_name = ((form.get("ico_name") as string) || "").trim();
    const file = form.get("file") as unknown as File | null;

    if (!ico_name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const originalName = file.name || "";
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type. Allowed: ${ALLOWED_EXTS.join(", ")}` },
        { status: 400 }
      );
    }

    const size = file.size;
    if (size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large (max ${Math.floor(MAX_BYTES / 1024)} KB)` },
        { status: 413 }
      );
    }

    const rawBase = path.basename(originalName, ext);
    const safeBase =
      rawBase.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "icon";

    const destDir = path.join(process.cwd(), "data", "icons");
    await fs.mkdir(destDir, { recursive: true });

    async function uniqueFileName(base: string, ext: string) {
      let n = 0;
      while (true) {
        const candidate = n === 0 ? `${base}${ext}` : `${base}-${n + 1}${ext}`;
        try {
          await fs.access(path.join(destDir, candidate));
          n++;
        } catch {
          return candidate;
        }
      }
    }

    const serverFileName = await uniqueFileName(safeBase, ext);

    const ab = await file.arrayBuffer();
    const fullPath = path.join(destDir, serverFileName);
    await fs.writeFile(fullPath, Buffer.from(ab));

    let created;
    try {
      created = await prisma.icons.create({
        data: { ico_name, ico_fileName: serverFileName },
      });
    } catch (dbErr) {
      // rollback the file if DB fails
      await fs.unlink(fullPath).catch(() => {});
      throw dbErr;
    }

    revalidateTag("icons");

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Icon upload failed:", error);
    return NextResponse.json({ error: "Failed to create icon" }, { status: 500 });
  }
}