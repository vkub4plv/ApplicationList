"use client";

import { useAdminAccess } from "@/hooks/useAdminAccess";

interface Props {
  adminMode: boolean;
  setAdminMode: (mode: boolean) => void;
}

export default function AdminControls({ adminMode, setAdminMode }: Props) {
  const { canAccess, loading } = useAdminAccess();

  if (loading || !canAccess || adminMode) return null;

  return (
    <button
      onClick={() => setAdminMode(true)}
      className="text-sm font-medium text-blue-600 underline hover:no-underline hover:bg-blue-100 px-4 py-2 rounded-full transition cursor-pointer"
    >
      Panel admina
    </button>
  );
}
