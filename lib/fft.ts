// FFT Implementation for Image Processing
// Based on Cooley-Tukey algorithm

import { getGrayscale, clamp } from './filters';
import type { ImageData } from './filters';

// Complex number representation
interface Complex {
  re: number;
  im: number;
}

// 1D FFT using Cooley-Tukey algorithm
function fft1d(input: Complex[], inverse: boolean = false): Complex[] {
  const n = input.length;
  
  if (n <= 1) return input;
  
  // Pad to power of 2
  const log2n = Math.ceil(Math.log2(n));
  const paddedN = Math.pow(2, log2n);
  
  const padded: Complex[] = [...input];
  while (padded.length < paddedN) {
    padded.push({ re: 0, im: 0 });
  }
  
  // Bit reversal permutation
  const output: Complex[] = new Array(paddedN);
  for (let i = 0; i < paddedN; i++) {
    let rev = 0;
    for (let j = 0; j < log2n; j++) {
      if (i & (1 << j)) {
        rev |= 1 << (log2n - 1 - j);
      }
    }
    output[i] = padded[rev];
  }
  
  // Cooley-Tukey iterative FFT
  for (let s = 1; s <= log2n; s++) {
    const m = Math.pow(2, s);
    const mHalf = m / 2;
    const angle = (inverse ? 2 : -2) * Math.PI / m;
    const wm: Complex = { re: Math.cos(angle), im: Math.sin(angle) };
    
    for (let k = 0; k < paddedN; k += m) {
      let w: Complex = { re: 1, im: 0 };
      
      for (let j = 0; j < mHalf; j++) {
        const t: Complex = {
          re: w.re * output[k + j + mHalf].re - w.im * output[k + j + mHalf].im,
          im: w.re * output[k + j + mHalf].im + w.im * output[k + j + mHalf].re
        };
        
        const u = output[k + j];
        output[k + j] = { re: u.re + t.re, im: u.im + t.im };
        output[k + j + mHalf] = { re: u.re - t.re, im: u.im - t.im };
        
        const newW: Complex = {
          re: w.re * wm.re - w.im * wm.im,
          im: w.re * wm.im + w.im * wm.re
        };
        w = newW;
      }
    }
  }
  
  // Normalize for inverse FFT
  if (inverse) {
    for (let i = 0; i < paddedN; i++) {
      output[i].re /= paddedN;
      output[i].im /= paddedN;
    }
  }
  
  return output.slice(0, n);
}

// 2D FFT
export function fft2d(imageData: ImageData): Complex[][] {
  const { data, width, height } = imageData;
  
  // Convert to grayscale complex array
  const complex: Complex[][] = [];
  for (let y = 0; y < height; y++) {
    complex[y] = [];
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = getGrayscale(data[idx], data[idx + 1], data[idx + 2]);
      // Shift for centering (multiply by (-1)^(x+y))
      const shift = ((x + y) % 2 === 0) ? 1 : -1;
      complex[y][x] = { re: gray * shift, im: 0 };
    }
  }
  
  // FFT on rows
  for (let y = 0; y < height; y++) {
    complex[y] = fft1d(complex[y]);
  }
  
  // FFT on columns
  for (let x = 0; x < width; x++) {
    const column: Complex[] = [];
    for (let y = 0; y < height; y++) {
      column.push(complex[y][x]);
    }
    const fftCol = fft1d(column);
    for (let y = 0; y < height; y++) {
      complex[y][x] = fftCol[y];
    }
  }
  
  return complex;
}

// Inverse 2D FFT
export function ifft2d(complex: Complex[][], width: number, height: number): ImageData {
  // IFFT on columns
  for (let x = 0; x < width; x++) {
    const column: Complex[] = [];
    for (let y = 0; y < height; y++) {
      column.push(complex[y][x]);
    }
    const ifftCol = fft1d(column, true);
    for (let y = 0; y < height; y++) {
      complex[y][x] = ifftCol[y];
    }
  }
  
  // IFFT on rows
  for (let y = 0; y < height; y++) {
    complex[y] = fft1d(complex[y], true);
  }
  
  // Convert back to image
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const shift = ((x + y) % 2 === 0) ? 1 : -1;
      const value = clamp(complex[y][x].re * shift);
      const idx = (y * width + x) * 4;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
      data[idx + 3] = 255;
    }
  }
  
  return { data, width, height };
}

