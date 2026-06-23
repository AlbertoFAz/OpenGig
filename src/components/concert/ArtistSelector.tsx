"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/providers/LocaleProvider";

interface ArtistOption {
  id: string;
  username: string;
  display_name: string;
  image_url: string | null;
}

interface ArtistSelectorProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

export function ArtistSelector({ value, onChange }: ArtistSelectorProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArtistOption[]>([]);
  const [selected, setSelected] = useState<ArtistOption[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cargar etiquetas de los artistas ya seleccionados al montar
  useEffect(() => {
    if (value.length === 0) return;
    void fetch(`/api/profiles/artists/by-ids?ids=${value.join(",")}`)
      .then((r) => r.json() as Promise<ArtistOption[]>)
      .then((artists) => setSelected(artists))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const search = useCallback((q: string) => {
    if (!q) {
      setResults([]);
      return;
    }
    void fetch(`/api/profiles/artists?q=${encodeURIComponent(q)}`)
      .then((r) => r.json() as Promise<ArtistOption[]>)
      .then(setResults)
      .catch(() => {});
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    setOpen(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  }

  function addArtist(artist: ArtistOption) {
    if (selected.some((a) => a.id === artist.id)) return;
    const next = [...selected, artist];
    setSelected(next);
    onChange(next.map((a) => a.id));
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function removeArtist(id: string) {
    const next = selected.filter((a) => a.id !== id);
    setSelected(next);
    onChange(next.map((a) => a.id));
  }

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="grid gap-2">
      {/* Artistas seleccionados */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((artist) => (
            <span
              key={artist.id}
              className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              {artist.display_name}
              <button
                type="button"
                onClick={() => removeArtist(artist.id)}
                className="hover:text-destructive ml-1"
                aria-label={`${t.artistSelector.removeArtist} ${artist.display_name}`}
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
          onFocus={() => query && setOpen(true)}
          placeholder={t.artistSelector.searchPlaceholder}
          className="pl-9"
        />

        {/* Dropdown de resultados */}
        {open && results.length > 0 && (
          <ul className="bg-popover border-border absolute z-50 mt-1 w-full rounded-md border shadow-md">
            {results.map((artist) => (
              <li key={artist.id}>
                <button
                  type="button"
                  className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                  onClick={() => addArtist(artist)}
                >
                  <span className="font-medium">{artist.display_name}</span>
                  <span className="text-muted-foreground">@{artist.username}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {open && query.length >= 2 && results.length === 0 && (
          <div className="bg-popover border-border absolute z-50 mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-md">
            <span className="text-muted-foreground">{t.artistSelector.noResults}</span>
          </div>
        )}
      </div>
    </div>
  );
}
