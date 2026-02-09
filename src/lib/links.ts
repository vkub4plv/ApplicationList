import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";
export type SortMethod = "default" | "asc" | "desc";

const getLinksUncached = async (sort: SortMethod) => {
  const orderBy: Prisma.applicationsOrderByWithRelationInput =
    sort === "asc"  ? { app_title: "asc" } :
    sort === "desc" ? { app_title: "desc" } :
                      { app_sortOrder: "asc" };

  return prisma.applications.findMany({
    orderBy,
    select: {
      app_id: true,
      app_title: true,
      app_url: true,
      app_sortOrder: true,
      icons: { select: { ico_id: true, ico_fileName: true } },
    },
  });
};

// cache key includes sort; tag controls invalidation
export const getLinks = unstable_cache(
  getLinksUncached,
  ["links"],                      // cache key seed
  { revalidate: 300, tags: ["links"] } // 5 min TTL + manual busting
);