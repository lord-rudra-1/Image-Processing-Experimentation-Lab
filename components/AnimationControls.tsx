'use client';

import { Play, Pause, RotateCcw, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AnimationControlsProps {
  isPlaying: boolean;
  progress: number;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onProgressChange: (progress: number) => void;
  disabled?: boolean;
}

export function AnimationControls({
  isPlaying,
  progress,
  speed,
  onPlay,
  onPause,
  onReset,
  onSpeedChange,
  onProgressChange,
  disabled = false,
}: AnimationControlsProps) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Transition Animation
          </h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Blend from original to processed image
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={isPlaying ? onPause : onPlay}
            disabled={disabled}
            className="h-8 w-8"
            aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onReset}
            disabled={disabled}
            className="h-8 w-8"
            aria-label="Reset animation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Blend progress</span>
          <span className="font-mono tabular-nums">{Math.round(progress * 100)}%</span>
        </div>
        <Slider
          value={[progress]}
          onValueChange={([value]) => onProgressChange(value)}
          min={0}
          max={1}
          step={0.01}
          disabled={disabled || isPlaying}
          aria-label="Animation progress"
        />
      </div>

      <div className="flex items-center gap-3">
        <Gauge className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground">Speed</span>
          <Slider
            value={[speed]}
            onValueChange={([value]) => onSpeedChange(value)}
            min={0.25}
            max={3}
            step={0.25}
            disabled={disabled}
            className="flex-1"
            aria-label="Animation speed"
          />
          <span className="text-[11px] font-mono tabular-nums w-8 text-right">{speed}×</span>
        </div>
      </div>
    </div>
  );
}
