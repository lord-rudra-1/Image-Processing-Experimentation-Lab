'use client';

import { useMemo, useState } from 'react';
import {
  ChevronRight,
  Sparkles,
  BarChart3,
  Grid3x3,
  Radio,
  Waves,
  Boxes,
  Search,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { FormulaDisplay } from './FormulaDisplay';
import {
  filterDefinitions,
  chapterMeta,
  getFilterById,
  type FilterDefinition,
} from '@/lib/filterDefinitions';
import { cn } from '@/lib/utils';

interface FilterPanelProps {
  selectedFilter: string | null;
  parameters: Record<string, number>;
  onFilterSelect: (filterId: string) => void;
  onParameterChange: (key: string, value: number) => void;
  onApply: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
}

const chapterIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  intensity: Sparkles,
  histogram: BarChart3,
  spatial: Grid3x3,
  frequency: Radio,
  restoration: Waves,
  morphology: Boxes,
};

export function FilterPanel({
  selectedFilter,
  parameters,
  onFilterSelect,
  onParameterChange,
  onApply,
  disabled = false,
  isProcessing = false,
}: FilterPanelProps) {
  const [openSections, setOpenSections] = useState<string[]>(
    Object.keys(filterDefinitions),
  );
  const [query, setQuery] = useState('');

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section],
    );
  };

  const selectedFilterDef: FilterDefinition | null = useMemo(
    () => (selectedFilter ? getFilterById(selectedFilter) ?? null : null),
    [selectedFilter],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return filterDefinitions;
    const q = query.trim().toLowerCase();
    const result: Record<string, FilterDefinition[]> = {};
    for (const [chapter, filters] of Object.entries(filterDefinitions)) {
      const match = filters.filter(
        f =>
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q),
      );
      if (match.length > 0) result[chapter] = match;
    }
    return result;
  }, [query]);

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold leading-tight">Filter Library</h2>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Gonzalez &amp; Woods · Chapters 2–7
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search filters..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={cn(
              'w-full rounded-md bg-muted/60 border border-transparent pl-8 pr-3 py-1.5',
              'text-xs placeholder:text-muted-foreground',
              'focus:outline-none focus:border-primary/50 focus:bg-muted',
              'transition-colors',
            )}
          />
        </div>
      </div>

      {/* Scrollable filter list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-2 space-y-1">
          {Object.entries(filtered).map(([chapter, filters]) => {
            const meta = chapterMeta[chapter];
            const Icon = meta ? chapterIcons[meta.key] : Sparkles;
            const isOpen = openSections.includes(chapter) || !!query.trim();

            return (
              <div key={chapter} className="rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(chapter)}
                  className={cn(
                    'group flex items-center justify-between w-full px-2.5 py-2 rounded-md',
                    'text-left transition-colors',
                    'hover:bg-sidebar-accent',
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-md flex-shrink-0"
                      style={{
                        backgroundColor: meta
                          ? `color-mix(in oklch, ${meta.accent} 18%, transparent)`
                          : 'var(--muted)',
                        color: meta?.accent ?? 'var(--foreground)',
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium leading-tight truncate">
                        {meta?.title ?? chapter}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">
                        {filters.length} filter{filters.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      'h-3.5 w-3.5 text-muted-foreground transition-transform flex-shrink-0',
                      isOpen && 'rotate-90',
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="pl-2 pt-0.5 pb-1 space-y-0.5">
                    {filters.map(filter => {
                      const isSelected = selectedFilter === filter.id;
                      return (
                        <button
                          key={filter.id}
                          onClick={() => onFilterSelect(filter.id)}
                          disabled={disabled}
                          className={cn(
                            'w-full text-left pl-9 pr-3 py-1.5 text-xs rounded-md transition-all',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            isSelected
                              ? 'bg-primary/15 text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <div className="absolute w-1 h-4 rounded-full bg-primary -ml-5" />
                            )}
                            <span className="truncate">{filter.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {Object.keys(filtered).length === 0 && (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-muted-foreground">
                No filters match &quot;{query}&quot;
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Selected filter details */}
      {selectedFilterDef && (
        <div className="border-t border-sidebar-border bg-sidebar-accent/40 p-4 space-y-3 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-sm leading-tight">
                {selectedFilterDef.name}
              </h3>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {selectedFilterDef.description}
            </p>
          </div>

          <div className="rounded-md bg-background/60 border border-border px-3 py-2">
            <FormulaDisplay formula={selectedFilterDef.formula} />
          </div>

          {selectedFilterDef.parameters.length > 0 && (
            <div className="space-y-3 pt-1">
              {selectedFilterDef.parameters.map(param => {
                const value = parameters[param.key] ?? param.default;
                return (
                  <div key={param.key} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-medium">{param.name}</label>
                      <span className="text-[11px] text-primary font-mono tabular-nums">
                        {param.step < 1 ? value.toFixed(2) : value}
                      </span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={([v]) => onParameterChange(param.key, v)}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      disabled={disabled}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <Button
            className="w-full"
            size="sm"
            onClick={onApply}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="h-3.5 w-3.5 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5 mr-2" />
                Apply Filter
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
