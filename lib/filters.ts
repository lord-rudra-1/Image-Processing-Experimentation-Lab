// Digital Image Processing Filters - Based on Gonzalez & Woods

export interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

// Helper: Get grayscale value from RGB
export function getGrayscale(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Helper: Clamp value to 0-255
export function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

// ============================================
// CHAPTER 3: INTENSITY TRANSFORMATIONS
// ============================================

// Negative Transformation: s = L - 1 - r
export function negativeTransform(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);
  const L = 256;

  for (let i = 0; i < data.length; i += 4) {
    output[i] = L - 1 - data[i];       // R
    output[i + 1] = L - 1 - data[i + 1]; // G
    output[i + 2] = L - 1 - data[i + 2]; // B
    output[i + 3] = data[i + 3];         // A
  }

  return { data: output, width, height };
}

// Log Transformation: s = c * log(1 + r)
export function logTransform(imageData: ImageData, c: number = 45): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    output[i] = clamp(c * Math.log(1 + data[i]));
    output[i + 1] = clamp(c * Math.log(1 + data[i + 1]));
    output[i + 2] = clamp(c * Math.log(1 + data[i + 2]));
    output[i + 3] = data[i + 3];
  }

  return { data: output, width, height };
}

// Power-Law (Gamma) Transformation: s = c * r^γ
export function gammaTransform(imageData: ImageData, gamma: number = 1.0, c: number = 1): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    output[i] = clamp(c * 255 * Math.pow(data[i] / 255, gamma));
    output[i + 1] = clamp(c * 255 * Math.pow(data[i + 1] / 255, gamma));
    output[i + 2] = clamp(c * 255 * Math.pow(data[i + 2] / 255, gamma));
    output[i + 3] = data[i + 3];
  }

  return { data: output, width, height };
}

// Contrast Stretching
export function contrastStretch(imageData: ImageData, r1: number = 70, s1: number = 0, r2: number = 180, s2: number = 255): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);

  const stretch = (r: number): number => {
    if (r < r1) {
      return (s1 / r1) * r;
    } else if (r <= r2) {
      return ((s2 - s1) / (r2 - r1)) * (r - r1) + s1;
    } else {
      return ((255 - s2) / (255 - r2)) * (r - r2) + s2;
    }
  };

  for (let i = 0; i < data.length; i += 4) {
    output[i] = clamp(stretch(data[i]));
    output[i + 1] = clamp(stretch(data[i + 1]));
    output[i + 2] = clamp(stretch(data[i + 2]));
    output[i + 3] = data[i + 3];
  }

  return { data: output, width, height };
}

// Bit-plane Slicing
export function bitPlaneSlice(imageData: ImageData, bitPlane: number = 7): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);
  const mask = 1 << bitPlane;

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(getGrayscale(data[i], data[i + 1], data[i + 2]));
    const bit = (gray & mask) ? 255 : 0;
    output[i] = bit;
    output[i + 1] = bit;
    output[i + 2] = bit;
    output[i + 3] = data[i + 3];
  }

  return { data: output, width, height };
}

// ============================================
// CHAPTER 2: HISTOGRAM OPERATIONS
// ============================================

// Compute Histogram
export function computeHistogram(imageData: ImageData): number[] {
  const { data } = imageData;
  const histogram = new Array(256).fill(0);

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(getGrayscale(data[i], data[i + 1], data[i + 2]));
    histogram[gray]++;
  }

  return histogram;
}

// Histogram Equalization
export function histogramEqualization(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);
  const histogram = computeHistogram(imageData);
  const totalPixels = width * height;

  // Compute CDF
  const cdf = new Array(256).fill(0);
  cdf[0] = histogram[0];
  for (let i = 1; i < 256; i++) {
    cdf[i] = cdf[i - 1] + histogram[i];
  }

  // Find minimum non-zero CDF
  let cdfMin = 0;
  for (let i = 0; i < 256; i++) {
    if (cdf[i] > 0) {
      cdfMin = cdf[i];
      break;
    }
  }

  // Create lookup table
  const lut = new Array(256).fill(0);
  for (let i = 0; i < 256; i++) {
    lut[i] = Math.round(((cdf[i] - cdfMin) / (totalPixels - cdfMin)) * 255);
  }

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(getGrayscale(data[i], data[i + 1], data[i + 2]));
    const newValue = lut[gray];
    output[i] = newValue;
    output[i + 1] = newValue;
    output[i + 2] = newValue;
    output[i + 3] = data[i + 3];
  }

  return { data: output, width, height };
}

// ============================================
// CHAPTER 4: SPATIAL FILTERING
// ============================================

