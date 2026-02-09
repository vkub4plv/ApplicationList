"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  current: string;
}

export default function SortOptions({ current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams);
    const newSort = e.target.value;

    if (newSort === "default") {
      params.delete("sort");
    } else {
      params.set("sort", newSort);
    }

    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center h-10 mb-2">
      <label className="text-sm text-gray-600 mr-3 font-medium select-none">
        Sortuj:
      </label>
      <select
        className="bg-white border border-gray-200 rounded-md ring-1 ring-black/5 shadow-sm p-2 text-sm h-full cursor-pointer"
        value={current}
        onChange={handleChange}
      >
        <option value="default">Domyślne</option>
        <option value="asc">A–Z</option>
        <option value="desc">Z–A</option>
      </select>
    </div>
  );
}