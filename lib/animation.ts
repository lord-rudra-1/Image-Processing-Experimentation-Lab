// Animation utilities for smooth transitions
import type { ImageData } from './filters';

// Interpolate between two images
// output = alpha * processed + (1 - alpha) * original
export function interpolateImages(
  original: ImageData,
  processed: ImageData,
  alpha: number
): ImageData {
  const { data: origData, width, height } = original;
  const { data: procData } = processed;
  const output = new Uint8ClampedArray(origData.length);
  
  const clampedAlpha = Math.max(0, Math.min(1, alpha));
  
  for (let i = 0; i < origData.length; i++) {
    output[i] = Math.round(
      clampedAlpha * procData[i] + (1 - clampedAlpha) * origData[i]
    );
  }
  
  return { data: output, width, height };
}

// Animation controller class
export class AnimationController {
  private animationId: number | null = null;
  private startTime: number = 0;
  private duration: number = 1000;
  private isPaused: boolean = false;
  private pausedAlpha: number = 0;
  private speed: number = 1;
  
  constructor(duration: number = 1000) {
    this.duration = duration;
  }
  
  setSpeed(speed: number) {
    this.speed = speed;
  }
  
  setDuration(duration: number) {
    this.duration = duration;
  }
  
  start(
    original: ImageData,
    processed: ImageData,
    onFrame: (interpolated: ImageData, alpha: number) => void,
    onComplete?: () => void
  ) {
    this.stop();
    this.isPaused = false;
    this.pausedAlpha = 0;
    this.startTime = performance.now();
    
    const animate = (currentTime: number) => {
      if (this.isPaused) return;
      
      const elapsed = (currentTime - this.startTime) * this.speed;
      const alpha = Math.min(elapsed / this.duration, 1);
      
      const interpolated = interpolateImages(original, processed, alpha);
      onFrame(interpolated, alpha);
      
      if (alpha < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  pause() {
    this.isPaused = true;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
  }
  
  resume(
    original: ImageData,
    processed: ImageData,
    currentAlpha: number,
    onFrame: (interpolated: ImageData, alpha: number) => void,
    onComplete?: () => void
  ) {
    this.isPaused = false;
    this.startTime = performance.now() - (currentAlpha * this.duration / this.speed);
    
    const animate = (currentTime: number) => {
      if (this.isPaused) return;
      
      const elapsed = (currentTime - this.startTime) * this.speed;
      const alpha = Math.min(elapsed / this.duration, 1);
      
      const interpolated = interpolateImages(original, processed, alpha);
      onFrame(interpolated, alpha);
      
      if (alpha < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isPaused = false;
  }
  
  isRunning(): boolean {
    return this.animationId !== null && !this.isPaused;
  }
}

// Easing functions
export const easings = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};