// Convolution helper
function convolve(imageData: ImageData, kernel: number[][], normalize: boolean = true): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);
  const kSize = kernel.length;
  const kHalf = Math.floor(kSize / 2);

  let kSum = 0;
  if (normalize) {
    for (let ky = 0; ky < kSize; ky++) {
      for (let kx = 0; kx < kSize; kx++) {
        kSum += Math.abs(kernel[ky][kx]);
      }
    }
    if (kSum === 0) kSum = 1;
  } else {
    kSum = 1;
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sumR = 0, sumG = 0, sumB = 0;

      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx - kHalf));
          const py = Math.min(height - 1, Math.max(0, y + ky - kHalf));
          const idx = (py * width + px) * 4;

          sumR += data[idx] * kernel[ky][kx];
          sumG += data[idx + 1] * kernel[ky][kx];
          sumB += data[idx + 2] * kernel[ky][kx];
        }
      }

      const idx = (y * width + x) * 4;
      output[idx] = clamp(sumR / kSum);
      output[idx + 1] = clamp(sumG / kSum);
      output[idx + 2] = clamp(sumB / kSum);
      output[idx + 3] = data[idx + 3];
    }
  }

  return { data: output, width, height };
}

// Mean Filter (Box Filter)
export function meanFilter(imageData: ImageData, size: number = 3): ImageData {
  const kernel = Array(size).fill(null).map(() => Array(size).fill(1));
  return convolve(imageData, kernel);
}

// Gaussian Filter
export function gaussianFilter(imageData: ImageData, sigma: number = 1): ImageData {
  const size = Math.ceil(sigma * 6) | 1; // Ensure odd
  const kernel: number[][] = [];
  const half = Math.floor(size / 2);
  let sum = 0;

  for (let y = -half; y <= half; y++) {
    const row: number[] = [];
    for (let x = -half; x <= half; x++) {
      const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      row.push(value);
      sum += value;
    }
    kernel.push(row);
  }

  // Normalize
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      kernel[y][x] /= sum;
    }
  }

  return convolve(imageData, kernel, false);
}

// Laplacian Filter
export function laplacianFilter(imageData: ImageData): ImageData {
  const kernel = [
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0]
  ];
  const result = convolve(imageData, kernel, false);
  
  // Convert to absolute values for display
  for (let i = 0; i < result.data.length; i += 4) {
    result.data[i] = clamp(Math.abs(result.data[i] - 128) * 2);
    result.data[i + 1] = clamp(Math.abs(result.data[i + 1] - 128) * 2);
    result.data[i + 2] = clamp(Math.abs(result.data[i + 2] - 128) * 2);
  }
  
  return result;
}

// Sobel Edge Detection
export function sobelFilter(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);

  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = getGrayscale(data[idx], data[idx + 1], data[idx + 2]);
          gx += gray * sobelX[ky + 1][kx + 1];
          gy += gray * sobelY[ky + 1][kx + 1];
        }
      }

      const magnitude = clamp(Math.sqrt(gx * gx + gy * gy));
      const idx = (y * width + x) * 4;
      output[idx] = magnitude;
      output[idx + 1] = magnitude;
      output[idx + 2] = magnitude;
      output[idx + 3] = 255;
    }
  }

  return { data: output, width, height };
}

// Prewitt Operator
export function prewittFilter(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);

  const prewittX = [
    [-1, 0, 1],
    [-1, 0, 1],
    [-1, 0, 1]
  ];

  const prewittY = [
    [-1, -1, -1],
    [0, 0, 0],
    [1, 1, 1]
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = getGrayscale(data[idx], data[idx + 1], data[idx + 2]);
          gx += gray * prewittX[ky + 1][kx + 1];
          gy += gray * prewittY[ky + 1][kx + 1];
        }
      }

      const magnitude = clamp(Math.sqrt(gx * gx + gy * gy));
      const idx = (y * width + x) * 4;
      output[idx] = magnitude;
      output[idx + 1] = magnitude;
      output[idx + 2] = magnitude;
      output[idx + 3] = 255;
    }
  }

  return { data: output, width, height };
}

// Sharpening Filter (Unsharp Masking)
export function sharpenFilter(imageData: ImageData, amount: number = 1): ImageData {
  const kernel = [
    [0, -amount, 0],
    [-amount, 1 + 4 * amount, -amount],
    [0, -amount, 0]
  ];
  return convolve(imageData, kernel, false);
}

// ============================================
// CHAPTER 6: NOISE & RESTORATION
// ============================================

// Add Gaussian Noise
export function addGaussianNoise(imageData: ImageData, mean: number = 0, stddev: number = 25): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);

  const gaussianRandom = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };

  for (let i = 0; i < data.length; i += 4) {
    const noise = gaussianRandom() * stddev + mean;
    output[i] = clamp(data[i] + noise);
    output[i + 1] = clamp(data[i + 1] + noise);
    output[i + 2] = clamp(data[i + 2] + noise);
    output[i + 3] = data[i + 3];
  }

  return { data: output, width, height };
}

// Add Salt and Pepper Noise
export function addSaltPepperNoise(imageData: ImageData, density: number = 0.05): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data);

  for (let i = 0; i < data.length; i += 4) {
    if (Math.random() < density) {
      const value = Math.random() < 0.5 ? 0 : 255;
      output[i] = value;
      output[i + 1] = value;
      output[i + 2] = value;
    }
  }

  return { data: output, width, height };
}

