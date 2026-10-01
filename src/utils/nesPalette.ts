/**
 * Authentic NES 2C02 PPU Master Palette
 * Canonical composite video matrix used by emulators (Nestopia, FCEUX, Mesen)
 */

import { NesColor } from '../types/nes';

export const NES_MASTER_PALETTE: NesColor[] = [
  // $00 - $0F
  { index: 0x00, hexIndex: '$00', rgb: [102, 102, 102], hexColor: '#666666', name: 'Medium Gray' },
  { index: 0x01, hexIndex: '$01', rgb: [0, 42, 136], hexColor: '#002a88', name: 'Deep Blue' },
  { index: 0x02, hexIndex: '$02', rgb: [20, 18, 167], hexColor: '#1412a7', name: 'Dark Indigo' },
  { index: 0x03, hexIndex: '$03', rgb: [59, 0, 164], hexColor: '#3b00a4', name: 'Dark Violet' },
  { index: 0x04, hexIndex: '$04', rgb: [92, 0, 126], hexColor: '#5c007e', name: 'Dark Magenta' },
  { index: 0x05, hexIndex: '$05', rgb: [110, 0, 64], hexColor: '#6e0040', name: 'Dark Rose' },
  { index: 0x06, hexIndex: '$06', rgb: [108, 6, 0], hexColor: '#6c0600', name: 'Dark Red' },
  { index: 0x07, hexIndex: '$07', rgb: [86, 29, 0], hexColor: '#561d00', name: 'Dark Amber' },
  { index: 0x08, hexIndex: '$08', rgb: [51, 53, 0], hexColor: '#333500', name: 'Dark Olive' },
  { index: 0x09, hexIndex: '$09', rgb: [11, 72, 0], hexColor: '#0b4800', name: 'Dark Green' },
  { index: 0x0A, hexIndex: '$0A', rgb: [0, 82, 0], hexColor: '#005200', name: 'Deep Forest' },
  { index: 0x0B, hexIndex: '$0B', rgb: [0, 79, 8], hexColor: '#004f08', name: 'Forest Green' },
  { index: 0x0C, hexIndex: '$0C', rgb: [0, 64, 77], hexColor: '#00404d', name: 'Dark Teal' },
  { index: 0x0D, hexIndex: '$0D', rgb: [0, 0, 0], hexColor: '#000000', name: 'Black' },
  { index: 0x0E, hexIndex: '$0E', rgb: [0, 0, 0], hexColor: '#000000', name: 'Black' },
  { index: 0x0F, hexIndex: '$0F', rgb: [0, 0, 0], hexColor: '#000000', name: 'NES Black ($0F)' },

  // $10 - $1F
  { index: 0x10, hexIndex: '$10', rgb: [173, 173, 173], hexColor: '#adadad', name: 'Light Gray' },
  { index: 0x11, hexIndex: '$11', rgb: [21, 95, 217], hexColor: '#155fd9', name: 'Navy Blue' },
  { index: 0x12, hexIndex: '$12', rgb: [66, 64, 255], hexColor: '#4240ff', name: 'Blue Violet' },
  { index: 0x13, hexIndex: '$13', rgb: [119, 40, 253], hexColor: '#7728fd', name: 'Purple' },
  { index: 0x14, hexIndex: '$14', rgb: [160, 26, 204], hexColor: '#a01acc', name: 'Magenta' },
  { index: 0x15, hexIndex: '$15', rgb: [183, 30, 123], hexColor: '#b71e7b', name: 'Rose Red' },
  { index: 0x16, hexIndex: '$16', rgb: [180, 57, 21], hexColor: '#b43915', name: 'Brick Red' },
  { index: 0x17, hexIndex: '$17', rgb: [152, 87, 0], hexColor: '#985700', name: 'Orange Brown' },
  { index: 0x18, hexIndex: '$18', rgb: [107, 119, 0], hexColor: '#6b7700', name: 'Olive Green' },
  { index: 0x19, hexIndex: '$19', rgb: [52, 144, 0], hexColor: '#349000', name: 'Grass Green' },
  { index: 0x1A, hexIndex: '$1A', rgb: [12, 156, 0], hexColor: '#0c9c00', name: 'Emerald' },
  { index: 0x1B, hexIndex: '$1B', rgb: [0, 153, 61], hexColor: '#00993d', name: 'Mint Green' },
  { index: 0x1C, hexIndex: '$1C', rgb: [0, 134, 151], hexColor: '#008697', name: 'Cyan Blue' },
  { index: 0x1D, hexIndex: '$1D', rgb: [0, 0, 0], hexColor: '#000000', name: 'Black' },
  { index: 0x1E, hexIndex: '$1E', rgb: [0, 0, 0], hexColor: '#000000', name: 'Black' },
  { index: 0x1F, hexIndex: '$1F', rgb: [0, 0, 0], hexColor: '#000000', name: 'Black' },

  // $20 - $2F
  { index: 0x20, hexIndex: '$20', rgb: [255, 255, 255], hexColor: '#ffffff', name: 'White ($20)' },
  { index: 0x21, hexIndex: '$21', rgb: [100, 176, 255], hexColor: '#64b0ff', name: 'Sky Blue' },
  { index: 0x22, hexIndex: '$22', rgb: [144, 148, 255], hexColor: '#9094ff', name: 'Periwinkle' },
  { index: 0x23, hexIndex: '$23', rgb: [194, 126, 255], hexColor: '#c27eff', name: 'Lavender' },
  { index: 0x24, hexIndex: '$24', rgb: [237, 114, 255], hexColor: '#ed72ff', name: 'Orchid' },
  { index: 0x25, hexIndex: '$25', rgb: [255, 118, 212], hexColor: '#ff76d4', name: 'Carnation Pink' },
  { index: 0x26, hexIndex: '$26', rgb: [255, 142, 128], hexColor: '#ff8e80', name: 'Coral' },
  { index: 0x27, hexIndex: '$27', rgb: [236, 171, 70], hexColor: '#ecab46', name: 'Gold Sand' },
  { index: 0x28, hexIndex: '$28', rgb: [193, 203, 52], hexColor: '#c1cb34', name: 'Yellow Green' },
  { index: 0x29, hexIndex: '$29', rgb: [136, 228, 48], hexColor: '#88e430', name: 'Lime' },
  { index: 0x2A, hexIndex: '$2A', rgb: [86, 240, 98], hexColor: '#56f062', name: 'Bright Green' },
  { index: 0x2B, hexIndex: '$2B', rgb: [64, 239, 176], hexColor: '#40efb0', name: 'Aquamarine' },
  { index: 0x2C, hexIndex: '$2C', rgb: [66, 222, 251], hexColor: '#42defb', name: 'Vibrant Cyan' },
  { index: 0x2D, hexIndex: '$2D', rgb: [78, 78, 78], hexColor: '#4e4e4e', name: 'Slate Gray' },
  { index: 0x2E, hexIndex: '$2E', rgb: [0, 0, 0], hexColor: '#000000', name: 'Black' },
  { index: 0x2F, hexIndex: '$2F', rgb: [0, 0, 0], hexColor: '#000000', name: 'Black' },

  // $30 - $3F
  { index: 0x30, hexIndex: '$30', rgb: [255, 255, 255], hexColor: '#ffffff', name: 'Pure White' },
  { index: 0x31, hexIndex: '$31', rgb: [192, 223, 255], hexColor: '#c0dfff', name: 'Pale Blue' },
  { index: 0x32, hexIndex: '$32', rgb: [211, 210, 255], hexColor: '#d3d2ff', name: 'Soft Lilac' },
  { index: 0x33, hexIndex: '$33', rgb: [232, 200, 255], hexColor: '#e8c8ff', name: 'Pale Violet' },
  { index: 0x34, hexIndex: '$34', rgb: [251, 194, 255], hexColor: '#fbc2ff', name: 'Light Pink' },
  { index: 0x35, hexIndex: '$35', rgb: [255, 196, 237], hexColor: '#ffc4ed', name: 'Powder Pink' },
  { index: 0x36, hexIndex: '$36', rgb: [255, 206, 199], hexColor: '#ffce87', name: 'Warm Cream' },
  { index: 0x37, hexIndex: '$37', rgb: [247, 219, 172], hexColor: '#f7dbac', name: 'Beige' },
  { index: 0x38, hexIndex: '$38', rgb: [228, 233, 163], hexColor: '#e4e9a3', name: 'Pastel Yellow' },
  { index: 0x39, hexIndex: '$39', rgb: [202, 244, 161], hexColor: '#caf4a1', name: 'Mint Cream' },
  { index: 0x3A, hexIndex: '$3A', rgb: [180, 249, 183], hexColor: '#b4f9b7', name: 'Seafoam' },
  { index: 0x3B, hexIndex: '$3B', rgb: [170, 248, 217], hexColor: '#aaf8d9', name: 'Ice Teal' },
  { index: 0x3C, hexIndex: '$3C', rgb: [171, 240, 251], hexColor: '#abf0fb', name: 'Ice Blue' },
  { index: 0x3D, hexIndex: '$3D', rgb: [178, 178, 178], hexColor: '#b2b2b2', name: 'Silver' },
  { index: 0x3E, hexIndex: '$3E', rgb: [0, 0, 0], hexColor: '#000000', name: 'Black' },
  { index: 0x3F, hexIndex: '$3F', rgb: [0, 0, 0], hexColor: '#000000', name: 'Black' },
];

