/**
 * NES System and ROM Header Specifications
 * Covers standard iNES 1.0 and modern NES 2.0 (NES 2.0 Rev 2024)
 */

export interface NesColor {
  index: number; // 0x00 to 0x3F
  hexIndex: string; // "$0F", "$20", etc.
  rgb: [number, number, number]; // [r, g, b]
  hexColor: string; // "#000000"
  name: string; // e.g. "Black", "White", "Sky Blue"
}

export type MirroringType = 
  | 'horizontal' // Vertical arrangement (CIRAM A10 = PPU A11) - most games with vertical scrolling
  | 'vertical'   // Horizontal arrangement (CIRAM A10 = PPU A10) - most games with horizontal scrolling
  | 'four_screen'// Extra 2KB VRAM on board
  | 'single_screen_lower'
  | 'single_screen_upper';

export type TvSystem = 'ntsc' | 'pal' | 'multi' | 'dendy';

export interface NesRomHeader {
  // 16-byte binary data
  rawBytes: Uint8Array; // Exactly 16 bytes
  
  // Format version
  format: 'ines_1_0' | 'nes_2_0' | 'archaic_ines';
  
  // PRG and CHR sizes
  prgRomSizeKiB: number; // in KiB (e.g. 16, 32, 64, 128, 256, 512, 1024, 2048)
  chrRomSizeKiB: number; // in KiB (0 means CHR-RAM, or 8, 16, 32, 64, 128, etc.)
  prgRamSizeKiB: number; // volatile PRG-RAM (e.g. 0, 8KB, etc.)
  prgNvramSizeKiB: number; // battery-backed PRG-NVRAM
  chrRamSizeKiB: number; // volatile CHR-RAM
  chrNvramSizeKiB: number; // battery-backed CHR-NVRAM
  
  // Board & Mapper
  mapperNumber: number; // 0 to 4095
  submapperNumber: number; // 0 to 15 (NES 2.0)
  mapperName: string;
  
  // Flags & Mirroring
  mirroring: MirroringType;
  hasBattery: boolean;
  hasTrainer: boolean; // 512-byte trainer at $7000-$71FF
  fourScreenVram: boolean;
  
  // NES 2.0 extended flags
  tvSystem: TvSystem;
  vsSystem: boolean;
  playchoice10: boolean;
  expansionDevice: number; // NES 2.0 Default Expansion Device (0 = Standard controllers, etc.)
  miscRoms: number;
}

export type DitherAlgorithm = 'floyd_steinberg' | 'atkinson' | 'bayer_4x4' | 'none';

export interface VideoProcessingSettings {
  targetFps: number; // 10, 15, 20, 30, 60
  width: number; // usually 256 or 128
  height: number; // usually 240 or 120
  aspectMode: 'fill' | 'fit_letterbox' | 'center_crop';
  dither: DitherAlgorithm;
  ditherStrength: number; // 0.0 to 1.0
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  gamma: number; // 0.5 to 2.5
  invert: boolean;
  selectedPalette: number[]; // 4 indices into NES palette ($00-$3F), e.g. [0x0F, 0x00, 0x10, 0x20]
  autoDeduplicateTiles: boolean;
  maxFramesToExtract: number;
}

export interface NesTile {
  index: number; // tile index in pattern table (0..255 or 0..511)
  data: Uint8Array; // 16 bytes (Plane 0: 8 bytes, Plane 1: 8 bytes)
  pixelData: number[][]; // 8x8 array of color indices (0..3)
  hash: string;
}

export interface ExtractedFrame {
  frameIndex: number;
  timestamp: number;
  canvas: HTMLCanvasElement;
  quantizedCanvas: HTMLCanvasElement;
  tiles: NesTile[];
  nametable: number[]; // 32 * 30 = 960 tile references
  uniqueTileCount: number;
}

export interface MapperInfo {
  number: number;
  name: string;
  shortDescription: string;
  prgBanking: string;
  chrBanking: string;
  exampleGames: string[];
}
