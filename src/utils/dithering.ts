/**
 * High-performance quantization and dithering algorithms for 2bpp NES color reduction
 */

import { DitherAlgorithm } from '../types/nes';
import { getNesColor, findClosestPaletteIndex } from './nesPalette';

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export interface QuantizeOptions {
  algorithm: DitherAlgorithm;
  ditherStrength: number; // 0.0 to 1.0
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  gamma: number; // 0.5 to 2.5
  invert: boolean;
  palette: number[]; // 4 indices into NES palette
}

/**
 * Applies contrast, brightness, gamma, and inversion to an RGB component
 */
function adjustComponent(
  value: number,
  brightness: number,
  contrast: number,
  gamma: number,
  invert: boolean
): number {
  let v = value;
  if (invert) v = 255 - v;

  // Brightness
  if (brightness !== 0) {
    v += brightness * 2.55;
  }

  // Contrast: factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
  if (contrast !== 0) {
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    v = factor * (v - 128) + 128;
  }

  // Gamma
  if (gamma !== 1.0 && gamma > 0) {
    v = 255 * Math.pow(Math.max(0, Math.min(255, v)) / 255, 1 / gamma);
  }

  return Math.max(0, Math.min(255, v));
}

/**
 * Quantizes an ImageData buffer into 4 NES sub-palette colors using specified dithering
 * Returns both the modified ImageData and an 8x8-tiled index matrix (0..3)
 */
export function quantizeImageData(
  sourceImageData: ImageData,
  options: QuantizeOptions
): {
  quantizedImageData: ImageData;
  colorIndices: Uint8Array; // width * height array of indices 0..3
} {
  const { width, height } = sourceImageData;
  const src = sourceImageData.data;
  const outImageData = new ImageData(width, height);
  const dst = outImageData.data;
  const colorIndices = new Uint8Array(width * height);

  const { algorithm, ditherStrength, brightness, contrast, gamma, invert, palette } = options;

  // Precompute RGB table of the 4 active palette colors
  const paletteRgb = palette.map((idx) => getNesColor(idx).rgb);

  // If error diffusion dithering is chosen, we maintain float buffers for RGB errors
  if (algorithm === 'floyd_steinberg' || algorithm === 'atkinson') {
    // Float buffers for channels
    const rBuf = new Float32Array(width * height);
    const gBuf = new Float32Array(width * height);
    const bBuf = new Float32Array(width * height);

    // Initial pre-processing
    for (let i = 0; i < width * height; i++) {
      const p = i * 4;
      rBuf[i] = adjustComponent(src[p], brightness, contrast, gamma, invert);
      gBuf[i] = adjustComponent(src[p + 1], brightness, contrast, gamma, invert);
      bBuf[i] = adjustComponent(src[p + 2], brightness, contrast, gamma, invert);
    }

    const strength = Math.max(0, Math.min(1, ditherStrength));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const curR = Math.max(0, Math.min(255, rBuf[idx]));
        const curG = Math.max(0, Math.min(255, gBuf[idx]));
        const curB = Math.max(0, Math.min(255, bBuf[idx]));

        // Find closest color
        const palIdx = findClosestPaletteIndex(curR, curG, curB, palette);
        colorIndices[idx] = palIdx;

        const [targetR, targetG, targetB] = paletteRgb[palIdx];

        // Store destination pixel
        const dstOffset = idx * 4;
        dst[dstOffset] = targetR;
        dst[dstOffset + 1] = targetG;
        dst[dstOffset + 2] = targetB;
        dst[dstOffset + 3] = 255;

        // Error calculations
        const errR = (curR - targetR) * strength;
        const errG = (curG - targetG) * strength;
        const errB = (curB - targetB) * strength;

        if (algorithm === 'floyd_steinberg') {
          // Floyd-Steinberg distribution:
          //       *   7/16
          // 3/16 5/16 1/16
          if (x + 1 < width) {
            rBuf[idx + 1] += errR * (7 / 16);
            gBuf[idx + 1] += errG * (7 / 16);
            bBuf[idx + 1] += errB * (7 / 16);
          }
          if (y + 1 < height) {
            if (x - 1 >= 0) {
              const bl = idx + width - 1;
              rBuf[bl] += errR * (3 / 16);
              gBuf[bl] += errG * (3 / 16);
              bBuf[bl] += errB * (3 / 16);
            }
            const b = idx + width;
            rBuf[b] += errR * (5 / 16);
            gBuf[b] += errG * (5 / 16);
            bBuf[b] += errB * (5 / 16);
            if (x + 1 < width) {
              const br = idx + width + 1;
              rBuf[br] += errR * (1 / 16);
              gBuf[br] += errG * (1 / 16);
              bBuf[br] += errB * (1 / 16);
            }
          }
        } else if (algorithm === 'atkinson') {
          // Atkinson dithering (1/8 each to 6 neighbors):
          //       *   1/8  1/8
          // 1/8  1/8  1/8
          //      1/8
          const aErrR = errR * (1 / 8);
          const aErrG = errG * (1 / 8);
          const aErrB = errB * (1 / 8);

          if (x + 1 < width) {
            rBuf[idx + 1] += aErrR;
            gBuf[idx + 1] += aErrG;
            bBuf[idx + 1] += aErrB;
          }
          if (x + 2 < width) {
            rBuf[idx + 2] += aErrR;
            gBuf[idx + 2] += aErrG;
            bBuf[idx + 2] += aErrB;
          }
          if (y + 1 < height) {
            if (x - 1 >= 0) {
              const bl = idx + width - 1;
              rBuf[bl] += aErrR;
              gBuf[bl] += aErrG;
              bBuf[bl] += aErrB;
            }
            const b = idx + width;
            rBuf[b] += aErrR;
            gBuf[b] += aErrG;
            bBuf[b] += aErrB;
            if (x + 1 < width) {
              const br = idx + width + 1;
              rBuf[br] += aErrR;
              gBuf[br] += aErrG;
              bBuf[br] += aErrB;
            }
          }
          if (y + 2 < height) {
            const bb = idx + width * 2;
            rBuf[bb] += aErrR;
            gBuf[bb] += aErrG;
            bBuf[bb] += aErrB;
          }
        }
      }
    }
  } else {
    // Non-diffusive algorithms: Bayer 4x4 or None
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const p = idx * 4;

        let r = adjustComponent(src[p], brightness, contrast, gamma, invert);
        let g = adjustComponent(src[p + 1], brightness, contrast, gamma, invert);
        let b = adjustComponent(src[p + 2], brightness, contrast, gamma, invert);

        if (algorithm === 'bayer_4x4') {
          const matrixVal = (BAYER_4X4[y % 4][x % 4] / 16.0 - 0.5) * 64 * ditherStrength;
          r = Math.max(0, Math.min(255, r + matrixVal));
          g = Math.max(0, Math.min(255, g + matrixVal));
          b = Math.max(0, Math.min(255, b + matrixVal));
        }

        const palIdx = findClosestPaletteIndex(r, g, b, palette);
        colorIndices[idx] = palIdx;

        const [targetR, targetG, targetB] = paletteRgb[palIdx];
        dst[p] = targetR;
        dst[p + 1] = targetG;
        dst[p + 2] = targetB;
        dst[p + 3] = 255;
      }
    }
  }

  return { quantizedImageData: outImageData, colorIndices };
}
