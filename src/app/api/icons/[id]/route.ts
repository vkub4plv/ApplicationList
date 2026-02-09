import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import fs from "fs/promises";
import { revalidateTag } from "next/cache";

export const runtime = "nodejs";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const ico_id = Number(id);

    if (!Number.isFinite(ico_id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const { ico_name }: { ico_name?: string } = await req.json();
    if (!ico_name || !ico_name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const updated = await prisma.icons.update({
      where: { ico_id },
      data: { ico_name: ico_name.trim() },
    });

    revalidateTag("icons");

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Icon update failed:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const ico_id = Number(id);
    if (!Number.isFinite(ico_id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const icon = await prisma.icons.findUnique({
      where: { ico_id },
      include: { _count: { select: { applications: true } } },
    });

    if (!icon) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (icon._count.applications > 0) {
      return NextResponse.json(
        { error: `Ikona używana w ${icon._count.applications} linkach` },
        { status: 409 }
      );
    }

    // remove file first; ignore if it's already gone
    if (icon.ico_fileName) {
      const filePath = path.join(process.cwd(), "data", "icons", icon.ico_fileName);
      try {
        await fs.unlink(filePath);
      } catch (e: unknown) {
        const err = e as NodeJS.ErrnoException;
        if (err?.code !== "ENOENT") {
          console.error("Unlink failed:", err);
          return NextResponse.json({ error: "Failed to remove file" }, { status: 500 });
        }
      }
    }

    await prisma.icons.delete({ where: { ico_id } });

    revalidateTag("icons");

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Icon delete failed:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}