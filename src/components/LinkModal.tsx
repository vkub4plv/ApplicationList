"use client";

import { Fragment, useState, useEffect } from "react";
import { Globe, ChevronsUpDownIcon, CheckIcon } from "lucide-react";
import {
  Listbox,
  Transition,
  ListboxOptions,
  ListboxOption,
  ListboxButton,
  Label
} from "@headlessui/react";
import { withBase } from "@/lib/basePath";
import Image from "next/image";

export interface Icon {
  ico_id:      number;
  ico_name:    string;
  ico_fileName:string;
}

export interface LinkFormData {
  app_title: string;
  app_url:   string;
  ico_id:    number | null;
}

interface LinkModalProps {
  initialData: LinkFormData | null;
  onSave:      (data: LinkFormData) => Promise<void>;
  onCancel:    () => void;
}

export default function LinkModal({ initialData, onSave, onCancel }: LinkModalProps) {
  const [title, setTitle]     = useState(initialData?.app_title || "");
  const [url, setUrl]         = useState(initialData?.app_url   || "");
  const [iconId, setIconId]   = useState<number | null>(initialData?.ico_id ?? null);
  const [icons, setIcons]     = useState<Icon[]>([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    fetch(withBase("/api/icons"), { cache: "no-store" })
      .then(r => r.json() as Promise<Icon[]>)
      .then((data) => {
        data.sort((a, b) => a.ico_name.localeCompare(b.ico_name));
        setIcons(data);
      });
  }, []);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave({ app_title: title, app_url: url, ico_id: iconId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 className="text-2xl mb-4 font-semibold">
          {initialData ? "Edytuj aplikację" : "Dodaj aplikację"}
        </h2>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nazwa</label>
          <input
            type="text"
            className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        {/* URL */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">URL</label>
          <input
            type="url"
            className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>

        {/* Icon selector */}
        <div className="mb-6">
          <Listbox value={iconId} onChange={setIconId}>
            <Label className="block text-sm font-medium mb-1">Ikona</Label>
            <div className="relative">
              <ListboxButton className="relative w-full cursor-pointer border border-gray-300 bg-white rounded-md pl-3 pr-10 py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span className="flex items-center">
                  {iconId === null
                    ? <Globe className="w-5 h-5 text-gray-500 mr-2"/>
                    : <Image
                        src={withBase(`/api/icon-files/${icons.find(i=>i.ico_id===iconId)?.ico_fileName}?v=${iconId ?? 0}`)}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 mr-2"
                        unoptimized
                      />
                  }
                  <span className="block truncate">
                    {iconId === null
                      ? "— domyślna —"
                      : icons.find(i => i.ico_id === iconId)?.ico_name
                    }
                  </span>
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDownIcon className="w-5 h-5 text-gray-400"/>
                </span>
              </ListboxButton>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <ListboxOption
                    key={0}
                    value={null}
                    className={({ active }) =>
                      `cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                        active ? "bg-blue-100" : ""
                      }`
                    }
                  >
                    {({ selected, active }) => (
                      <>
                        <span className={`flex items-center truncate ${selected ? "font-semibold" : ""}`}>
                          <Globe className="w-5 h-5 text-gray-500 mr-2"/>
                          — domyślna —
                        </span>
                        {selected && (
                          <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${active ? "text-blue-600" : "text-blue-500"}`}>
                            <CheckIcon className="w-5 h-5"/>
                          </span>
                        )}
                      </>
                    )}
                  </ListboxOption>
                  {icons.map((ic) => (
                    <ListboxOption
                      key={ic.ico_id}
                      value={ic.ico_id}
                      className={({ active }) =>
                        `cursor-pointer select-none relative py-2 pl-3 pr-9 ${
                          active ? "bg-blue-100" : ""
                        }`
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`flex items-center truncate ${selected ? "font-semibold" : ""}`}>
                            <Image
                              src={withBase(`/api/icon-files/${ic.ico_fileName}?v=${ic.ico_id}`)}
                              alt={ic.ico_name}
                              width={20}
                              height={20}
                              className="w-5 h-5 mr-2"
                              unoptimized
                            />
                            {ic.ico_name}
                          </span>
                          {selected && (
                            <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${active ? "text-blue-600" : "text-blue-500"}`}>
                              <CheckIcon className="w-5 h-5"/>
                            </span>
                          )}
                        </>
                      )}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </Transition>
            </div>
          </Listbox>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            disabled={saving}
          >
            Anuluj
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={saving || !title.trim() || !url.trim()}
          >
            {saving ? "…Zapisywanie" : "Zapisz"}
          </button>
        </div>
      </div>
    </div>
  );
}
