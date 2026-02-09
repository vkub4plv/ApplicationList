import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { LinkFormData } from "@/lib/types";
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  const { app_title, app_url, ico_id }: LinkFormData = await req.json();
  const max = await prisma.applications.aggregate({ _max: { app_sortOrder: true } });
  const nextOrder = (max._max.app_sortOrder ?? 0) + 1;

  const created = await prisma.applications.create({
    data: { app_title, app_url, ico_id, app_sortOrder: nextOrder },
  });

  revalidateTag("links");
  revalidateTag("icons")
  
  return NextResponse.json(created);
}