// Median Filter (for noise reduction)
export function medianFilter(imageData: ImageData, size: number = 3): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);
  const half = Math.floor(size / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelsR: number[] = [];
      const pixelsG: number[] = [];
      const pixelsB: number[] = [];

      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const idx = (py * width + px) * 4;
          pixelsR.push(data[idx]);
          pixelsG.push(data[idx + 1]);
          pixelsB.push(data[idx + 2]);
        }
      }

      pixelsR.sort((a, b) => a - b);
      pixelsG.sort((a, b) => a - b);
      pixelsB.sort((a, b) => a - b);

      const medianIdx = Math.floor(pixelsR.length / 2);
      const idx = (y * width + x) * 4;
      output[idx] = pixelsR[medianIdx];
      output[idx + 1] = pixelsG[medianIdx];
      output[idx + 2] = pixelsB[medianIdx];
      output[idx + 3] = data[idx + 3];
    }
  }

  return { data: output, width, height };
}

// Motion Blur (PSF)
export function motionBlur(imageData: ImageData, length: number = 15, angle: number = 0): ImageData {
  const kernel: number[][] = [];
  const size = length;
  const half = Math.floor(size / 2);
  const rad = (angle * Math.PI) / 180;

  // Create motion blur kernel
  for (let y = 0; y < size; y++) {
    kernel[y] = [];
    for (let x = 0; x < size; x++) {
      kernel[y][x] = 0;
    }
  }

  // Draw line in kernel
  for (let i = 0; i < length; i++) {
    const x = Math.round(half + (i - half) * Math.cos(rad));
    const y = Math.round(half + (i - half) * Math.sin(rad));
    if (x >= 0 && x < size && y >= 0 && y < size) {
      kernel[y][x] = 1;
    }
  }

  return convolve(imageData, kernel);
}

// ============================================
// CHAPTER 7: MORPHOLOGICAL OPERATIONS
// ============================================

// Convert to binary
function toBinary(imageData: ImageData, threshold: number = 128): Uint8Array {
  const { data, width, height } = imageData;
  const binary = new Uint8Array(width * height);

  for (let i = 0; i < data.length; i += 4) {
    const gray = getGrayscale(data[i], data[i + 1], data[i + 2]);
    binary[i / 4] = gray > threshold ? 1 : 0;
  }

  return binary;
}

// Convert binary to image data
function fromBinary(binary: Uint8Array, width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);

  for (let i = 0; i < binary.length; i++) {
    const value = binary[i] ? 255 : 0;
    data[i * 4] = value;
    data[i * 4 + 1] = value;
    data[i * 4 + 2] = value;
    data[i * 4 + 3] = 255;
  }

  return { data, width, height };
}

// Erosion
export function erode(imageData: ImageData, kernelSize: number = 3): ImageData {
  const { width, height } = imageData;
  const binary = toBinary(imageData);
  const output = new Uint8Array(width * height);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let allOnes = true;

      for (let ky = -half; ky <= half && allOnes; ky++) {
        for (let kx = -half; kx <= half && allOnes; kx++) {
          const px = x + kx;
          const py = y + ky;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            if (binary[py * width + px] === 0) {
              allOnes = false;
            }
          }
        }
      }

      output[y * width + x] = allOnes ? 1 : 0;
    }
  }

  return fromBinary(output, width, height);
}

// Dilation
export function dilate(imageData: ImageData, kernelSize: number = 3): ImageData {
  const { width, height } = imageData;
  const binary = toBinary(imageData);
  const output = new Uint8Array(width * height);
  const half = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let anyOne = false;

      for (let ky = -half; ky <= half && !anyOne; ky++) {
        for (let kx = -half; kx <= half && !anyOne; kx++) {
          const px = x + kx;
          const py = y + ky;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            if (binary[py * width + px] === 1) {
              anyOne = true;
            }
          }
        }
      }

      output[y * width + x] = anyOne ? 1 : 0;
    }
  }

  return fromBinary(output, width, height);
}

// Opening (Erosion followed by Dilation)
export function opening(imageData: ImageData, kernelSize: number = 3): ImageData {
  return dilate(erode(imageData, kernelSize), kernelSize);
}

// Closing (Dilation followed by Erosion)
export function closing(imageData: ImageData, kernelSize: number = 3): ImageData {
  return erode(dilate(imageData, kernelSize), kernelSize);
}

// Boundary Extraction
export function boundaryExtraction(imageData: ImageData, kernelSize: number = 3): ImageData {
  const { width, height } = imageData;
  const original = toBinary(imageData);
  const eroded = toBinary(erode(imageData, kernelSize));
  const output = new Uint8Array(width * height);

  for (let i = 0; i < original.length; i++) {
    output[i] = original[i] - eroded[i];
  }

  return fromBinary(output, width, height);
}

// ============================================
// GRAYSCALE CONVERSION
// ============================================

export function toGrayscale(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const output = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(getGrayscale(data[i], data[i + 1], data[i + 2]));
    output[i] = gray;
    output[i + 1] = gray;
    output[i + 2] = gray;
    output[i + 3] = data[i + 3];
  }

  return { data: output, width, height };
}
