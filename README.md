# DIP Studio

Live Demo: [https://image-processsing-experimentataion.vercel.app/](https://image-processsing-experimentataion.vercel.app/)

An interactive Digital Image Processing simulator built with Next.js. Upload an image, apply textbook-style transformations, inspect formulas, compare results, and study how each operation changes the image in real time.

The app is designed as a browser-based learning lab inspired by Gonzalez & Woods, with support for intensity transformations, histogram operations, spatial filtering, frequency-domain filtering, restoration, and morphology.

## Features

- Upload PNG, JPG, GIF, or WebP images with drag-and-drop support.
- Run all image processing locally in the browser.
- Explore chapter-based filters with adjustable parameters.
- View mathematical formulas for the selected operation using KaTeX.
- Compare original and processed images with animated interpolation.
- Inspect histogram output and image quality metrics.
- Download the processed result as a PNG.

## Implemented Operations

### Chapter 2: Histogram Operations

- Histogram equalization

### Chapter 3: Intensity Transformations

- Negative transformation
- Log transformation
- Power-law (gamma) transformation
- Contrast stretching
- Bit-plane slicing

### Chapter 4: Spatial Filtering

- Mean filter
- Gaussian filter
- Laplacian filter
- Sobel operator
- Prewitt operator
- Sharpening filter

### Chapter 5: Frequency Domain

- FFT magnitude spectrum visualization
- Ideal low-pass and high-pass filters
- Butterworth low-pass and high-pass filters
- Gaussian low-pass and high-pass filters

### Chapter 6: Noise and Restoration

- Add Gaussian noise
- Add salt-and-pepper noise
- Motion blur
- Median filter

### Chapter 7: Morphological Operations

- Erosion
- Dilation
- Opening
- Closing
- Boundary extraction

## Metrics and Visual Analysis

The app computes the following quality metrics after most transformations:

- MSE
- PSNR
- SSIM

It also includes:

- FFT spectrum rendering
- Histogram visualization
- Original-to-processed transition animation

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI
- KaTeX
- Recharts

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- npm or pnpm

### Install

Using npm:

```bash
npm install
```

Using pnpm:

```bash
pnpm install
```

### Run the development server

Using npm:

```bash
npm run dev
```

Using pnpm:

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Build for production

Using npm:

```bash
npm run build
npm start
```

Using pnpm:

```bash
pnpm build
pnpm start
```

## Project Structure

```text
app/
  layout.tsx          # App shell and metadata
  page.tsx            # Main DIP Studio interface and workflow
components/
  ImageUploader.tsx   # Image import and preprocessing
  FilterPanel.tsx     # Filter library and parameter controls
  CanvasProcessor.tsx # Canvas rendering for image output
  MetricsDisplay.tsx  # MSE, PSNR, SSIM cards
  HistogramChart.tsx  # Histogram visualization
  AnimationControls.tsx
  FormulaDisplay.tsx  # KaTeX-based formula rendering
lib/
  filters.ts          # Core spatial/intensity/restoration/morphology logic
  fft.ts              # FFT, IFFT, and frequency-domain filters
  metrics.ts          # Image quality metrics
  animation.ts        # Image interpolation for compare mode
  filterDefinitions.ts# Catalog of filters, formulas, and parameters
```

## How It Works

1. The uploaded image is loaded into a browser canvas and resized to a maximum of 512px for better performance during FFT and convolution-heavy operations.
2. A selected filter is applied through shared processing logic in `app/page.tsx` and `lib/filters.ts` or `lib/fft.ts`.
3. The result is rendered in the workspace, and the app optionally computes metrics and auxiliary views such as the magnitude spectrum.
4. Users can animate the transformation, compare outputs, and export the processed image.

## Notes

- Processing is client-side, so results depend on browser resources.
- FFT-heavy operations benefit from the built-in image downscaling step.
- Metrics are skipped for pure FFT visualization mode because it is intended as a spectrum view, not a spatial-domain reconstruction.

## Future Improvements

- More restoration filters and deblurring methods
- Color-space operations
- Region-based segmentation
- More advanced morphology tools
- Batch comparison presets for classroom demos
