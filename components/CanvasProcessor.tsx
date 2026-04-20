'use client';

import { useEffect, useRef } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageData as DIPImageData } from '@/lib/filters';

interface CanvasProcessorProps {
  imageData: DIPImageData | null;
  className?: string;
  emptyLabel?: string;
  emptyDescription?: string;
  ariaLabel?: string;
}

export function CanvasProcessor({
  imageData,
  className = '',
  emptyLabel = 'No image',
  emptyDescription,
  ariaLabel = 'Image canvas',
}: CanvasProcessorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const imgData = new window.ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height,
    );
    ctx.putImageData(imgData, 0, 0);
  }, [imageData]);

  if (!imageData) {
    return (
      <div
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-xl',
          'border border-dashed border-border bg-card/40',
          'aspect-square md:aspect-[4/3] w-full overflow-hidden',
          className,
        )}
      >
        <div className="absolute inset-0 checker-bg opacity-30" />
        <div className="relative flex flex-col items-center gap-2 p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ImageOff className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground/80">{emptyLabel}</p>
          {emptyDescription && (
            <p className="text-xs text-muted-foreground max-w-[220px]">
              {emptyDescription}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-border bg-card/40',
        'flex items-center justify-center',
        className,
      )}
    >
      <div className="absolute inset-0 checker-bg opacity-30" aria-hidden />
      <canvas
        ref={canvasRef}
        aria-label={ariaLabel}
        className="relative z-10 max-w-full h-auto block"
      />
    </div>
  );
}