export interface PalettePreset {
  id: string;
  name: string;
  description: string;
  colors: number[]; // 4 indices into NES palette
}

export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'monochrome_high_contrast',
    name: 'Monochrome High Contrast',
    description: 'Black, Mid Gray, Light Gray, White — ideal for Bad Apple, line art, and typography',
    colors: [0x0F, 0x00, 0x10, 0x20],
  },
  {
    id: 'famicom_crimson',
    name: 'Famicom Red & Gold',
    description: 'Authentic Nintendo Famicom shell aesthetic with crimson, gold, and white',
    colors: [0x0F, 0x16, 0x27, 0x20],
  },
  {
    id: 'gameboy_dmg',
    name: 'DMG Green Phosphor',
    description: 'Classic 4-shade greenish retro liquid crystal handheld palette',
    colors: [0x08, 0x19, 0x2A, 0x39],
  },
  {
    id: 'cyber_neon',
    name: 'Cyberpunk Neon Blue',
    description: 'Deep navy, vibrant indigo, electric sky blue, and ice white',
    colors: [0x0F, 0x02, 0x21, 0x30],
  },
  {
    id: 'amber_crt',
    name: 'Amber CRT Terminal',
    description: 'Warm monochrome amber phosphor display glow',
    colors: [0x0F, 0x07, 0x17, 0x27],
  },
  {
    id: 'emerald_matrix',
    name: 'Phosphor Green Terminal',
    description: 'Dark black, deep green, emerald, and bright green lime',
    colors: [0x0F, 0x0A, 0x1A, 0x2A],
  },
  {
    id: 'dungeon_synth',
    name: 'Dungeon Synth Violet',
    description: 'Obsidian, dark violet, purple, and pastel lavender',
    colors: [0x0F, 0x03, 0x13, 0x23],
  },
  {
    id: 'retro_arcade_fire',
    name: 'Retro Arcade Flame',
    description: 'Deep black, brick red, blazing orange, and pure yellow-white',
    colors: [0x0F, 0x06, 0x16, 0x28],
  },
];

export function getNesColor(index: number): NesColor {
  const safeIndex = (index & 0x3f);
  return NES_MASTER_PALETTE[safeIndex] || NES_MASTER_PALETTE[0x0f];
}

/**
 * Calculates Euclidean distance weighted by human visual perception (Rec. 601 luma)
 */
export function colorDistanceSq(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number
): number {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  // Weighted Euclidean (Red: 0.30, Green: 0.59, Blue: 0.11)
  return 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
}

/**
 * Finds the closest color index among the active 4 sub-palette colors
 */
export function findClosestPaletteIndex(
  r: number,
  g: number,
  b: number,
  activePaletteIndices: number[]
): number {
  let closestSubIndex = 0;
  let minDistance = Infinity;

  for (let i = 0; i < activePaletteIndices.length; i++) {
    const nesColor = getNesColor(activePaletteIndices[i]);
    const [nr, ng, nb] = nesColor.rgb;
    const dist = colorDistanceSq(r, g, b, nr, ng, nb);
    if (dist < minDistance) {
      minDistance = dist;
      closestSubIndex = i;
    }
  }

  return closestSubIndex;
}
