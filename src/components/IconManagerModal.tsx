"use client";

import { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Trash2, Pencil, Plus, X } from "lucide-react";
import { withBase } from "@/lib/basePath";
import Image from "next/image";

export interface Icon {
  ico_id: number;
  ico_name: string;
  ico_fileName: string;
  inUseCount: number;
}

interface IconManagerModalProps {
  onClose: () => void;
}

export default function IconManagerModal({ onClose }: IconManagerModalProps) {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [editing, setEditing] = useState<Record<number, { name: string }>>({});
  const [adding, setAdding] = useState<{
    name: string;
    file: File | null;
  } | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());

  const load = () => {
    fetch(withBase("/api/icons"), { cache: "no-store" })
      .then((r) => r.json())
      .then(setIcons)
      .catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  // == Adding ==
  const startAdd = () => setAdding({ name: "", file: null });
  const cancelAdd = () => setAdding(null);
  const saveAdd = async () => {
    if (!adding || !adding.name.trim() || !adding.file) return;
    const fd = new FormData();
    fd.append("ico_name", adding.name.trim());
    fd.append("file", adding.file);

    const res = await fetch(withBase("/api/icons"), { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data?.error || "Nie udało się dodać ikony");
      return;
    }
    setAdding(null);
    load();
  };

  // == Editing name only ==
  const startEdit = (ic: Icon) => {
    setEditing((e) => ({ ...e, [ic.ico_id]: { name: ic.ico_name } }));
  };
  const cancelEdit = (id: number) => {
    setEditing((e) => {
      const c = { ...e };
      delete c[id];
      return c;
    });
  };
  const saveEdit = async (id: number) => {
    const data = editing[id];
    if (!data || !data.name.trim()) return;
    setLoadingIds((s) => new Set(s).add(id));
    const res = await fetch(withBase(`/api/icons/${id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ico_name: data.name.trim() }),
    });
    setLoadingIds((s) => {
      const c = new Set(s);
      c.delete(id);
      return c;
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "Aktualizacja nie powiodła się");
      return;
    }
    cancelEdit(id);
    load();
  };

  // == Delete ==
  const deleteIcon = async (id: number) => {
    if (!confirm("Na pewno usunąć tę ikonę?")) return;
    const res = await fetch(withBase(`/api/icons/${id}`), { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "Nie udało się usunąć ikony");
      return;
    }
    load();
  };

  return (
    <Transition show as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="flex min-h-screen items-center justify-center px-4">
          {/* backdrop */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <DialogBackdrop className="fixed inset-0 bg-black/50" />
          </TransitionChild>

          {/* panel */}
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="relative bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-hidden flex flex-col overflow-x-hidden p-6 text-base">
              {/* header */}
              <div className="flex items-center justify-between p-4 border-b">
                <DialogTitle className="text-2xl font-semibold">Zarządzaj ikonami</DialogTitle>
                <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-700 transition cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* add new */}
              <div className="flex items-center gap-3 p-4 border-b">
                {adding ? (
                  <>
                    <input
                      type="text"
                      placeholder="Nazwa"
                      className="flex-1 min-w-0 border rounded px-2 py-1"
                      value={adding.name}
                      onChange={(e) => setAdding((a) => a && { ...a, name: e.target.value })}
                    />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp,.ico,.svg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          setAdding((a) => a && { ...a, file: f });
                        }}
                      />
                      <span className="px-3 py-1 border rounded text-sm">Wybierz plik</span>
                      <span className="text-sm text-gray-600 truncate w-[9rem] inline-block">
                        {adding.file ? adding.file.name : "Nie wybrano pliku"}
                      </span>
                    </label>
                    <button
                      onClick={saveAdd}
                      disabled={!adding.name.trim() || !adding.file}
                      className="text-green-600 px-3 py-1 border border-green-600 rounded hover:bg-green-50 disabled:opacity-50 transition cursor-pointer"
                    >
                      Zapisz
                    </button>
                    <button onClick={cancelAdd} className="text-red-600 px-3 py-1 border border-red-600 rounded hover:bg-red-50 transition cursor-pointer">
                      Anuluj
                    </button>
                  </>
                ) : (
                  <button onClick={startAdd} className="flex items-center gap-1 text-blue-600 px-3 py-1 border border-blue-600 rounded hover:bg-blue-50 transition cursor-pointer">
                    <Plus className="w-6 h-6" />
                    Dodaj nową ikonę
                  </button>
                )}
              </div>

              {/* table header */}
              <div className="grid grid-cols-[48px_1fr_11.5rem_9rem] gap-6 px-1 py-2 text-md font-medium border-b">
                <div>Podgląd</div>
                <div className="px-1">Nazwa</div>
                <div className="px-2">Plik</div>
                <div className="px-13">Akcje</div>
              </div>

              {/* list */}
              <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: "50vh" }}>
                {icons.map((ic) => {
                  const isEditing = Boolean(editing[ic.ico_id]);
                  const data = editing[ic.ico_id] || { name: "" };

                  return (
                    <div
                      key={ic.ico_id}
                      className="grid grid-cols-[48px_1fr_14rem_5rem] gap-4 items-center px-4 py-2 border-b min-w-0"
                      style={{ gridAutoRows: "3rem" }}
                    >
                      {/* preview always visible */}
                      <div>
                        <Image 
                          src={withBase(`/api/icon-files/${ic.ico_fileName}?v=${ic.ico_id}`)}
                          alt={ic.ico_name}
                          width={32}
                          height={32}
                          className="w-8 h-8"
                          unoptimized/>
                      </div>

                      {/* name (editable) */}
                      <div className="min-w-0">
                        {isEditing ? (
                          <input
                            className="w-full h-full border rounded px-2 py-1"
                            value={data.name}
                            onChange={(event) =>
                              setEditing((prev) => ({ ...prev, [ic.ico_id]: { name: event.target.value } }))
                            }
                          />
                        ) : (
                          <span className="block h-full leading-8 truncate" title={ic.ico_name}>
                            {ic.ico_name}
                          </span>
                        )}
                      </div>

                      {/* filename (read-only) */}
                      <div className="min-w-0">
                        <span className="block h-full leading-8 truncate w-[14rem]" title={ic.ico_fileName}>
                          {ic.ico_fileName}
                        </span>
                      </div>

                      {/* actions */}
                      <div className="flex justify-end gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveEdit(ic.ico_id)}
                              disabled={loadingIds.has(ic.ico_id) || !editing[ic.ico_id]?.name.trim()}
                              className="text-green-600 px-2 py-1 border border-green-600 rounded hover:bg-green-50 disabled:opacity-50 transition cursor-pointer"
                            >
                              Zapisz
                            </button>
                            <button
                              onClick={() => cancelEdit(ic.ico_id)}
                              className="text-red-600 px-2 py-1 border border-red-600 rounded hover:bg-red-50 transition cursor-pointer"
                            >
                              Anuluj
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(ic)}
                              className="text-blue-600 px-2 py-1 border border-blue-600 rounded hover:bg-blue-50 transition cursor-pointer"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => deleteIcon(ic.ico_id)}
                              disabled={ic.inUseCount > 0}
                              title={
                                ic.inUseCount > 0
                                  ? `Ikona używana w ${ic.inUseCount} linkach`
                                  : "Usuń ikonę"
                              }
                              className={`px-2 py-1 border rounded flex items-center justify-center ${
                                ic.inUseCount > 0
                                  ? "border-gray-300 text-gray-400 cursor-not-allowed"
                                  : "border-red-600 text-red-600 hover:bg-red-50 transition cursor-pointer"
                              }`}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}