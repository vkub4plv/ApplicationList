import { useEffect, useState } from "react";
import { withBase } from "@/lib/basePath";

export function useAdminAccess() {
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(withBase("/api/admin/me"), { cache: "no-store" })
      .then(r => r.json())
      .then((data: { username: string | null; isAdmin: boolean }) => {
        setCanAccess(Boolean(data?.isAdmin));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { canAccess, loading };
}