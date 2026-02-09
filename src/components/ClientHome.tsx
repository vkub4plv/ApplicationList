"use client";

import { useEffect, useState } from "react";
import LinkCard from "./LinkCard";
import LinkModal, { LinkFormData } from "./LinkModal";
import SortOptions from "./SortOptions";
import AdminControls from "./AdminControls";
import IconManagerModal from "@/components/IconManagerModal";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToParentElement,
  restrictToWindowEdges
} from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  links: {
    app_id: number;
    app_title: string;
    app_url: string;
    icons: { 
      ico_id: number;
      ico_fileName: string;
    } | null;
  }[];
  sort: string;
}
import { withBase } from "@/lib/basePath";

export default function ClientHome({ links, sort }: Props) {
  const [adminMode, setAdminMode] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(links);
  const [initialOrder, setInitialOrder] = useState(links);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState<null | { mode: "add" | "edit"; data?: LinkFormData & { app_id: number } }>(null);
  const [showIconManager, setShowIconManager] = useState(false);
  
  const handleSave = async (form: LinkFormData & { app_id?: number }) => {
    const url = showModal!.mode === "add"
      ? "/api/applications"
      : `/api/applications/${form.app_id}`;

    await fetch(withBase(url), {
      method: showModal!.mode === "add" ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowModal(null);
    router.refresh();
  };
  
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDeleteSuccess = (title: string) => {
    setSuccessMessage(`Usunięto: "${title}"`);
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = currentOrder.findIndex((i) => i.app_id === active.id);
      const newIndex = currentOrder.findIndex((i) => i.app_id === over.id);
      setCurrentOrder(arrayMove(currentOrder, oldIndex, newIndex));
    }
  };

  const handleSaveOrder = async () => {
    try {
      await fetch(withBase("/api/applications/reorder"), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          currentOrder.map((app, index) => ({
            app_id: app.app_id,
            app_sortOrder: index + 1,
          }))
        ),
      });
      setReorderMode(false);
      router.refresh();
    } catch {
      alert("Wystąpił błąd podczas zapisu kolejności");
    }
  };

  const handleCancelOrder = () => {
    setCurrentOrder(initialOrder);
    setReorderMode(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem("adminMode");
    if (stored === "true") {
      setAdminMode(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("adminMode", adminMode ? "true" : "false");
  }, [adminMode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
  if (!reorderMode) {
    setCurrentOrder(links);
    setInitialOrder(links);
  }
}, [links, reorderMode]);

  return (
    <section className="w-full">
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="animate-fade bg-white/90 text-green-700 font-semibold text-5xl px-6 py-4 rounded-xl shadow-xl flex items-center gap-4 border border-green-200">
            <svg
              className="w-12 h-12 text-green-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={4}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-2">
        {!adminMode && <SortOptions current={sort} />}
        <div className="flex items-center gap-3">
          {!adminMode && (
            <AdminControls
              adminMode={adminMode}
              setAdminMode={(val) => {
                if (val) router.push("/");
                setAdminMode(val);
              }}
            />
          )}
        </div>
      </div>

      {adminMode && (
        <div className="flex justify-between items-center w-full mb-6">
          <div className="flex gap-3">
            {!reorderMode ? (
              <>
                <button 
                  onClick={() => setShowModal({ mode: "add" })}
                  className="text-sm font-medium px-4 py-2 rounded-md border-2 border-green-600 text-green-600 hover:bg-green-50 transition cursor-pointer">
                  Dodaj aplikację
                </button>
                <button 
                  className="text-sm font-medium px-4 py-2 rounded-md border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                  onClick={() => setShowIconManager(true)}
                  >
                  Zarządzaj ikonami
                </button>
                <button
                  className="text-sm font-medium px-4 py-2 rounded-md border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 transition cursor-pointer"
                  onClick={() => {
                    setInitialOrder(currentOrder);
                    setReorderMode(true);
                  }}
                >
                  Zmień kolejność
                </button>
              </>
            ) : (
              <>
                <button
                  className="text-sm font-medium px-4 py-2 rounded-md border-2 border-green-600 text-green-600 hover:bg-green-50 transition cursor-pointer"
                  onClick={handleSaveOrder}
                >
                  Zapisz kolejność
                </button>
                <button
                  className="text-sm font-medium px-4 py-2 rounded-md border-2 border-red-600 text-red-600 hover:bg-red-50 transition cursor-pointer"
                  onClick={handleCancelOrder}
                >
                  Anuluj
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => {
              setAdminMode(false);
              setReorderMode(false);
              localStorage.removeItem("adminMode");
            }}
            className="text-sm font-medium text-blue-600 underline hover:no-underline hover:bg-blue-100 px-4 py-2 rounded-full transition cursor-pointer"
            title="Wyloguj"
          >
            Wyloguj
          </button>
        </div>
      )}

      {/* Only activate DnD when hydrated AND in reorderMode */}
      {mounted && reorderMode ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToParentElement, restrictToWindowEdges]}>
          <SortableContext
            items={currentOrder.map((l) => l.app_id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 mt-5" style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
              {currentOrder.map((link) => (
                <SortableItem
                  key={link.app_id}
                  id={link.app_id}
                  link={link}
                  adminMode={adminMode}
                  reorderMode={reorderMode}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 mt-5" style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
          {currentOrder.map((link) => (
            <LinkCard
              key={link.app_id}
              app_id={link.app_id}
              app_title={link.app_title}
              app_url={link.app_url}
              icons={link.icons}
              adminMode={adminMode && !reorderMode}
              reorderMode={reorderMode}
              onEdit={(data) =>
                setShowModal({ mode: "edit", data: { ...data, app_id: link.app_id } })
              }
              onDeleteSuccess={handleDeleteSuccess}
            />
          ))}
        </div>
      )}
      {/* Add / Edit modal */}
      {showModal && (
        <LinkModal
          initialData={showModal.mode === "edit" ? {
            app_title: showModal.data!.app_title,
            app_url:   showModal.data!.app_url,
            ico_id:    showModal.data!.ico_id,
          } : null}
          onSave={(form) =>
            handleSave(
              showModal.mode === "edit"
                ? { ...form, app_id: showModal.data!.app_id }
                : form
            )
          }
          onCancel={() => setShowModal(null)}
        />
      )}
      {showIconManager && (
        <IconManagerModal onClose={() => setShowIconManager(false)} />
      )}
    </section>
  );
}

type SortableItemProps = {
  id: number;
  link: Props["links"][number];
  adminMode: boolean;
  reorderMode: boolean;
  onDeleteSuccess: (title: string) => void;
};

function SortableItem({ id, link, adminMode, reorderMode, onDeleteSuccess }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: reorderMode ? "grab" : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LinkCard
        {...link}
        adminMode={adminMode && !reorderMode}
        reorderMode={reorderMode}
        onDeleteSuccess={onDeleteSuccess}
      />
    </div>
  );
}
