'use client';

import { Activity, Gauge, Waves } from 'lucide-react';
import type { ImageMetrics } from '@/lib/metrics';

interface MetricsDisplayProps {
  metrics: ImageMetrics | null;
}

function MetricRow({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border/60 last:border-b-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted text-primary flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium">{label}</div>
          {hint && (
            <div className="text-[10px] text-muted-foreground truncate">{hint}</div>
          )}
        </div>
      </div>
      <span className="text-sm font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function MetricsDisplay({ metrics }: MetricsDisplayProps) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Quality Metrics
        </h4>
        <div className={`h-1.5 w-1.5 rounded-full ${metrics ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
      </div>

      {!metrics ? (
        <p className="text-xs text-muted-foreground leading-relaxed py-2">
          Apply a filter to compare original vs. processed image quality.
        </p>
      ) : (
        <div className="space-y-0">
          <MetricRow
            icon={<Activity className="h-3.5 w-3.5" />}
            label="MSE"
            hint="Mean Squared Error"
            value={metrics.mse.toFixed(2)}
          />
          <MetricRow
            icon={<Gauge className="h-3.5 w-3.5" />}
            label="PSNR"
            hint="Peak Signal-to-Noise"
            value={metrics.psnr === Infinity ? '∞ dB' : `${metrics.psnr.toFixed(2)} dB`}
          />
          <MetricRow
            icon={<Waves className="h-3.5 w-3.5" />}
            label="SSIM"
            hint="Structural Similarity"
            value={metrics.ssim.toFixed(4)}
          />
        </div>
      )}
    </div>
  );
}
