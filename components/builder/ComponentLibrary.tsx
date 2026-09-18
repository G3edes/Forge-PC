'use client';

import { Check, Filter, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Status';
import { CATALOG, getBrands, getPriceRange } from '@/data/components';
import { cn } from '@/lib/cn';
import { formatPrice, toSpecRows } from '@/lib/format';
import { useBuildStore } from '@/store/build-store';
import { CATEGORIES, CATEGORY_ORDER, type ComponentCategory, type PCComponent } from '@/types/components';

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'name';

const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Padrão',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  name: 'Nome (A-Z)',
};

/**
 * Left column: category picker, search, filters and the catalog list.
 * Every catalog entry is mock data — see `data/components.ts`.
 */
export function ComponentLibrary({
  category,
  onCategoryChange,
}: {
  category: ComponentCategory;
  onCategoryChange: (category: ComponentCategory) => void;
}) {
  const build = useBuildStore((state) => state.build);
  const addComponent = useBuildStore((state) => state.addComponent);

  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const brands = useMemo(() => getBrands(category), [category]);
  const priceRange = useMemo(() => getPriceRange(category), [category]);

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const list = (CATALOG[category] as PCComponent[]).filter((component) => {
      if (brand !== 'all' && component.brand !== brand) return false;
      if (maxPrice !== null && component.price > maxPrice) return false;
      if (!normalized) return true;

      const haystack = [
        component.name,
        component.brand,
        ...Object.values(component.specifications).map((value) =>
          Array.isArray(value) ? value.join(' ') : String(value),
        ),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalized);
    });

    switch (sort) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price);
      case 'name':
        return [...list].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return list;
    }
  }, [brand, category, maxPrice, query, sort]);

  const selectedId = (() => {
    if (category === 'fans') return null;
    const current = build[category];
    return current && !Array.isArray(current) ? current.id : null;
  })();

  const fanQuantities = useMemo(() => {
    const map = new Map<string, number>();
    for (const fan of build.fans) map.set(fan.component.id, fan.quantity);
    return map;
  }, [build.fans]);

  const filtersActive = brand !== 'all' || maxPrice !== null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Category tabs */}
      <div className="border-b border-line-soft p-2">
        <div className="grid grid-cols-3 gap-1 lg:grid-cols-2 xl:grid-cols-3">
          {CATEGORY_ORDER.map((id) => {
            const meta = CATEGORIES[id];
            const filled =
              id === 'fans' ? build.fans.length > 0 : Boolean(build[id]);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onCategoryChange(id)}
                className={cn(
                  'focus-ring relative flex flex-col items-start gap-0.5 rounded-lg border px-2 py-1.5 text-left transition-colors',
                  category === id
                    ? 'border-accent/60 bg-accent/10 text-ink'
                    : 'border-transparent text-ink-muted hover:border-line hover:bg-surface-2',
                )}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {meta.shortLabel}
                </span>
                {filled ? (
                  <Check size={11} className="absolute right-1.5 top-1.5 text-ok" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + filters */}
      <div className="space-y-2 border-b border-line-soft p-3">
        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Buscar em ${CATEGORIES[category].label.toLowerCase()}…`}
            aria-label="Buscar componente"
            className="focus-ring h-9 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-8 text-xs text-ink placeholder:text-ink-faint"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpar busca"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-faint hover:text-ink"
            >
              <X size={12} />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={cn(
              'focus-ring inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] uppercase tracking-wider transition-colors',
              showFilters || filtersActive
                ? 'border-accent/50 text-accent-soft'
                : 'border-line text-ink-faint hover:text-ink',
            )}
          >
            <Filter size={11} />
            Filtros
            {filtersActive ? <span className="size-1.5 rounded-full bg-accent" /> : null}
          </button>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            aria-label="Ordenar"
            className="focus-ring ml-auto h-7 rounded-md border border-line bg-surface-2 px-2 text-[11px] text-ink-muted"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {showFilters ? (
          <div className="animate-fade-in space-y-3 rounded-lg border border-line-soft bg-surface-2/60 p-3">
            <label className="block">
              <span className="panel-heading">Marca</span>
              <select
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                className="focus-ring mt-1 h-8 w-full rounded-md border border-line bg-surface px-2 text-xs text-ink"
              >
                <option value="all">Todas</option>
                {brands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="panel-heading">
                Preço máximo — {maxPrice === null ? 'sem limite' : formatPrice(maxPrice)}
              </span>
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                step={50}
                value={maxPrice ?? priceRange.max}
                onChange={(event) => setMaxPrice(Number(event.target.value))}
                className="mt-2 w-full"
              />
            </label>

            {filtersActive ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setBrand('all');
                  setMaxPrice(null);
                }}
              >
                Limpar filtros
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Results */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <p className="mb-2 text-[10px] uppercase tracking-wider text-ink-faint">
          {items.length} {items.length === 1 ? 'resultado' : 'resultados'}
        </p>

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-6 text-center text-xs text-ink-faint">
            Nenhum componente encontrado com esses filtros.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((component) => (
              <li key={component.id}>
                <ComponentCard
                  component={component}
                  selected={component.id === selectedId}
                  quantity={fanQuantities.get(component.id) ?? 0}
                  onAdd={() => addComponent(component)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ComponentCard({
  component,
  selected,
  quantity,
  onAdd,
}: {
  component: PCComponent;
  selected: boolean;
  quantity: number;
  onAdd: () => void;
}) {
  const specs = useMemo(() => toSpecRows(component.specifications).slice(0, 3), [component]);
  const isFan = component.category === 'fans';
  const inBuild = selected || quantity > 0;

  return (
    <article
      className={cn(
        'group rounded-lg border p-3 transition-colors',
        inBuild
          ? 'border-accent/50 bg-accent/5'
          : 'border-line-soft bg-surface-2/40 hover:border-line hover:bg-surface-2',
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-ink-faint">{component.brand}</p>
          <h3 className="truncate text-sm font-medium text-ink">{component.name}</h3>
        </div>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-ink">
          {formatPrice(component.price)}
        </span>
      </header>

      <dl className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {specs.map((spec) => (
          <div key={spec.key} className="flex items-baseline gap-1">
            <dt className="text-[10px] text-ink-faint">{spec.label}</dt>
            <dd className="text-[11px] text-ink-muted">{spec.value}</dd>
          </div>
        ))}
      </dl>

      <footer className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          variant={inBuild && !isFan ? 'outline' : 'primary'}
          icon={<Plus size={13} />}
          onClick={onAdd}
          className="flex-1"
        >
          {isFan ? 'Adicionar' : inBuild ? 'Selecionado' : 'Adicionar'}
        </Button>
        {isFan && quantity > 0 ? <Badge tone="accent">{quantity}x na build</Badge> : null}
        {!isFan && selected ? <Badge tone="accent">Na build</Badge> : null}
      </footer>
    </article>
  );
}
