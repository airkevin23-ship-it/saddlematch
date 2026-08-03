"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { groupedNeighbourhoods, neighbourhoodById } from "@/lib/constants";

// Searchable, section-grouped neighbourhood picker.
//
// A plain <select> with 24 flat options is a lot to scroll on a phone,
// and it loses the Austin / North / South / West / East grouping that
// tells someone how far away a place actually is. This keeps the
// grouping visible and lets people type to narrow it.

export default function NeighbourhoodSelect({
  value,
  onChange,
  label = "Where you're based",
  placeholder = "Search neighbourhoods…",
}: {
  value: number | null;
  onChange: (id: number) => void;
  label?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = neighbourhoodById(value);
  const groups = useMemo(() => groupedNeighbourhoods(query), [query]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  // Close on outside click and on Escape, so it behaves like a real select.
  useEffect(() => {
    if (!open) return;
    function onDocClick(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function pick(id: number) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative" ref={wrapRef}>
      <span className="block text-sm font-bold text-ink">{label}</span>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="mt-2 flex min-h-12 w-full items-center justify-between rounded-xl border border-line bg-cream px-3 py-2 text-left text-base outline-none focus:border-brand"
      >
        <span className={selected ? "font-semibold text-ink" : "text-ink-faint"}>
          {selected ? selected.name : "Choose your neighbourhood"}
        </span>
        <span aria-hidden="true" className="ml-2 text-ink-faint">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-line bg-card shadow-xl">
          <div className="border-b border-line p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-line bg-cream px-3 py-2 text-base outline-none focus:border-brand"
            />
          </div>

          <div className="max-h-72 overflow-y-auto" role="listbox">
            {flat.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink-faint">
                No neighbourhood matches “{query}”.
              </p>
            )}

            {groups.map((group) => (
              <div key={group.section}>
                <p className="sticky top-0 bg-cream px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                  {group.section}
                </p>
                {group.items.map((item) => {
                  const isSelected = item.id === value;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => pick(item.id)}
                      className={`flex min-h-11 w-full items-center justify-between px-4 text-left text-base ${
                        isSelected ? "bg-brand-soft font-bold text-brand-dark" : "hover:bg-cream"
                      }`}
                    >
                      {item.name}
                      {isSelected && <span aria-hidden="true">✓</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
