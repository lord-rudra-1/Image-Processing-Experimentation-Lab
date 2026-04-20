// Filter definitions with formulas and descriptions

export interface FilterParameter {
  name: string;
  key: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface FilterDefinition {
  id: string;
  name: string;
  formula: string;
  description: string;
  parameters: FilterParameter[];
  chapter: number;
}

export const filterDefinitions: Record<string, FilterDefinition[]> = {
  'Chapter 3: Intensity Transformations': [
    {
      id: 'negative',
      name: 'Negative Transformation',
      formula: 's = L - 1 - r',
      description: 'Reverses intensity levels, making dark pixels light and vice versa. Useful for enhancing white/gray details in dark regions.',
      parameters: [],
      chapter: 3,
    },
    {
      id: 'log',
      name: 'Log Transformation',
      formula: 's = c \\cdot \\log(1 + r)',
      description: 'Expands dark pixel values while compressing bright ones. Useful for displaying Fourier spectrum.',
      parameters: [
        { name: 'Constant (c)', key: 'c', min: 1, max: 100, step: 1, default: 45 },
      ],
      chapter: 3,
    },
    {
      id: 'gamma',
      name: 'Power-Law (Gamma)',
      formula: 's = c \\cdot r^{\\gamma}',
      description: 'Adjusts image brightness using power-law transformation. γ < 1 brightens, γ > 1 darkens.',
      parameters: [
        { name: 'Gamma (γ)', key: 'gamma', min: 0.1, max: 5, step: 0.1, default: 1 },
        { name: 'Constant (c)', key: 'c', min: 0.1, max: 2, step: 0.1, default: 1 },
      ],
      chapter: 3,
    },
    {
      id: 'contrast',
      name: 'Contrast Stretching',
      formula: 's = \\frac{s_2 - s_1}{r_2 - r_1}(r - r_1) + s_1',
      description: 'Increases dynamic range by mapping a narrow range of input intensities to a wider range of output intensities.',
      parameters: [
        { name: 'r1', key: 'r1', min: 0, max: 128, step: 1, default: 70 },
        { name: 's1', key: 's1', min: 0, max: 128, step: 1, default: 0 },
        { name: 'r2', key: 'r2', min: 128, max: 255, step: 1, default: 180 },
        { name: 's2', key: 's2', min: 128, max: 255, step: 1, default: 255 },
      ],
      chapter: 3,
    },
    {
      id: 'bitplane',
      name: 'Bit-plane Slicing',
      formula: 's = \\text{bit}_k(r)',
      description: 'Extracts individual bit planes from the image. Higher planes contain more structural information.',
      parameters: [
        { name: 'Bit Plane (0-7)', key: 'bitPlane', min: 0, max: 7, step: 1, default: 7 },
      ],
      chapter: 3,
    },
  ],
  'Chapter 2: Histogram Operations': [
    {
      id: 'histogram-eq',
      name: 'Histogram Equalization',
      formula: 's_k = (L-1) \\sum_{j=0}^{k} p_r(r_j)',
      description: 'Enhances contrast by spreading out intensity distribution. Uses CDF to map intensities.',
      parameters: [],
      chapter: 2,
    },
  ],
  'Chapter 4: Spatial Filtering': [
    {
      id: 'mean',
      name: 'Mean Filter (Box)',
      formula: 'g(x,y) = \\frac{1}{mn} \\sum_{s,t \\in S} f(s,t)',
      description: 'Smoothing filter that replaces each pixel with the average of its neighborhood. Reduces noise but blurs edges.',
      parameters: [
        { name: 'Kernel Size', key: 'size', min: 3, max: 11, step: 2, default: 3 },
      ],
      chapter: 4,
    },
    {
      id: 'gaussian',
      name: 'Gaussian Filter',
      formula: 'G(x,y) = \\frac{1}{2\\pi\\sigma^2} e^{-\\frac{x^2+y^2}{2\\sigma^2}}',
      description: 'Weighted average filter with Gaussian distribution. Better edge preservation than mean filter.',
      parameters: [
        { name: 'Sigma (σ)', key: 'sigma', min: 0.5, max: 5, step: 0.5, default: 1 },
      ],
      chapter: 4,
    },
    {
      id: 'laplacian',
      name: 'Laplacian Filter',
      formula: '\\nabla^2 f = \\frac{\\partial^2 f}{\\partial x^2} + \\frac{\\partial^2 f}{\\partial y^2}',
      description: 'Second derivative operator that highlights regions of rapid intensity change. Used for edge detection.',
      parameters: [],
      chapter: 4,
    },
    {
      id: 'sobel',
      name: 'Sobel Edge Detection',
      formula: 'G = \\sqrt{G_x^2 + G_y^2}',
      description: 'Computes image gradient using 3×3 kernels. Combines horizontal and vertical derivatives.',
      parameters: [],
      chapter: 4,
    },
    {
      id: 'prewitt',
      name: 'Prewitt Operator',
      formula: 'G = \\sqrt{G_x^2 + G_y^2}',
      description: 'Similar to Sobel but with equal weights. Slightly less sensitive to noise.',
      parameters: [],
      chapter: 4,
    },
    {
      id: 'sharpen',
      name: 'Sharpening Filter',
      formula: 'g(x,y) = f(x,y) + k \\cdot \\nabla^2 f(x,y)',
      description: 'Enhances edges by adding scaled Laplacian to original image.',
      parameters: [
        { name: 'Amount', key: 'amount', min: 0.1, max: 3, step: 0.1, default: 1 },
      ],
      chapter: 4,
    },
  ],
  'Chapter 5: Frequency Domain': [
    {
      id: 'fft',
      name: 'FFT Visualization',
      formula: 'F(u,v) = \\sum_{x=0}^{M-1} \\sum_{y=0}^{N-1} f(x,y) e^{-j2\\pi(ux/M + vy/N)}',
      description: 'Displays magnitude spectrum of the image in frequency domain using log scaling.',
      parameters: [],
      chapter: 5,
    },
    {
      id: 'idealLP',
      name: 'Ideal Low Pass Filter',
      formula: 'H(u,v) = \\begin{cases} 1 & D(u,v) \\leq D_0 \\\\ 0 & D(u,v) > D_0 \\end{cases}',
      description: 'Passes all frequencies within cutoff radius, blocks all others. Causes ringing artifacts.',
      parameters: [
        { name: 'Cutoff (D₀)', key: 'cutoff', min: 5, max: 100, step: 5, default: 30 },
      ],
      chapter: 5,
    },
    {
      id: 'idealHP',
      name: 'Ideal High Pass Filter',
      formula: 'H(u,v) = \\begin{cases} 0 & D(u,v) \\leq D_0 \\\\ 1 & D(u,v) > D_0 \\end{cases}',
      description: 'Blocks low frequencies, passes high frequencies. Extracts edges and details.',
      parameters: [
        { name: 'Cutoff (D₀)', key: 'cutoff', min: 5, max: 100, step: 5, default: 30 },
      ],
      chapter: 5,
    },
    {
      id: 'butterworthLP',
      name: 'Butterworth Low Pass',
      formula: 'H(u,v) = \\frac{1}{1 + [D(u,v)/D_0]^{2n}}',
      description: 'Smooth transition from passband to stopband. No ringing artifacts.',
      parameters: [
        { name: 'Cutoff (D₀)', key: 'cutoff', min: 5, max: 100, step: 5, default: 30 },
        { name: 'Order (n)', key: 'order', min: 1, max: 5, step: 1, default: 2 },
      ],
      chapter: 5,
    },
    {
      id: 'butterworthHP',
      name: 'Butterworth High Pass',
      formula: 'H(u,v) = \\frac{1}{1 + [D_0/D(u,v)]^{2n}}',
      description: 'High pass version of Butterworth filter with smooth transition.',
      parameters: [
        { name: 'Cutoff (D₀)', key: 'cutoff', min: 5, max: 100, step: 5, default: 30 },
        { name: 'Order (n)', key: 'order', min: 1, max: 5, step: 1, default: 2 },
      ],
      chapter: 5,
    },
    {
      id: 'gaussianLP',
      name: 'Gaussian Low Pass',
      formula: 'H(u,v) = e^{-D^2(u,v)/2D_0^2}',
      description: 'Smooth low pass filter with no ringing. Gradual frequency attenuation.',
      parameters: [
        { name: 'Cutoff (D₀)', key: 'cutoff', min: 5, max: 100, step: 5, default: 30 },
      ],
      chapter: 5,
    },
    {
      id: 'gaussianHP',
      name: 'Gaussian High Pass',
      formula: 'H(u,v) = 1 - e^{-D^2(u,v)/2D_0^2}',
      description: 'Smooth high pass filter. Extracts high frequency components gradually.',
      parameters: [
        { name: 'Cutoff (D₀)', key: 'cutoff', min: 5, max: 100, step: 5, default: 30 },
      ],
      chapter: 5,
    },
  ],
  'Chapter 6: Noise & Restoration': [
    {
      id: 'gaussianNoise',
      name: 'Add Gaussian Noise',
      formula: 'p(z) = \\frac{1}{\\sqrt{2\\pi}\\sigma} e^{-(z-\\mu)^2/2\\sigma^2}',
      description: 'Adds normally distributed random noise to the image.',
      parameters: [
        { name: 'Mean (μ)', key: 'mean', min: -50, max: 50, step: 5, default: 0 },
        { name: 'Std Dev (σ)', key: 'stddev', min: 5, max: 100, step: 5, default: 25 },
      ],
      chapter: 6,
    },
    {
      id: 'saltPepper',
      name: 'Salt & Pepper Noise',
      formula: 'P(z) = \\begin{cases} P_s & z = L-1 \\\\ P_p & z = 0 \\end{cases}',
      description: 'Adds impulse noise with random white and black pixels.',
      parameters: [
        { name: 'Density', key: 'density', min: 0.01, max: 0.3, step: 0.01, default: 0.05 },
      ],
      chapter: 6,
    },
    {
      id: 'motionBlur',
      name: 'Motion Blur',
      formula: 'H(u,v) = \\frac{\\sin(\\pi(ua + vb))}{\\pi(ua + vb)} e^{-j\\pi(ua+vb)}',
      description: 'Simulates linear motion blur with controllable length and angle.',
      parameters: [
        { name: 'Length', key: 'length', min: 3, max: 25, step: 2, default: 15 },
        { name: 'Angle (°)', key: 'angle', min: 0, max: 180, step: 15, default: 0 },
      ],
      chapter: 6,
    },
    {
      id: 'median',
      name: 'Median Filter',
      formula: '\\hat{f}(x,y) = \\text{median}_{(s,t) \\in S} \\{g(s,t)\\}',
      description: 'Non-linear filter that replaces each pixel with median of neighborhood. Excellent for salt & pepper noise.',
      parameters: [
        { name: 'Kernel Size', key: 'size', min: 3, max: 9, step: 2, default: 3 },
      ],
      chapter: 6,
    },
  ],
  'Chapter 7: Morphological Operations': [
    {
      id: 'erosion',
      name: 'Erosion',
      formula: 'A \\ominus B = \\{z | (B)_z \\subseteq A\\}',
      description: 'Shrinks objects by removing boundary pixels. The structuring element must fit entirely.',
      parameters: [
        { name: 'Kernel Size', key: 'kernelSize', min: 3, max: 9, step: 2, default: 3 },
      ],
      chapter: 7,
    },
    {
      id: 'dilation',
      name: 'Dilation',
      formula: 'A \\oplus B = \\{z | (\\hat{B})_z \\cap A \\neq \\emptyset\\}',
      description: 'Expands objects by adding pixels to boundaries. Any overlap with structuring element is included.',
      parameters: [
        { name: 'Kernel Size', key: 'kernelSize', min: 3, max: 9, step: 2, default: 3 },
      ],
      chapter: 7,
    },
    {
      id: 'opening',
      name: 'Opening',
      formula: 'A \\circ B = (A \\ominus B) \\oplus B',
      description: 'Erosion followed by dilation. Removes small bright spots and thin protrusions.',
      parameters: [
        { name: 'Kernel Size', key: 'kernelSize', min: 3, max: 9, step: 2, default: 3 },
      ],
      chapter: 7,
    },
    {
      id: 'closing',
      name: 'Closing',
      formula: 'A \\bullet B = (A \\oplus B) \\ominus B',
      description: 'Dilation followed by erosion. Fills small holes and gaps.',
      parameters: [
        { name: 'Kernel Size', key: 'kernelSize', min: 3, max: 9, step: 2, default: 3 },
      ],
      chapter: 7,
    },
    {
      id: 'boundary',
      name: 'Boundary Extraction',
      formula: '\\beta(A) = A - (A \\ominus B)',
      description: 'Extracts object boundaries by subtracting eroded image from original.',
      parameters: [
        { name: 'Kernel Size', key: 'kernelSize', min: 3, max: 9, step: 2, default: 3 },
      ],
      chapter: 7,
    },
  ],
};

export interface ChapterMeta {
  key: string;
  title: string;
  shortTitle: string;
  chapter: number;
  accent: string; // CSS var reference for accent color
}

export const chapterMeta: Record<string, ChapterMeta> = {
  'Chapter 3: Intensity Transformations': {
    key: 'intensity',
    title: 'Intensity Transformations',
    shortTitle: 'Ch 3 · Intensity',
    chapter: 3,
    accent: 'var(--chart-1)',
  },
  'Chapter 2: Histogram Operations': {
    key: 'histogram',
    title: 'Histogram Operations',
    shortTitle: 'Ch 2 · Histogram',
    chapter: 2,
    accent: 'var(--chart-2)',
  },
  'Chapter 4: Spatial Filtering': {
    key: 'spatial',
    title: 'Spatial Filtering',
    shortTitle: 'Ch 4 · Spatial',
    chapter: 4,
    accent: 'var(--chart-3)',
  },
  'Chapter 5: Frequency Domain': {
    key: 'frequency',
    title: 'Frequency Domain',
    shortTitle: 'Ch 5 · Frequency',
    chapter: 5,
    accent: 'var(--chart-4)',
  },
  'Chapter 6: Noise & Restoration': {
    key: 'restoration',
    title: 'Noise & Restoration',
    shortTitle: 'Ch 6 · Restoration',
    chapter: 6,
    accent: 'var(--chart-5)',
  },
  'Chapter 7: Morphological Operations': {
    key: 'morphology',
    title: 'Morphological Operations',
    shortTitle: 'Ch 7 · Morphology',
    chapter: 7,
    accent: 'var(--chart-1)',
  },
};

export function getAllFilters(): FilterDefinition[] {
  return Object.values(filterDefinitions).flat();
}

export function getFilterById(id: string): FilterDefinition | undefined {
  return getAllFilters().find(f => f.id === id);
}

export function getChapterForFilter(id: string): ChapterMeta | undefined {
  for (const [chapterName, filters] of Object.entries(filterDefinitions)) {
    if (filters.some(f => f.id === id)) {
      return chapterMeta[chapterName];
    }
  }
  return undefined;
}
