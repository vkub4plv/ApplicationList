import { useEffect, useState } from "react";
import { withBase } from "@/lib/basePath";

export function useWindowsUsername() {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(withBase("/api/userinfo"), { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setUsername(data.username);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { username, loading };
}