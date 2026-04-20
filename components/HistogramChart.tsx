'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { computeHistogram } from '@/lib/filters';
import type { ImageData as DIPImageData } from '@/lib/filters';

interface HistogramChartProps {
  imageData: DIPImageData | null;
  title?: string;
  variant?: 'original' | 'processed';
}

export function HistogramChart({
  imageData,
  title = 'Histogram',
  variant = 'original',
}: HistogramChartProps) {
  const { data, stats } = useMemo(() => {
    if (!imageData) return { data: [], stats: null };

    const histogram = computeHistogram(imageData);
    const total = imageData.width * imageData.height;

    let sum = 0;
    let min = 255;
    let max = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
      if (histogram[i] > 0) {
        if (i < min) min = i;
        if (i > max) max = i;
      }
    }
    const mean = sum / total;

    // Downsample to 64 buckets for a cleaner chart
    const buckets = 64;
    const step = 256 / buckets;
    const chartData = [];
    for (let b = 0; b < buckets; b++) {
      const start = Math.floor(b * step);
      const end = Math.floor((b + 1) * step);
      let count = 0;
      for (let j = start; j < end; j++) count += histogram[j];
      chartData.push({ intensity: start, count });
    }

    return {
      data: chartData,
      stats: { mean, min, max },
    };
  }, [imageData]);

  const color = variant === 'processed' ? 'var(--chart-2)' : 'var(--chart-1)';
  const gradientId = `hist-gradient-${variant}`;

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
          <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </h4>
        </div>
        {stats && (
          <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
            <span>μ {stats.mean.toFixed(0)}</span>
            <span>
              [{stats.min}–{stats.max}]
            </span>
          </div>
        )}
      </div>
      <div className="h-28">
        {!imageData ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-muted-foreground">No data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="intensity"
                tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                ticks={[0, 64, 128, 192, 255]}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-md border border-border bg-popover px-2 py-1.5 shadow-md">
                        <p className="text-[10px] text-muted-foreground">
                          Intensity {payload[0].payload.intensity}
                        </p>
                        <p className="text-xs font-mono font-medium">
                          {Math.round(payload[0].payload.count).toLocaleString()} px
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
