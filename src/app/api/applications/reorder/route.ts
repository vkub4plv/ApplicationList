import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

type ReorderItem = { app_id: number; app_sortOrder: number };

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Basic shape & type checks + ensure unique app_ids in payload
    const desired: ReorderItem[] = [];
    const idSet = new Set<number>();

    for (const item of body) {
      if (
        !item ||
        typeof item.app_id !== "number" ||
        !Number.isFinite(item.app_id) ||
        typeof item.app_sortOrder !== "number" ||
        !Number.isFinite(item.app_sortOrder)
      ) {
        return NextResponse.json(
          { error: "Each item must have numeric `app_id` and `app_sortOrder`" },
          { status: 400 }
        );
      }
      if (idSet.has(item.app_id)) {
        return NextResponse.json(
          { error: `Duplicate app_id in payload: ${item.app_id}` },
          { status: 400 }
        );
      }
      idSet.add(item.app_id);
      desired.push({ app_id: item.app_id, app_sortOrder: item.app_sortOrder });
    }

    if (desired.length === 0) {
      return NextResponse.json({ success: true, updated: 0, reason: "empty payload" });
    }

    // Fetch current orders for only the IDs that were sent
    const ids = desired.map(d => d.app_id);
    const current = await prisma.applications.findMany({
      where: { app_id: { in: ids } },
      select: { app_id: true, app_sortOrder: true },
    });

    // Validate: all provided IDs must exist
    if (current.length !== desired.length) {
      const currentIds = new Set(current.map(c => c.app_id));
      const unknown = ids.filter(id => !currentIds.has(id));
      return NextResponse.json(
        { error: `Unknown app_id(s): ${unknown.join(", ")}` },
        { status: 400 }
      );
    }

    // Build a map for quick comparison
    const currMap = new Map(current.map(c => [c.app_id, c.app_sortOrder]));

    // Only update rows that actually changed
    const toUpdate = desired.filter(d => currMap.get(d.app_id) !== d.app_sortOrder);

    if (toUpdate.length === 0) {
      return NextResponse.json({ success: true, updated: 0, reason: "no changes" });
    }

    await prisma.$transaction(
      toUpdate.map(d =>
        prisma.applications.update({
          where: { app_id: d.app_id },
          data: { app_sortOrder: d.app_sortOrder },
        })
      )
    );

    revalidateTag("links");
    return NextResponse.json({ success: true, updated: toUpdate.length });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
