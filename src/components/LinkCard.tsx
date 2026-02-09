import { ExternalLink, Globe, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { withBase } from "@/lib/basePath";
import Image from "next/image";

interface LinkCardProps {
  app_id: number;
  app_title: string;
  app_url: string;
  icons: {
    ico_id: number;
    ico_fileName: string;
  } | null;
  adminMode?: boolean;
  reorderMode?: boolean;
  onEdit?: (data: {
    app_id: number;
    app_title: string;
    app_url: string;
    ico_id: number | null;
  }) => void
  onDeleteSuccess?: (title: string) => void;
}

function getDisplayDomain(url: string): string {
  try {
    const { hostname } = new URL(url);
    return hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function LinkCard({ app_id, app_title, app_url, icons, adminMode = false, reorderMode = false, onEdit, onDeleteSuccess }: LinkCardProps) {
  const displayDomain = getDisplayDomain(app_url);
  
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (reorderMode) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="relative group border border-gray-200 rounded-2xl bg-white
                ring-1 ring-black/5 shadow-sm hover:shadow-md hover:ring-black/10
                transition-shadow h-full flex flex-col">
      <a
        href={app_url}
        target="_blank"
        rel="noopener noreferrer"
        className={`p-6 flex-grow flex flex-col gap-4 ${
          reorderMode ? "pointer-events-none" : ""
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          {icons?.ico_fileName ? (
            <Image
              src={withBase(`/api/icon-files/${icons.ico_fileName}?v=${icons.ico_id}`)}
              alt={`${app_title} icon`}
              width={32}
              height={32}
              className="w-8 h-8"
              unoptimized
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <Globe className="w-8 h-8 text-gray-400" />
          )}
          <span className="text-xl font-semibold text-blue-600 break-words">{app_title}</span>
        </div>

        <div className="flex items-center gap-1 text-sm text-gray-500 mt-auto">
          <ExternalLink className="w-4 h-4" />
          <span className="truncate">{displayDomain}</span>
        </div>
      </a>

      {adminMode && (
        <div className="flex justify-end gap-2 p-2 border-t border-gray-100">
          <button
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md shadow-sm hover:bg-blue-200 transition transform hover:scale-105 cursor-pointer"
            title="Edytuj"
            onClick={() =>
              onEdit?.({
                app_id,
                app_title,
                app_url,
                ico_id: icons?.ico_id ?? null,
              })
            }
          >
            <Pencil className="w-5 h-5" />
            <span className="text-sm font-medium">Edytuj</span>
          </button>
          <button
            className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-md shadow-sm hover:bg-red-200 transition transform hover:scale-105 cursor-pointer"
            title="Usuń"
            onClick={async () => {
              const confirmed = confirm(`Czy na pewno chcesz usunąć "${app_title}"?`);
              if (!confirmed) return;

              try {
                const res = await fetch(withBase(`/api/applications/${app_id}`), {
                  method: "DELETE",
                });

                if (!res.ok) {
                  alert("Nie udało się usunąć aplikacji.");
                  return;
                }
                else {
                  router.refresh()
                  onDeleteSuccess?.(app_title);
                }
              } catch (err) {
                console.error("Delete failed", err);
                alert("Wystąpił błąd podczas usuwania.");
              }
            }}
          >
            <Trash2 className="w-5 h-5" />
            <span className="text-sm font-medium">Usuń</span>
          </button>
        </div>
      )}
    </div>
  );
}
