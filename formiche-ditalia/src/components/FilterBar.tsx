import { useState, useMemo, type ReactNode } from 'react';

export interface FilterConfig {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface Props<T> {
  items: T[];
  filters: FilterConfig[];
  searchField: keyof T;
  searchPlaceholder: string;
  renderItem: (item: T) => ReactNode;
  getFilterValue: (item: T, filterKey: string) => string | string[];
}

export default function FilterBar<T extends { id: string }>({
  items,
  filters,
  searchField,
  searchPlaceholder,
  renderItem,
  getFilterValue,
}: Props<T>) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (search) {
        const fieldVal = String(item[searchField] || '').toLowerCase();
        if (!fieldVal.includes(search.toLowerCase())) return false;
      }
      for (const [key, value] of Object.entries(activeFilters)) {
        if (!value) continue;
        const itemVal = getFilterValue(item, key);
        if (Array.isArray(itemVal)) {
          if (!itemVal.includes(value)) return false;
        } else {
          if (itemVal !== value) return false;
        }
      }
      return true;
    });
  }, [items, search, activeFilters, searchField, getFilterValue]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm"
        />
        {filters.map((filter) => (
          <select
            key={filter.key}
            value={activeFilters[filter.key] || ''}
            onChange={(e) =>
              setActiveFilters((prev) => ({ ...prev, [filter.key]: e.target.value }))
            }
            className="px-4 py-2.5 rounded-lg border border-gray-300 focus:border-forest-400 focus:ring-2 focus:ring-forest-200 outline-none transition-all text-sm bg-white"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} risultati
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12">
          Nessun risultato trovato.
        </p>
      )}
    </div>
  );
}
