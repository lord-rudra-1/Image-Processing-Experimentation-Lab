'use client';

import { useCallback, useState } from 'react';
import { Upload, ImageIcon, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ImageData as DIPImageData } from '@/lib/filters';

interface ImageUploaderProps {
  onImageLoad: (imageData: DIPImageData) => void;
  compact?: boolean;
}

export function ImageUploader({ onImageLoad, compact = false }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processImage = useCallback((file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsLoading(false);
          return;
        }

        // Limit size for performance — especially important for FFT operations
        const maxSize = 512;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        onImageLoad({
          data: new Uint8ClampedArray(imageData.data),
          width,
          height,
        });
        setIsLoading(false);
      };
      img.onerror = () => setIsLoading(false);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => setIsLoading(false);
    reader.readAsDataURL(file);
  }, [onImageLoad]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  }, [processImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  }, [processImage]);

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-all cursor-pointer group',
        compact ? 'p-6' : 'p-12',
        isDragging
          ? 'border-primary bg-primary/10 scale-[1.01]'
          : 'border-border hover:border-primary/60 hover:bg-muted/30',
        isLoading && 'pointer-events-none opacity-60',
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload"
        disabled={isLoading}
      />
      <label
        htmlFor="image-upload"
        className="cursor-pointer flex flex-col items-center gap-4 text-center"
      >
        <div
          className={cn(
            'flex items-center justify-center rounded-2xl transition-all',
            compact ? 'w-12 h-12' : 'w-16 h-16',
            isDragging
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary',
          )}
        >
          {isLoading ? (
            <div className="h-6 w-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isDragging ? (
            <Upload className={compact ? 'h-5 w-5' : 'h-7 w-7'} />
          ) : (
            <ImageIcon className={compact ? 'h-5 w-5' : 'h-7 w-7'} />
          )}
        </div>
        <div className="space-y-1">
          <p className={cn('font-medium', compact ? 'text-sm' : 'text-base')}>
            {isLoading
              ? 'Processing image…'
              : isDragging
                ? 'Drop your image to begin'
                : 'Drop an image or click to browse'}
          </p>
          {!compact && (
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Supports PNG, JPG, GIF, and WebP. Images are resized to 512px max for
              performant FFT and convolution operations.
            </p>
          )}
          {compact && (
            <p className="text-xs text-muted-foreground">
              PNG, JPG, GIF, or WebP
            </p>
          )}
        </div>
        {!compact && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileImage className="h-3 w-3" />
            <span>All processing happens locally in your browser</span>
          </div>
        )}
      </label>
    </div>
  );
}
