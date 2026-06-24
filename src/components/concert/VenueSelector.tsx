"use client";

import { useCallback, useEffect as useClickOutside, useRef, useState } from "react";
import { MapPin, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { VenueOption } from "@/app/api/venues/route";

interface VenueSelectorProps {
  value: string;
  onChange: (name: string, profileId?: string) => void;
}

export function VenueSelector({ value, onChange }: VenueSelectorProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<VenueOption[]>([]);
  const [open, setOpen] = useState(false);
  const [showSuggested, setShowSuggested] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggested = useCallback(() => {
    void fetch("/api/venues")
      .then((r) => r.json() as Promise<VenueOption[]>)
      .then(setResults)
      .catch(() => {});
  }, []);

  const search = useCallback((q: string) => {
    void fetch(`/api/venues?q=${encodeURIComponent(q)}`)
      .then((r) => r.json() as Promise<VenueOption[]>)
      .then(setResults)
      .catch(() => {});
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    onChange(q, undefined); // Free text actualiza el valor inmediatamente
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

  function selectVenue(option: VenueOption) {
    setQuery(option.name);
    onChange(option.name, option.id);
    setResults([]);
    setOpen(false);
    setShowSuggested(false);
  }

  useClickOutside(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const dropdownVisible = open && results.length > 0;

  return (
    <div ref={containerRef} className="relative">
      <MapPin className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={t.concert.venueSearch}
        className="pl-9"
      />

      {dropdownVisible && (
        <ul className="bg-popover border-border absolute z-50 mt-1 w-full rounded-md border shadow-md">
          {showSuggested && (
            <li className="border-border border-b px-3 py-1.5">
              <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                {t.concert.venueSuggested}
              </span>
            </li>
          )}
          {results.map((option, i) => (
            <li key={`${option.type}-${option.id ?? option.name}-${i}`}>
              <button
                type="button"
                className="hover:bg-accent flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                onClick={() => selectVenue(option)}
              >
                {option.type === "profile" ? (
                  <Building2 className="text-muted-foreground size-3.5 shrink-0" />
                ) : (
                  <MapPin className="text-muted-foreground size-3.5 shrink-0" />
                )}
                <span className="font-medium">{option.name}</span>
                {option.username && (
                  <span className="text-muted-foreground">@{option.username}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
