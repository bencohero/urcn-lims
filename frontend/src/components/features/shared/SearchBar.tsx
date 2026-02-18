import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils/utils';

interface SearchResult {
  id: string;
  type: 'DOCUMENT' | 'EQUIPMENT' | 'CONSUMABLE' | 'ACCESS_REQUEST';
  title: string;
  subtitle: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; route: string }> = {
  DOCUMENT: { label: 'Document', color: 'bg-blue-100 text-blue-700', route: '/documents' },
  EQUIPMENT: { label: 'Equipement', color: 'bg-green-100 text-green-700', route: '/equipment' },
  CONSUMABLE: { label: 'Consommable', color: 'bg-purple-100 text-purple-700', route: '/consumables' },
  ACCESS_REQUEST: { label: 'Demande', color: 'bg-orange-100 text-orange-700', route: '/access-requests' },
};

interface SearchBarProps {
  className?: string;
  onSearch?: (query: string) => Promise<SearchResult[]>;
}

export function SearchBar({ className, onSearch }: SearchBarProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim() || !onSearch) {
      setResults([]);
      return;
    }

    setLoading(true);
    onSearch(debouncedQuery)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debouncedQuery, onSearch]);

  const handleSelect = (result: SearchResult) => {
    const config = TYPE_CONFIG[result.type];
    if (config) {
      navigate(`${config.route}/${result.id}`);
    }
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Rechercher..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500">Recherche en cours...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">Aucun resultat</div>
          ) : (
            <ul className="max-h-64 overflow-auto py-1">
              {results.map((result) => {
                const config = TYPE_CONFIG[result.type];
                return (
                  <li key={result.id}>
                    <button
                      onClick={() => handleSelect(result)}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-50"
                    >
                      {config && (
                        <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-xs font-medium', config.color)}>
                          {config.label}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{result.title}</p>
                        <p className="truncate text-xs text-gray-500">{result.subtitle}</p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
