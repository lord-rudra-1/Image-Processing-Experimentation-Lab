// Image Quality Metrics
import type { ImageData } from './filters';
import { getGrayscale } from './filters';

// Mean Squared Error: MSE = (1/MN) Σ (f - g)²
export function calculateMSE(original: ImageData, processed: ImageData): number {
  const { data: origData, width, height } = original;
  const { data: procData } = processed;
  
  let sum = 0;
  const totalPixels = width * height;
  
  for (let i = 0; i < origData.length; i += 4) {
    const origGray = getGrayscale(origData[i], origData[i + 1], origData[i + 2]);
    const procGray = getGrayscale(procData[i], procData[i + 1], procData[i + 2]);
    const diff = origGray - procGray;
    sum += diff * diff;
  }
  
  return sum / totalPixels;
}

// Peak Signal-to-Noise Ratio: PSNR = 10 log₁₀(MAX² / MSE)
export function calculatePSNR(original: ImageData, processed: ImageData): number {
  const mse = calculateMSE(original, processed);
  
  if (mse === 0) {
    return Infinity; // Images are identical
  }
  
  const MAX = 255; // Maximum pixel value for 8-bit images
  return 10 * Math.log10((MAX * MAX) / mse);
}

// Structural Similarity Index (simplified version)
export function calculateSSIM(original: ImageData, processed: ImageData): number {
  const { data: origData, width, height } = original;
  const { data: procData } = processed;
  
  const totalPixels = width * height;
  
  // Calculate means
  let sumOrig = 0, sumProc = 0;
  for (let i = 0; i < origData.length; i += 4) {
    sumOrig += getGrayscale(origData[i], origData[i + 1], origData[i + 2]);
    sumProc += getGrayscale(procData[i], procData[i + 1], procData[i + 2]);
  }
  const meanOrig = sumOrig / totalPixels;
  const meanProc = sumProc / totalPixels;
  
  // Calculate variances and covariance
  let varOrig = 0, varProc = 0, covar = 0;
  for (let i = 0; i < origData.length; i += 4) {
    const origGray = getGrayscale(origData[i], origData[i + 1], origData[i + 2]);
    const procGray = getGrayscale(procData[i], procData[i + 1], procData[i + 2]);
    
    varOrig += (origGray - meanOrig) ** 2;
    varProc += (procGray - meanProc) ** 2;
    covar += (origGray - meanOrig) * (procGray - meanProc);
  }
  varOrig /= totalPixels;
  varProc /= totalPixels;
  covar /= totalPixels;
  
  // SSIM constants
  const C1 = (0.01 * 255) ** 2;
  const C2 = (0.03 * 255) ** 2;
  
  const ssim = ((2 * meanOrig * meanProc + C1) * (2 * covar + C2)) /
               ((meanOrig ** 2 + meanProc ** 2 + C1) * (varOrig + varProc + C2));
  
  return ssim;
}

// All metrics combined
export interface ImageMetrics {
  mse: number;
  psnr: number;
  ssim: number;
}

export function calculateAllMetrics(original: ImageData, processed: ImageData): ImageMetrics {
  return {
    mse: calculateMSE(original, processed),
    psnr: calculatePSNR(original, processed),
    ssim: calculateSSIM(original, processed)
  };
}
