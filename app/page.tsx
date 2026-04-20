'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Download,
  Info,
  Upload,
  Sparkles,
  BarChart3,
  Grid3x3,
  Radio,
  Waves,
  Boxes,
  GitCompare,
  Layers,
  X,
  FlaskConical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ImageUploader } from '@/components/ImageUploader';
import { CanvasProcessor } from '@/components/CanvasProcessor';
import { FilterPanel } from '@/components/FilterPanel';
import { MetricsDisplay } from '@/components/MetricsDisplay';
import { HistogramChart } from '@/components/HistogramChart';
import { AnimationControls } from '@/components/AnimationControls';
import { FormulaDisplay } from '@/components/FormulaDisplay';
import {
  getFilterById,
  getChapterForFilter,
} from '@/lib/filterDefinitions';
import { calculateAllMetrics, type ImageMetrics } from '@/lib/metrics';
import { interpolateImages } from '@/lib/animation';
import {
  fft2d,
  getMagnitudeSpectrum,
  applyFrequencyFilter,
} from '@/lib/fft';
import * as filters from '@/lib/filters';
import type { ImageData as DIPImageData } from '@/lib/filters';

const features = [
  { icon: Sparkles, label: 'Intensity transforms', desc: 'Negative, log, gamma, contrast stretching' },
  { icon: BarChart3, label: 'Histogram analysis', desc: 'Equalization and distribution charts' },
  { icon: Grid3x3, label: 'Spatial filtering', desc: 'Mean, Gaussian, Sobel, Laplacian, sharpen' },
  { icon: Radio, label: 'Frequency domain', desc: 'FFT, ideal / Butterworth / Gaussian filters' },
  { icon: Waves, label: 'Noise & restoration', desc: 'Gaussian, salt & pepper, motion, median' },
  { icon: Boxes, label: 'Morphology', desc: 'Erode, dilate, open, close, boundary' },
];

function applyFilterLogic(
  image: DIPImageData,
  filterId: string,
  params: Record<string, number>,
): { result: DIPImageData; spectrum: DIPImageData | null } {
  switch (filterId) {
    case 'negative':
      return { result: filters.negativeTransform(image), spectrum: null };
    case 'log':
      return { result: filters.logTransform(image, params.c ?? 45), spectrum: null };
    case 'gamma':
      return {
        result: filters.gammaTransform(image, params.gamma ?? 1, params.c ?? 1),
        spectrum: null,
      };
    case 'contrast':
      return {
        result: filters.contrastStretch(
          image,
          params.r1 ?? 70,
          params.s1 ?? 0,
          params.r2 ?? 180,
          params.s2 ?? 255,
        ),
        spectrum: null,
      };
    case 'bitplane':
      return { result: filters.bitPlaneSlice(image, params.bitPlane ?? 7), spectrum: null };
    case 'histogram-eq':
      return { result: filters.histogramEqualization(image), spectrum: null };
    case 'mean':
      return { result: filters.meanFilter(image, params.size ?? 3), spectrum: null };
    case 'gaussian':
      return { result: filters.gaussianFilter(image, params.sigma ?? 1), spectrum: null };
    case 'laplacian':
      return { result: filters.laplacianFilter(image), spectrum: null };
    case 'sobel':
      return { result: filters.sobelFilter(image), spectrum: null };
    case 'prewitt':
      return { result: filters.prewittFilter(image), spectrum: null };
    case 'sharpen':
      return { result: filters.sharpenFilter(image, params.amount ?? 1), spectrum: null };
    case 'fft': {
      const spec = getMagnitudeSpectrum(fft2d(image));
      return { result: spec, spectrum: spec };
    }
    case 'idealLP':
    case 'idealHP':
    case 'butterworthLP':
    case 'butterworthHP':
    case 'gaussianLP':
    case 'gaussianHP': {
      const res = applyFrequencyFilter(
        image,
        filterId,
        params.cutoff ?? 30,
        params.order ?? 2,
      );
      return { result: res.filtered, spectrum: res.filteredSpectrum };
    }
    case 'gaussianNoise':
      return {
        result: filters.addGaussianNoise(image, params.mean ?? 0, params.stddev ?? 25),
        spectrum: null,
      };
    case 'saltPepper':
      return {
        result: filters.addSaltPepperNoise(image, params.density ?? 0.05),
        spectrum: null,
      };
    case 'motionBlur':
      return {
        result: filters.motionBlur(image, params.length ?? 15, params.angle ?? 0),
        spectrum: null,
      };
    case 'median':
      return { result: filters.medianFilter(image, params.size ?? 3), spectrum: null };
    case 'erosion':
      return { result: filters.erode(image, params.kernelSize ?? 3), spectrum: null };
    case 'dilation':
      return { result: filters.dilate(image, params.kernelSize ?? 3), spectrum: null };
    case 'opening':
      return { result: filters.opening(image, params.kernelSize ?? 3), spectrum: null };
    case 'closing':
      return { result: filters.closing(image, params.kernelSize ?? 3), spectrum: null };
    case 'boundary':
      return {
        result: filters.boundaryExtraction(image, params.kernelSize ?? 3),
        spectrum: null,
      };
    default:
      return { result: image, spectrum: null };
  }
}

