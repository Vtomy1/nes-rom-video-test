/**
 * NES 2bpp Planar Tile Encoding and Nametable Compression
 * 
 * In NES hardware:
 * An 8x8 tile takes 16 bytes:
 * - Bytes 0..7: Bitplane 0 (least significant bit of each pixel)
 * - Bytes 8..15: Bitplane 1 (most significant bit of each pixel)
 * Pixel color (0..3) = (plane1_bit << 1) | plane0_bit
 */

import { NesTile } from '../types/nes';

/**
 * Encodes an 8x8 matrix of palette indices (0..3) into 16 bytes of NES 2bpp format
 */
export function encodeTile2bpp(pixels8x8: number[][]): Uint8Array {
  const bytes = new Uint8Array(16);

  for (let row = 0; row < 8; row++) {
    let plane0 = 0;
    let plane1 = 0;

    for (let col = 0; col < 8; col++) {
      const colorVal = pixels8x8[row][col] & 0x03;
      const bit0 = colorVal & 0x01;
      const bit1 = (colorVal >> 1) & 0x01;

      // Bit 7 is leftmost pixel, bit 0 is rightmost pixel
      const shift = 7 - col;
      plane0 |= (bit0 << shift);
      plane1 |= (bit1 << shift);
    }

    bytes[row] = plane0;
    bytes[row + 8] = plane1;
  }

  return bytes;
}

/**
 * Creates a unique string signature for a 16-byte tile to allow instant deduplication
 */
export function tileHash(tileBytes: Uint8Array): string {
  let hash = '';
  for (let i = 0; i < 16; i++) {
    hash += tileBytes[i].toString(16).padStart(2, '0');
  }
  return hash;
}

/**
 * Decodes 16 bytes of NES 2bpp data back to an 8x8 array of color indices (0..3)
 */
export function decodeTile2bpp(bytes: Uint8Array): number[][] {
  const pixels: number[][] = [];

  for (let row = 0; row < 8; row++) {
    const rowPixels: number[] = [];
    const p0 = bytes[row];
    const p1 = bytes[row + 8];

    for (let col = 0; col < 8; col++) {
      const shift = 7 - col;
      const bit0 = (p0 >> shift) & 0x01;
      const bit1 = (p1 >> shift) & 0x01;
      rowPixels.push((bit1 << 1) | bit0);
    }
    pixels.push(rowPixels);
  }

  return pixels;
}

export interface FrameTilingResult {
  tiles: NesTile[];
  nametable: number[]; // 32x30 = 960 tile references
  uniqueTiles: NesTile[];
  totalTiles: number;
}

/**
 * Converts a 256x240 (32x30 tiles) 1D color index array into NES tiles and nametable
 */
export function processFrameToTiles(
  colorIndices: Uint8Array,
  width: number,
  height: number,
  globalTileCache?: Map<string, NesTile>
): FrameTilingResult {
  const tilesX = Math.floor(width / 8);
  const tilesY = Math.floor(height / 8);
  const totalTiles = tilesX * tilesY; // typically 32 * 30 = 960

  const nametable: number[] = new Array(totalTiles);
  const localCache = new Map<string, number>(); // hash -> tile index
  const uniqueTiles: NesTile[] = [];
  const allFrameTiles: NesTile[] = [];

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      // Extract 8x8 pixels
      const pixels: number[][] = [];
      for (let r = 0; r < 8; r++) {
        const rowArr: number[] = [];
        for (let c = 0; c < 8; c++) {
          const px = tx * 8 + c;
          const py = ty * 8 + r;
          const idx = py * width + px;
          rowArr.push(colorIndices[idx] || 0);
        }
        pixels.push(rowArr);
      }

      const tileBytes = encodeTile2bpp(pixels);
      const hash = tileHash(tileBytes);

      let tileIndex: number;

      if (globalTileCache) {
        // Multi-frame banking or global deduplication
        let existing = globalTileCache.get(hash);
        if (!existing) {
          tileIndex = globalTileCache.size;
          existing = {
            index: tileIndex,
            data: tileBytes,
            pixelData: pixels,
            hash,
          };
          globalTileCache.set(hash, existing);
          uniqueTiles.push(existing);
        } else {
          tileIndex = existing.index;
        }
        allFrameTiles.push(existing);
      } else {
        // Per-frame deduplication
        if (localCache.has(hash)) {
          tileIndex = localCache.get(hash)!;
        } else {
          tileIndex = uniqueTiles.length;
          localCache.set(hash, tileIndex);
          const newTile: NesTile = {
            index: tileIndex,
            data: tileBytes,
            pixelData: pixels,
            hash,
          };
          uniqueTiles.push(newTile);
        }
        allFrameTiles.push(uniqueTiles[tileIndex]);
      }

      const ntIndex = ty * tilesX + tx;
      nametable[ntIndex] = tileIndex;
    }
  }

  return {
    tiles: allFrameTiles,
    nametable,
    uniqueTiles,
    totalTiles,
  };
}

/**
 * Combines an array of NesTile objects into an 8 KiB CHR bank (512 tiles * 16 bytes)
 * Or packs multiple banks if tiles exceed 512.
 */
export function buildChrRom(tiles: NesTile[]): {
  chrData: Uint8Array;
  banksCount: number;
  totalSizeKiB: number;
} {
  const tileCount = Math.max(1, tiles.length);
  // NES CHR ROM is packaged in 8 KiB units (512 tiles per 8 KiB)
  const banksCount = Math.max(1, Math.ceil(tileCount / 512));
  const totalSizeBytes = banksCount * 8192;
  const chrData = new Uint8Array(totalSizeBytes);

  for (let i = 0; i < tiles.length && i < banksCount * 512; i++) {
    const offset = i * 16;
    chrData.set(tiles[i].data, offset);
  }

  return {
    chrData,
    banksCount,
    totalSizeKiB: banksCount * 8,
  };
}
