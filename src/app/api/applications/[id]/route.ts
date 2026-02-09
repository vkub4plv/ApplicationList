import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { LinkFormData } from "@/lib/types";
import { revalidateTag } from "next/cache";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const app_id = Number(id);
  
  if (!Number.isFinite(app_id)) {
    return NextResponse.json({ error: "Invalid app_id" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1) Delete and grab its sort position
      const deleted = await tx.applications.delete({
        where: { app_id },
        select: { app_sortOrder: true },
      });

      // 2) Shift only items that were after the deleted one
      const updateRes = await tx.applications.updateMany({
        where: { app_sortOrder: { gt: deleted.app_sortOrder } },
        data: { app_sortOrder: { decrement: 1 } },
      });

      return { shifted: updateRes.count, deletedSort: deleted.app_sortOrder };
    });

    revalidateTag("links");
    revalidateTag("icons")

    return NextResponse.json({
      success: true,
      shifted: result.shifted,
      deletedSort: result.deletedSort,
    });
  } catch (error) {
    console.error("Deletion + renumber error:", error);
    return NextResponse.json(
      { error: "Failed to delete and renumber" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const app_id = Number(id);
  const { app_title, app_url, ico_id }: LinkFormData = await req.json();
  const updated = await prisma.applications.update({
    where: { app_id },
    data: { app_title, app_url, ico_id },
  });
  
  revalidateTag("links");
  revalidateTag("icons")

  return NextResponse.json(updated);
}