export default function Home() {
  const [originalImage, setOriginalImage] = useState<DIPImageData | null>(null);
  const [processedImage, setProcessedImage] = useState<DIPImageData | null>(null);
  const [displayImage, setDisplayImage] = useState<DIPImageData | null>(null);
  const [spectrumImage, setSpectrumImage] = useState<DIPImageData | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [metrics, setMetrics] = useState<ImageMetrics | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [activeTab, setActiveTab] = useState('spatial');
  const [isProcessing, setIsProcessing] = useState(false);

  const animationRef = useRef<number | null>(null);

  // Handle image upload
  const handleImageLoad = useCallback((imageData: DIPImageData) => {
    setOriginalImage(imageData);
    setProcessedImage(null);
    setDisplayImage(imageData);
    setSpectrumImage(null);
    setMetrics(null);
    setAnimationProgress(0);
  }, []);

  const handleReset = useCallback(() => {
    setOriginalImage(null);
    setProcessedImage(null);
    setDisplayImage(null);
    setSpectrumImage(null);
    setMetrics(null);
    setSelectedFilter(null);
    setParameters({});
    setAnimationProgress(0);
  }, []);

  // Handle filter selection
  const handleFilterSelect = useCallback((filterId: string) => {
    setSelectedFilter(filterId);
    const filterDef = getFilterById(filterId);
    if (filterDef) {
      const defaultParams: Record<string, number> = {};
      filterDef.parameters.forEach(p => {
        defaultParams[p.key] = p.default;
      });
      setParameters(defaultParams);
    }
    // Auto-switch to frequency tab for frequency filters
    if (filterId === 'fft' || filterId.includes('LP') || filterId.includes('HP')) {
      setActiveTab('frequency');
    }
  }, []);

  const handleParameterChange = useCallback((key: string, value: number) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Apply filter — deferred so the UI can show the loading state
  const applyFilter = useCallback(() => {
    if (!originalImage || !selectedFilter) return;

    setIsProcessing(true);

    // Defer the heavy work so React can render the loading state first
    setTimeout(() => {
      try {
        const { result, spectrum } = applyFilterLogic(
          originalImage,
          selectedFilter,
          parameters,
        );

        setProcessedImage(result);
        setDisplayImage(result);
        setSpectrumImage(spectrum);
        setAnimationProgress(1);

        // Calculate metrics (skip for FFT-only visualization)
        if (selectedFilter !== 'fft') {
          const imageMetrics = calculateAllMetrics(originalImage, result);
          setMetrics(imageMetrics);
        } else {
          setMetrics(null);
        }
      } catch (err) {
        console.error('[v0] Filter application failed:', err);
      } finally {
        setIsProcessing(false);
      }
    }, 30);
  }, [originalImage, selectedFilter, parameters]);

  // Animation controls
  const startAnimation = useCallback(() => {
    if (!originalImage || !processedImage) return;

    setIsAnimating(true);
    const startTime = performance.now();
    const duration = 1500 / animationSpeed;
    const startProgress = animationProgress >= 1 ? 0 : animationProgress;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(
        startProgress + (elapsed / duration) * (1 - startProgress),
        1,
      );

      setAnimationProgress(progress);
      const interpolated = interpolateImages(originalImage, processedImage, progress);
      setDisplayImage(interpolated);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [originalImage, processedImage, animationSpeed, animationProgress]);

  const pauseAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsAnimating(false);
  }, []);

  const resetAnimation = useCallback(() => {
    pauseAnimation();
    setAnimationProgress(0);
    setDisplayImage(originalImage);
  }, [originalImage, pauseAnimation]);

  const handleProgressChange = useCallback(
    (progress: number) => {
      if (!originalImage || !processedImage) return;
      setAnimationProgress(progress);
      const interpolated = interpolateImages(originalImage, processedImage, progress);
      setDisplayImage(interpolated);
    },
    [originalImage, processedImage],
  );

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Download processed image
  const downloadImage = useCallback(() => {
    if (!displayImage) return;

    const canvas = document.createElement('canvas');
    canvas.width = displayImage.width;
    canvas.height = displayImage.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgData = new window.ImageData(
      new Uint8ClampedArray(displayImage.data),
      displayImage.width,
      displayImage.height,
    );
    ctx.putImageData(imgData, 0, 0);

    const link = document.createElement('a');
    link.download = `dip-${selectedFilter ?? 'processed'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [displayImage, selectedFilter]);

  const selectedFilterDef = selectedFilter ? getFilterById(selectedFilter) : null;
  const selectedChapter = selectedFilter ? getChapterForFilter(selectedFilter) : null;

  const imageInfo = useMemo(() => {
    if (!originalImage) return null;
    return {
      width: originalImage.width,
      height: originalImage.height,
      pixels: originalImage.width * originalImage.height,
    };
  }, [originalImage]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between px-4 md:px-6 h-14">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <FlaskConical className="h-4 w-4" />
              </div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-base font-semibold tracking-tight">DIP Studio</h1>
                <span className="text-[11px] text-muted-foreground hidden md:inline">
                  Digital Image Processing · Gonzalez &amp; Woods
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {originalImage && (
                <>
                  <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted/60 text-[11px] text-muted-foreground font-mono">
                    <span>{imageInfo?.width}×{imageInfo?.height}</span>
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    <span>{imageInfo?.pixels.toLocaleString()}px</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs"
                  >
                    <X className="h-3.5 w-3.5 mr-1.5" />
                    New image
                  </Button>
                </>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs leading-relaxed">
                    Interactive DIP simulator. Upload an image, pick a filter from the
                    textbook chapters on the left, tune parameters, and watch the
                    transformation animate.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </header>

        {/* ─── Welcome / empty state ─── */}
        {!originalImage ? (
          <main className="flex-1 flex items-center justify-center bg-grid">
            <div className="max-w-3xl w-full mx-auto px-4 py-10 md:py-16 space-y-10">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] text-muted-foreground">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Runs entirely in your browser
                </div>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                  An interactive lab for{' '}
                  <span className="text-primary">Digital Image Processing</span>
                </h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed text-pretty">
                  Explore every core transformation from Gonzalez &amp; Woods — intensity
                  mappings, spatial and frequency-domain filters, noise models,
                  restoration, and morphology — with formulas, animations, and real-time
                  quality metrics.
                </p>
              </div>

              <div className="max-w-xl mx-auto">
                <ImageUploader onImageLoad={handleImageLoad} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {features.map(f => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.label}
                      className="rounded-xl border border-border bg-card/40 p-4"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 text-primary mb-2">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-xs font-medium mb-0.5">{f.label}</div>
                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                        {f.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        ) : (
          // ─── Main workspace ───
          <div className="flex flex-1 min-h-0">
            {/* Left sidebar */}
            <aside className="w-80 border-r border-sidebar-border flex-shrink-0 hidden lg:block">
              <FilterPanel
                selectedFilter={selectedFilter}
                parameters={parameters}
                onFilterSelect={handleFilterSelect}
                onParameterChange={handleParameterChange}
                onApply={applyFilter}
                disabled={!originalImage}
                isProcessing={isProcessing}
              />
            </aside>

            {/* Center main */}
            <main className="flex-1 overflow-y-auto scrollbar-thin min-w-0">
              <div className="p-4 md:p-6 space-y-5">
                {/* Current filter banner */}
                {selectedFilterDef && (
                  <div className="rounded-xl border border-border bg-card/40 overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 p-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
                          style={{
                            backgroundColor: selectedChapter
                              ? `color-mix(in oklch, ${selectedChapter.accent} 18%, transparent)`
                              : 'var(--muted)',
                            color: selectedChapter?.accent ?? 'var(--foreground)',
                          }}
                        >
                          <Layers className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">
                              {selectedFilterDef.name}
                            </h3>
                            {selectedChapter && (
                              <span
                                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `color-mix(in oklch, ${selectedChapter.accent} 18%, transparent)`,
                                  color: selectedChapter.accent,
                                }}
                              >
                                {selectedChapter.shortTitle}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {selectedFilterDef.description}
                          </p>
                        </div>
                      </div>
                      <div className="md:w-auto w-full md:min-w-[220px] rounded-md bg-background/60 border border-border px-3 py-1.5">
                        <FormulaDisplay formula={selectedFilterDef.formula} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <TabsList className="grid w-fit grid-cols-3">
                      <TabsTrigger value="spatial" className="gap-1.5">
                        <Grid3x3 className="h-3.5 w-3.5" />
                        Spatial
                      </TabsTrigger>
                      <TabsTrigger value="frequency" className="gap-1.5">
                        <Radio className="h-3.5 w-3.5" />
                        Frequency
                      </TabsTrigger>
                      <TabsTrigger value="compare" className="gap-1.5">
                        <GitCompare className="h-3.5 w-3.5" />
                        Compare
                      </TabsTrigger>
                    </TabsList>
                    {processedImage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadImage}
                        className="text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Download result
                      </Button>
                    )}
                  </div>

                  <TabsContent value="spatial" className="mt-4 space-y-5">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Original
                            </h3>
                          </div>
                        </div>
                        <CanvasProcessor
                          imageData={originalImage}
                          ariaLabel="Original image"
                        />
                        <HistogramChart
                          imageData={originalImage}
                          title="Original histogram"
                          variant="original"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                              Processed
                            </h3>
                          </div>
                          {isProcessing && (
                            <div className="flex items-center gap-1.5 text-[11px] text-primary">
                              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              <span>Processing</span>
                            </div>
                          )}
                        </div>
                        <CanvasProcessor
                          imageData={displayImage}
                          ariaLabel="Processed image"
                          emptyLabel="No filter applied yet"
                          emptyDescription="Pick a filter on the left and tap Apply to see the result here."
                        />
                        <HistogramChart
                          imageData={processedImage}
                          title="Processed histogram"
                          variant="processed"
                        />
                      </div>
                    </div>

                    {processedImage && (
                      <AnimationControls
                        isPlaying={isAnimating}
                        progress={animationProgress}
                        speed={animationSpeed}
                        onPlay={startAnimation}
                        onPause={pauseAnimation}
                        onReset={resetAnimation}
                        onSpeedChange={setAnimationSpeed}
                        onProgressChange={handleProgressChange}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="frequency" className="mt-4 space-y-5">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Spatial domain
                          </h3>
                        </div>
                        <CanvasProcessor
                          imageData={displayImage ?? originalImage}
                          ariaLabel="Image in spatial domain"
                        />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Magnitude spectrum {spectrumImage && '· log scaled'}
                          </h3>
                        </div>
                        <CanvasProcessor
                          imageData={spectrumImage}
                          ariaLabel="Frequency domain magnitude spectrum"
                          emptyLabel="No spectrum yet"
                          emptyDescription="Apply FFT Visualization or a frequency filter (Chapter 5) to see the spectrum."
                        />
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card/40 p-4 text-[11px] text-muted-foreground leading-relaxed">
                      <p className="mb-1">
                        <span className="text-foreground font-medium">
                          About the spectrum:
                        </span>{' '}
                        The magnitude is log-scaled and centered so that low frequencies
                        appear in the middle. Bright structures indicate dominant
                        frequency components in the image.
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="compare" className="mt-4 space-y-5">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Original
                          </h3>
                        </div>
                        <CanvasProcessor imageData={originalImage} />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary" />
                          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Processed
                          </h3>
                        </div>
                        <CanvasProcessor
                          imageData={processedImage}
                          emptyLabel="No processed result"
                          emptyDescription="Apply a filter to see a side-by-side comparison."
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <HistogramChart
                        imageData={originalImage}
                        title="Original histogram"
                        variant="original"
                      />
                      <HistogramChart
                        imageData={processedImage}
                        title="Processed histogram"
                        variant="processed"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </main>

            {/* Right sidebar */}
            <aside className="w-72 border-l border-border flex-shrink-0 overflow-y-auto scrollbar-thin hidden xl:block">
              <div className="p-4 space-y-4">
                <MetricsDisplay metrics={metrics} />

                {/* Pipeline summary */}
                <div className="rounded-xl border border-border bg-card/40 p-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Session
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground">Dimensions</span>
                      <span className="text-[11px] font-mono tabular-nums">
                        {imageInfo?.width} × {imageInfo?.height}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground">Pixels</span>
                      <span className="text-[11px] font-mono tabular-nums">
                        {imageInfo?.pixels.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground">Filter</span>
                      <span className="text-[11px] font-medium text-right max-w-[140px] truncate">
                        {selectedFilterDef?.name ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[11px] text-muted-foreground">Status</span>
                      <span className="text-[11px] font-medium flex items-center gap-1.5">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            processedImage ? 'bg-primary' : 'bg-muted-foreground/40'
                          }`}
                        />
                        {processedImage ? 'Applied' : 'Idle'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upload another */}
                <div className="rounded-xl border border-border bg-card/40 p-4">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                    Swap image
                  </h4>
                  <ImageUploader onImageLoad={handleImageLoad} compact />
                </div>

                {/* Learning hint */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Upload className="h-3.5 w-3.5 text-primary" />
                    <h4 className="text-xs font-medium text-primary">Tip</h4>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Try applying a low-pass filter, then toggle the animation slider to
                    watch how high-frequency details fade away.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Mobile filter panel (visible only on small screens when image loaded) */}
        {originalImage && (
          <div className="lg:hidden border-t border-border bg-card">
            <details className="group">
              <summary className="px-4 py-3 text-xs font-medium cursor-pointer list-none flex items-center justify-between">
                <span>Filter library</span>
                <span className="text-[10px] text-muted-foreground group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <div className="h-96 border-t border-border">
                <FilterPanel
                  selectedFilter={selectedFilter}
                  parameters={parameters}
                  onFilterSelect={handleFilterSelect}
                  onParameterChange={handleParameterChange}
                  onApply={applyFilter}
                  disabled={!originalImage}
                  isProcessing={isProcessing}
                />
              </div>
            </details>
          </div>
        )}

      </div>
    </TooltipProvider>
  );
}
