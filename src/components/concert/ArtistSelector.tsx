"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/providers/LocaleProvider";

export interface ArtistOption {
  id: string;
  username: string;
  display_name: string;
  image_url: string | null;
}

type SelectedEntry = { kind: "registered"; artist: ArtistOption } | { kind: "free"; name: string };

interface ArtistSelectorProps {
  value: string[];
  freeNames?: string[];
  onChange: (ids: string[], names: string[]) => void;
  onSelectionChange?: (artists: ArtistOption[]) => void;
}

export function ArtistSelector({
  value,
  freeNames = [],
  onChange,
  onSelectionChange,
}: ArtistSelectorProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtistOption[]>([]);
  // Artistas libres se inicializan directamente; registrados se cargan async
  const [selected, setSelected] = useState<SelectedEntry[]>(() =>
    freeNames.map((n) => ({ kind: "free" as const, name: n }))
  );
  const [open, setOpen] = useState(false);
  const [showSuggested, setShowSuggested] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar etiquetas de artistas registrados al montar (solo fetch async)
  useEffect(() => {
    if (value.length === 0) return;
    const freeEntries: SelectedEntry[] = freeNames.map((n) => ({ kind: "free", name: n }));
    void fetch(`/api/profiles/artists/by-ids?ids=${value.join(",")}`)
      .then((r) => r.json() as Promise<ArtistOption[]>)
      .then((artists) => {
        const registered: SelectedEntry[] = artists.map((a) => ({
          kind: "registered" as const,
          artist: a,
        }));
        setSelected([...registered, ...freeEntries]);
        onSelectionChange?.(artists);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function emitChange(entries: SelectedEntry[]) {
    const ids = entries.flatMap((e) => (e.kind === "registered" ? [e.artist.id] : []));
    const names = entries.flatMap((e) => (e.kind === "free" ? [e.name] : []));
    onChange(ids, names);
    onSelectionChange?.(entries.flatMap((e) => (e.kind === "registered" ? [e.artist] : [])));
  }

  const fetchSuggested = useCallback(() => {
    void fetch("/api/profiles/artists")
      .then((r) => r.json() as Promise<ArtistOption[]>)
      .then(setResults)
      .catch(() => {});
  }, []);

  const search = useCallback((q: string) => {
    void fetch(`/api/profiles/artists?q=${encodeURIComponent(q)}`)
      .then((r) => r.json() as Promise<ArtistOption[]>)
      .then(setResults)
      .catch(() => {});
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    setShowSuggested(!q);
    clearTimeout(debounceRef.current);
    if (q) {
      debounceRef.current = setTimeout(() => search(q), 300);
    } else {
      fetchSuggested();
    }
  }

  function handleFocus() {
    setOpen(true);
    if (!query) {
      setShowSuggested(true);
      fetchSuggested();
    }
  }

  function addRegistered(artist: ArtistOption) {
    if (selected.some((e) => e.kind === "registered" && e.artist.id === artist.id)) return;
    const next = [...selected, { kind: "registered" as const, artist }];
    setSelected(next);
    emitChange(next);
    setQuery("");
    setResults([]);
    setOpen(false);
    setShowSuggested(false);
  }

  function addFree(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (selected.some((e) => e.kind === "free" && e.name.toLowerCase() === trimmed.toLowerCase()))
      return;
    const next = [...selected, { kind: "free" as const, name: trimmed }];
    setSelected(next);
    emitChange(next);
    setQuery("");
    setResults([]);
    setOpen(false);
    setShowSuggested(false);
  }

  function remove(entry: SelectedEntry) {
    const next = selected.filter((e) => e !== entry);
    setSelected(next);
    emitChange(next);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const visibleResults = results.filter(
    (r) => !selected.some((s) => s.kind === "registered" && s.artist.id === r.id)
  );
  const canAddFree = query.trim().length >= 2;
  const dropdownVisible = open && (visibleResults.length > 0 || canAddFree);

  return (
    <div ref={containerRef} className="grid gap-2">
      {/* Chips de artistas seleccionados */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((entry, i) => (
            <span
              key={entry.kind === "registered" ? entry.artist.id : `free-${i}`}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                entry.kind === "registered"
                  ? "bg-secondary text-secondary-foreground"
                  : "border border-dashed border-muted-foreground/40 bg-muted text-muted-foreground"
              }`}
            >
              {entry.kind === "registered" ? entry.artist.display_name : entry.name}
              {entry.kind === "free" && (
                <span className="ml-0.5 opacity-50 text-[10px]">·sin perfil</span>
              )}
              <button
                type="button"
                onClick={() => remove(entry)}
                className="hover:text-destructive ml-1"
                aria-label={`${t.artistSelector.removeArtist} ${
                  entry.kind === "registered" ? entry.artist.display_name : entry.name
                }`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input de búsqueda */}
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={t.artistSelector.searchPlaceholder}
          className="pl-9"
        />

        {dropdownVisible && (
          <ul className="bg-popover border-border absolute z-50 mt-1 w-full rounded-md border shadow-md">
            {showSuggested && visibleResults.length > 0 && (
              <li className="border-border border-b px-3 py-1.5">
                <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  {t.concert.artistsSuggested}
                </span>
              </li>
            )}
            {visibleResults.map((artist) => (
              <li key={artist.id}>
                <button
                  type="button"
                  className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                  onClick={() => addRegistered(artist)}
                >
                  <span className="font-medium">{artist.display_name}</span>
                  <span className="text-muted-foreground">@{artist.username}</span>
                </button>
              </li>
            ))}
            {canAddFree && (
              <li className={visibleResults.length > 0 ? "border-t border-border" : ""}>
                <button
                  type="button"
                  className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground"
                  onClick={() => addFree(query)}
                >
                  <UserPlus className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{t.artistSelector.addFreetext.replace("{name}", query.trim())}</span>
                </button>
              </li>
            )}
          </ul>
        )}

        {open && query.length >= 2 && visibleResults.length === 0 && !canAddFree && (
          <div className="bg-popover border-border absolute z-50 mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-md">
            <span className="text-muted-foreground">{t.artistSelector.noResults}</span>
          </div>
        )}
      </div>
    </div>
  );
}
