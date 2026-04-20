'use client';

import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface FormulaDisplayProps {
  formula: string;
  className?: string;
  inline?: boolean;
}

export function FormulaDisplay({ formula, className = '', inline = false }: FormulaDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          throwOnError: false,
          displayMode: !inline,
        });
      } catch {
        if (containerRef.current) {
          containerRef.current.textContent = formula;
        }
      }
    }
  }, [formula, inline]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-x-auto text-center py-1 scrollbar-thin',
        className,
      )}
    />
  );
}
