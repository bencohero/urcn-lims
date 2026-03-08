import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Microscope, FlaskConical, X, Search } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearch } from '@/hooks/useSearch';
import { cn } from '@/lib/utils/utils';
import type { SearchResultItem } from '@/lib/api/search';

type SearchType = 'document' | 'equipment' | 'consumable';

const TYPE_LABELS: Record<SearchType, string> = {
  document: 'Documents',
  equipment: 'Équipements',
  consumable: 'Consommables',
};

const TYPE_ROUTES: Record<SearchType, string> = {
  document: 'documents',
  equipment: 'equipment',
  consumable: 'consumables',
};

function ResultIcon({ type }: { type: SearchType }) {
  const cls = 'h-5 w-5 shrink-0';
  if (type === 'document') return <FileText className={cn(cls, 'text-blue-500')} />;
  if (type === 'equipment') return <Microscope className={cn(cls, 'text-purple-500')} />;
  return <FlaskConical className={cn(cls, 'text-green-500')} />;
}

function ResultRow({
  item,
  onSelect,
}: {
  item: SearchResultItem;
  onSelect: (item: SearchResultItem) => void;
}) {
  const subtitleParts = [item.status, item.study, item.site].filter(Boolean);

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
    >
      <span className="mt-0.5">
        <ResultIcon type={item.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-gray-900">{item.title}</span>
        {subtitleParts.length > 0 && (
          <span className="block truncate text-sm text-gray-500">
            {subtitleParts.join(' · ')}
          </span>
        )}
      </span>
    </button>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-3 pb-1 pt-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="text-xs text-gray-400">{count}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
    </div>
  );
}

export function SearchModal() {
  const { searchOpen, setSearchOpen } = useUIStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<Set<SearchType>>(
    new Set(['document', 'equipment', 'consumable']),
  );

  const debouncedQuery = useDebounce(query, 300);

  const typesParam =
    selectedTypes.size === 3
      ? 'document,equipment,consumable'
      : Array.from(selectedTypes).join(',');

  const { data, isFetching } = useSearch({
    q: debouncedQuery,
    types: typesParam || undefined,
  });

  // Focus input when modal opens; reset state on close
  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setSelectedTypes(new Set(['document', 'equipment', 'consumable']));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Close on Escape
  useEffect(() => {
    if (!searchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      navigate(`/${TYPE_ROUTES[item.type]}/${item.id}`);
      setSearchOpen(false);
    },
    [navigate, setSearchOpen],
  );

  const toggleType = (type: SearchType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        // Keep at least one type selected
        if (next.size > 1) next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  if (!searchOpen) return null;

  const documents = data?.documents ?? [];
  const equipment = data?.equipment ?? [];
  const consumables = data?.consumables ?? [];
  const totalResults = documents.length + equipment.length + consumables.length;
  const hasResults = totalResults > 0;
  const queryTooShort = debouncedQuery.length < 2;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50"
      onClick={() => setSearchOpen(false)}
      aria-modal="true"
      role="dialog"
      aria-label="Recherche globale"
    >
      {/* Modal inner panel */}
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-auto mt-16"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          <Search className="h-5 w-5 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des documents, équipements, consommables…"
            className="flex-1 bg-transparent text-base text-gray-900 placeholder-gray-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setSearchOpen(false)}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fermer la recherche"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Type filters */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2">
          {(['document', 'equipment', 'consumable'] as SearchType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                selectedTypes.has(type)
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
              )}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Results area — scrollable */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Query too short */}
          {queryTooShort && !isFetching && (
            <div className="px-4 py-10 text-center text-sm text-gray-400">
              Tapez au moins 2 caractères pour lancer la recherche
            </div>
          )}

          {/* Loading */}
          {!queryTooShort && isFetching && <Spinner />}

          {/* No results */}
          {!queryTooShort && !isFetching && debouncedQuery.length >= 2 && !hasResults && (
            <div className="px-4 py-10 text-center text-sm text-gray-400">
              Aucun résultat pour «&nbsp;{debouncedQuery}&nbsp;»
            </div>
          )}

          {/* Results by section */}
          {!queryTooShort && !isFetching && hasResults && (
            <div className="pb-2">
              {selectedTypes.has('document') && documents.length > 0 && (
                <section>
                  <SectionHeader label="Documents" count={documents.length} />
                  {documents.map((item) => (
                    <ResultRow key={item.id} item={item} onSelect={handleSelect} />
                  ))}
                </section>
              )}

              {selectedTypes.has('equipment') && equipment.length > 0 && (
                <section>
                  <SectionHeader label="Équipements" count={equipment.length} />
                  {equipment.map((item) => (
                    <ResultRow key={item.id} item={item} onSelect={handleSelect} />
                  ))}
                </section>
              )}

              {selectedTypes.has('consumable') && consumables.length > 0 && (
                <section>
                  <SectionHeader label="Consommables" count={consumables.length} />
                  {consumables.map((item) => (
                    <ResultRow key={item.id} item={item} onSelect={handleSelect} />
                  ))}
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