// Compute magnitude spectrum (log scaled)
export function getMagnitudeSpectrum(complex: Complex[][]): ImageData {
  const height = complex.length;
  const width = complex[0].length;
  const data = new Uint8ClampedArray(width * height * 4);
  
  // Find max magnitude for normalization
  let maxMag = 0;
  const magnitudes: number[][] = [];
  
  for (let y = 0; y < height; y++) {
    magnitudes[y] = [];
    for (let x = 0; x < width; x++) {
      const mag = Math.sqrt(complex[y][x].re ** 2 + complex[y][x].im ** 2);
      const logMag = Math.log(1 + mag);
      magnitudes[y][x] = logMag;
      if (logMag > maxMag) maxMag = logMag;
    }
  }
  
  // Normalize and create image
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = clamp((magnitudes[y][x] / maxMag) * 255);
      const idx = (y * width + x) * 4;
      data[idx] = value;
      data[idx + 1] = value;
      data[idx + 2] = value;
      data[idx + 3] = 255;
    }
  }
  
  return { data, width, height };
}

// ============================================
// FREQUENCY DOMAIN FILTERS
// ============================================

// Ideal Low Pass Filter
export function idealLowPass(complex: Complex[][], cutoff: number): Complex[][] {
  const height = complex.length;
  const width = complex[0].length;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const result: Complex[][] = [];
  
  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const h = distance <= cutoff ? 1 : 0;
      result[y][x] = { re: complex[y][x].re * h, im: complex[y][x].im * h };
    }
  }
  
  return result;
}

// Ideal High Pass Filter
export function idealHighPass(complex: Complex[][], cutoff: number): Complex[][] {
  const height = complex.length;
  const width = complex[0].length;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const result: Complex[][] = [];
  
  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const h = distance > cutoff ? 1 : 0;
      result[y][x] = { re: complex[y][x].re * h, im: complex[y][x].im * h };
    }
  }
  
  return result;
}

// Butterworth Low Pass Filter
export function butterworthLowPass(complex: Complex[][], cutoff: number, order: number = 2): Complex[][] {
  const height = complex.length;
  const width = complex[0].length;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const result: Complex[][] = [];
  
  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const h = 1 / (1 + Math.pow(distance / cutoff, 2 * order));
      result[y][x] = { re: complex[y][x].re * h, im: complex[y][x].im * h };
    }
  }
  
  return result;
}

// Butterworth High Pass Filter
export function butterworthHighPass(complex: Complex[][], cutoff: number, order: number = 2): Complex[][] {
  const height = complex.length;
  const width = complex[0].length;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const result: Complex[][] = [];
  
  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const h = distance === 0 ? 0 : 1 / (1 + Math.pow(cutoff / distance, 2 * order));
      result[y][x] = { re: complex[y][x].re * h, im: complex[y][x].im * h };
    }
  }
  
  return result;
}

// Gaussian Low Pass Filter
export function gaussianLowPass(complex: Complex[][], cutoff: number): Complex[][] {
  const height = complex.length;
  const width = complex[0].length;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const result: Complex[][] = [];
  
  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const h = Math.exp(-(distance ** 2) / (2 * cutoff ** 2));
      result[y][x] = { re: complex[y][x].re * h, im: complex[y][x].im * h };
    }
  }
  
  return result;
}

// Gaussian High Pass Filter
export function gaussianHighPass(complex: Complex[][], cutoff: number): Complex[][] {
  const height = complex.length;
  const width = complex[0].length;
  const centerX = width / 2;
  const centerY = height / 2;
  
  const result: Complex[][] = [];
  
  for (let y = 0; y < height; y++) {
    result[y] = [];
    for (let x = 0; x < width; x++) {
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const h = 1 - Math.exp(-(distance ** 2) / (2 * cutoff ** 2));
      result[y][x] = { re: complex[y][x].re * h, im: complex[y][x].im * h };
    }
  }
  
  return result;
}

// Apply frequency domain filter and return result
export function applyFrequencyFilter(
  imageData: ImageData,
  filterType: 'idealLP' | 'idealHP' | 'butterworthLP' | 'butterworthHP' | 'gaussianLP' | 'gaussianHP',
  cutoff: number,
  order: number = 2
): { filtered: ImageData; spectrum: ImageData; filteredSpectrum: ImageData } {
  const fftResult = fft2d(imageData);
  const spectrum = getMagnitudeSpectrum(fftResult);
  
  let filtered: Complex[][];
  switch (filterType) {
    case 'idealLP':
      filtered = idealLowPass(fftResult, cutoff);
      break;
    case 'idealHP':
      filtered = idealHighPass(fftResult, cutoff);
      break;
    case 'butterworthLP':
      filtered = butterworthLowPass(fftResult, cutoff, order);
      break;
    case 'butterworthHP':
      filtered = butterworthHighPass(fftResult, cutoff, order);
      break;
    case 'gaussianLP':
      filtered = gaussianLowPass(fftResult, cutoff);
      break;
    case 'gaussianHP':
      filtered = gaussianHighPass(fftResult, cutoff);
      break;
    default:
      filtered = fftResult;
  }
  
  const filteredSpectrum = getMagnitudeSpectrum(filtered);
  const result = ifft2d(filtered, imageData.width, imageData.height);
  
  return { filtered: result, spectrum, filteredSpectrum };
}
