/**
 * Complete iNES 1.0 and NES 2.0 Header Architect, Validator, and Parser
 * Follows official NESdev Wiki specifications
 */

import { NesRomHeader, MirroringType, TvSystem, MapperInfo } from '../types/nes';

export const COMMON_MAPPERS: MapperInfo[] = [
  {
    number: 0,
    name: 'NROM',
    shortDescription: 'Standard Nintendo cart (no mapper chip). 16KB/32KB PRG, 8KB CHR.',
    prgBanking: 'Fixed 16KB or 32KB ($8000-$FFFF)',
    chrBanking: 'Fixed 8KB CHR-ROM ($0000-$1FFF)',
    exampleGames: ['Super Mario Bros.', 'Donkey Kong', 'Pac-Man', 'Duck Hunt', 'Excitebike'],
  },
  {
    number: 1,
    name: 'MMC1 (SxROM)',
    shortDescription: 'Nintendo custom mapper. Serial shift register, bankswitchable PRG and CHR.',
    prgBanking: '16KB or 32KB bankswitching (up to 512KB)',
    chrBanking: '4KB or 8KB bankswitching (up to 128KB)',
    exampleGames: ['The Legend of Zelda', 'Metroid', 'Mega Man 2', 'Kid Icarus', 'Dragon Warrior'],
  },
  {
    number: 2,
    name: 'UNROM / UxROM',
    shortDescription: 'Simple 74HC161 logic IC. 16KB bankswitchable PRG with 8KB CHR-RAM.',
    prgBanking: '16KB switchable at $8000 + 16KB fixed at $C000',
    chrBanking: '8KB CHR-RAM (Tiles loaded dynamically)',
    exampleGames: ['Castlevania', 'Contra', 'Mega Man', 'DuckTales', 'Metal Gear'],
  },
  {
    number: 3,
    name: 'CNROM',
    shortDescription: 'Simple discrete logic. Fixed PRG with up to 32KB bankswitchable CHR.',
    prgBanking: 'Fixed 16KB or 32KB PRG',
    chrBanking: '8KB bankswitching (up to 4 banks = 32KB CHR)',
    exampleGames: ['Gradius', 'Adventure Island', 'Solomon\'s Key', 'Arkanoid'],
  },
  {
    number: 4,
    name: 'MMC3 (TxROM)',
    shortDescription: 'Advanced Nintendo ASIC with scanline IRQ counter. Perfect for video & split-screen.',
    prgBanking: '8KB bankswitching (up to 512KB)',
    chrBanking: '1KB and 2KB bankswitching (up to 256KB - ideal for streaming video tiles!)',
    exampleGames: ['Super Mario Bros. 3', 'Mega Man 3-6', 'Kirby\'s Adventure', 'Castlevania III'],
  },
  {
    number: 5,
    name: 'MMC5 (ExROM)',
    shortDescription: 'Nintendo\'s most powerful mapper. Extended attribute tables, 1KB CHR banking, sound.',
    prgBanking: '8KB, 16KB, or 32KB switching (up to 1024KB)',
    chrBanking: '1KB, 2KB, 4KB, or 8KB (up to 1024KB CHR)',
    exampleGames: ['Castlevania III (JP)', 'Just Breed', 'Uchuu Keibitai SDF'],
  },
  {
    number: 7,
    name: 'AxROM / AOROM',
    shortDescription: 'Rare / single-screen mapper with 32KB PRG bankswitch and 8KB CHR-RAM.',
    prgBanking: '32KB switchable bank ($8000-$FFFF)',
    chrBanking: '8KB CHR-RAM',
    exampleGames: ['Battletoads', 'Marble Madness', 'Cobra Triangle'],
  },
  {
    number: 9,
    name: 'MMC2 (PxROM)',
    shortDescription: 'Nintendo ASIC with hardware tile latch for instantaneous bankswitching.',
    prgBanking: '8KB bankswitching',
    chrBanking: '4KB bankswitching triggered by specific PPU tile reads ($FD/$FE)',
    exampleGames: ['Mike Tyson\'s Punch-Out!!'],
  },
  {
    number: 11,
    name: 'Color Dreams',
    shortDescription: 'Unlicensed high-capacity mapper with PRG and CHR banking in one register.',
    prgBanking: '32KB bankswitchable',
    chrBanking: '8KB bankswitchable (up to 128KB)',
    exampleGames: ['Baby Boomer', 'Captain Comic', 'Robodemons', 'Bible Adventures'],
  },
  {
    number: 69,
    name: 'Sunsoft FME-7',
    shortDescription: 'Sunsoft mapper with cycle-based IRQ and Yamaha AY-3-8910 expanded audio (5B).',
    prgBanking: '8KB bankswitching (up to 512KB)',
    chrBanking: '1KB bankswitching (up to 256KB)',
    exampleGames: ['Gimmick!', 'Batman: Return of the Joker', 'Hebereke'],
  },
];

export function getMapperInfo(mapperNum: number): MapperInfo {
  const found = COMMON_MAPPERS.find((m) => m.number === mapperNum);
  if (found) return found;
  return {
    number: mapperNum,
    name: `Mapper ${mapperNum}`,
    shortDescription: `Discrete or ASIC mapper #${mapperNum}`,
    prgBanking: 'Custom',
    chrBanking: 'Custom',
    exampleGames: ['Custom Homebrew / Hack'],
  };
}

/**
 * Creates a blank, valid 16-byte header with defaults
 */
export function createDefaultHeader(format: 'ines_1_0' | 'nes_2_0' = 'ines_1_0'): NesRomHeader {
  const rawBytes = new Uint8Array(16);
  // NES\x1A signature
  rawBytes[0] = 0x4e; // 'N'
  rawBytes[1] = 0x45; // 'E'
  rawBytes[2] = 0x53; // 'S'
  rawBytes[3] = 0x1a; // MS-DOS EOF

  // Defaults: 32KB PRG (2 * 16KB), 8KB CHR (1 * 8KB), NROM Mapper 0
  rawBytes[4] = 2; // 32KB PRG
  rawBytes[5] = 1; // 8KB CHR
  rawBytes[6] = 0x00; // Horizontal mirroring, Mapper 0
  rawBytes[7] = format === 'nes_2_0' ? 0x08 : 0x00; // NES 2.0 identifier is bit 3 (0x08)
  rawBytes[8] = 0x00;
  rawBytes[9] = 0x00;
  rawBytes[10] = 0x00;
  rawBytes[11] = 0x00;
  rawBytes[12] = 0x00;
  rawBytes[13] = 0x00;
  rawBytes[14] = 0x00;
  rawBytes[15] = 0x00;

  return parseHeader(rawBytes);
}

/**
 * Encodes NesRomHeader object back into the 16-byte binary header
 */
export function buildHeaderBytes(header: NesRomHeader): Uint8Array {
  const bytes = new Uint8Array(16);
  // Signature
  bytes[0] = 0x4e;
  bytes[1] = 0x45;
  bytes[2] = 0x53;
  bytes[3] = 0x1a;

  // PRG & CHR Size LSB
  const prgUnits16k = Math.max(1, Math.floor(header.prgRomSizeKiB / 16));
  const chrUnits8k = Math.floor(header.chrRomSizeKiB / 8);

  bytes[4] = prgUnits16k & 0xff;
  bytes[5] = chrUnits8k & 0xff;

  // Flags 6:
  // Bit 0: Mirroring (0=Horizontal, 1=Vertical)
  // Bit 1: Battery
  // Bit 2: Trainer
  // Bit 3: Four-screen
  // Bits 4-7: Mapper lower nibble
  let f6 = 0;
  if (header.mirroring === 'vertical') f6 |= 0x01;
  if (header.hasBattery) f6 |= 0x02;
  if (header.hasTrainer) f6 |= 0x04;
  if (header.mirroring === 'four_screen' || header.fourScreenVram) f6 |= 0x08;
  f6 |= (header.mapperNumber & 0x0f) << 4;
  bytes[6] = f6;

  // Flags 7:
  // Bit 0: VS Unisystem
  // Bit 1: PlayChoice-10
  // Bits 2-3: NES 2.0 indicator (0x08)
  // Bits 4-7: Mapper upper nibble
  let f7 = 0;
  if (header.vsSystem) f7 |= 0x01;
  if (header.playchoice10) f7 |= 0x02;
  if (header.format === 'nes_2_0') {
    f7 |= 0x08; // Bits 2-3 = 10 binary
  }
  f7 |= header.mapperNumber & 0xf0;
  bytes[7] = f7;

  if (header.format === 'nes_2_0') {
    // Flags 8 (NES 2.0):
    // Bits 0-3: Mapper bits 8-11
    // Bits 4-7: Submapper
    const mapperNibble2 = (header.mapperNumber >> 8) & 0x0f;
    const submapperNibble = (header.submapperNumber & 0x0f) << 4;
    bytes[8] = mapperNibble2 | submapperNibble;

    // Flags 9 (NES 2.0):
    // Bits 0-3: PRG-ROM size MSB
    // Bits 4-7: CHR-ROM size MSB
    const prgMsb = (prgUnits16k >> 8) & 0x0f;
    const chrMsb = (chrUnits8k >> 8) & 0x0f;
    bytes[9] = prgMsb | (chrMsb << 4);

    // Flags 10 (NES 2.0): PRG-RAM sizes
    // Shift counts: size = 64 << count
    bytes[10] = encodeRamShift(header.prgRamSizeKiB, header.prgNvramSizeKiB);

    // Flags 11 (NES 2.0): CHR-RAM sizes
    bytes[11] = encodeRamShift(header.chrRamSizeKiB, header.chrNvramSizeKiB);

    // Flags 12 (NES 2.0): CPU/PPU Timing
    // 0=NTSC, 1=PAL, 2=Multiple, 3=Dendy
    const timingMap: Record<TvSystem, number> = {
      ntsc: 0,
      pal: 1,
      multi: 2,
      dendy: 3,
    };
    bytes[12] = timingMap[header.tvSystem] ?? 0;

    // Flags 13: Console type
    bytes[13] = header.vsSystem ? 1 : 0;

    // Flags 14: Misc ROMs
    bytes[14] = header.miscRoms & 0x03;

    // Flags 15: Default Expansion Device
    bytes[15] = header.expansionDevice & 0x3f;
  } else {
    // iNES 1.0 format
    // Byte 8: PRG-RAM size in 8KB units
    bytes[8] = Math.max(0, Math.floor(header.prgRamSizeKiB / 8));
    // Byte 9: TV system (0 = NTSC, 1 = PAL)
    bytes[9] = header.tvSystem === 'pal' ? 1 : 0;
    // Bytes 10-15: Zeroed in clean iNES
    bytes[10] = 0;
    bytes[11] = 0;
    bytes[12] = 0;
    bytes[13] = 0;
    bytes[14] = 0;
    bytes[15] = 0;
  }

  return bytes;
}

function encodeRamShift(volatileKiB: number, nonVolatileKiB: number): number {
  const vShift = volatileKiB > 0 ? Math.min(15, Math.ceil(Math.log2((volatileKiB * 1024) / 64))) : 0;
  const nvShift = nonVolatileKiB > 0 ? Math.min(15, Math.ceil(Math.log2((nonVolatileKiB * 1024) / 64))) : 0;
  return (vShift & 0x0f) | ((nvShift & 0x0f) << 4);
}

function decodeRamShift(byte: number): { volatileKiB: number; nonVolatileKiB: number } {
  const vShift = byte & 0x0f;
  const nvShift = (byte >> 4) & 0x0f;
  const volatileKiB = vShift > 0 ? (64 << vShift) / 1024 : 0;
  const nonVolatileKiB = nvShift > 0 ? (64 << nvShift) / 1024 : 0;
  return { volatileKiB, nonVolatileKiB };
}

/**
 * Parses a 16-byte raw header array into structured NesRomHeader
 */
export function parseHeader(rawBytes: Uint8Array): NesRomHeader {
  if (rawBytes.length < 16) {
    throw new Error('Header must be at least 16 bytes');
  }

  // Validate identification 'NES\x1A'
  const isNesSignature =
    rawBytes[0] === 0x4e &&
    rawBytes[1] === 0x45 &&
    rawBytes[2] === 0x53 &&
    rawBytes[3] === 0x1a;

  // NES 2.0 test: (Flags 7 & 0x0C) == 0x08
  const isNes20 = (rawBytes[7] & 0x0c) === 0x08;
  const isArchaic = !isNes20 && (rawBytes[12] !== 0 || rawBytes[13] !== 0 || rawBytes[14] !== 0 || rawBytes[15] !== 0);

  const format: 'ines_1_0' | 'nes_2_0' | 'archaic_ines' = isNes20
    ? 'nes_2_0'
    : isArchaic
    ? 'archaic_ines'
    : 'ines_1_0';

  // PRG and CHR sizes
  let prg16k = rawBytes[4];
  let chr8k = rawBytes[5];

  // Mapper
  let mapper = ((rawBytes[6] >> 4) & 0x0f) | (rawBytes[7] & 0xf0);
  let submapper = 0;

  let prgRamSizeKiB = 0;
  let prgNvramSizeKiB = 0;
  let chrRamSizeKiB = 0;
  let chrNvramSizeKiB = 0;
  let tvSystem: TvSystem = 'ntsc';
  let expansionDevice = 0;
  let miscRoms = 0;

  if (isNes20) {
    // Extended mapper nibble
    const mapperHigh = rawBytes[8] & 0x0f;
    mapper |= mapperHigh << 8;
    submapper = (rawBytes[8] >> 4) & 0x0f;

    // Extended PRG/CHR size MSB
    const prgMsb = rawBytes[9] & 0x0f;
    const chrMsb = (rawBytes[9] >> 4) & 0x0f;
    prg16k |= prgMsb << 8;
    chr8k |= chrMsb << 8;

    // RAM
    const prgRam = decodeRamShift(rawBytes[10]);
    prgRamSizeKiB = prgRam.volatileKiB;
    prgNvramSizeKiB = prgRam.nonVolatileKiB;

    const chrRam = decodeRamShift(rawBytes[11]);
    chrRamSizeKiB = chrRam.volatileKiB;
    chrNvramSizeKiB = chrRam.nonVolatileKiB;

    // Timing
    const timingByte = rawBytes[12] & 0x03;
    if (timingByte === 0) tvSystem = 'ntsc';
    else if (timingByte === 1) tvSystem = 'pal';
    else if (timingByte === 2) tvSystem = 'multi';
    else if (timingByte === 3) tvSystem = 'dendy';

    miscRoms = rawBytes[14] & 0x03;
    expansionDevice = rawBytes[15] & 0x3f;
  } else {
    // iNES 1.0
    prgRamSizeKiB = rawBytes[8] * 8;
    tvSystem = (rawBytes[9] & 0x01) === 1 ? 'pal' : 'ntsc';
  }

  // Mirroring
  let mirroring: MirroringType = (rawBytes[6] & 0x01) === 1 ? 'vertical' : 'horizontal';
  if ((rawBytes[6] & 0x08) !== 0) {
    mirroring = 'four_screen';
  }

  const hasBattery = (rawBytes[6] & 0x02) !== 0;
  const hasTrainer = (rawBytes[6] & 0x04) !== 0;
  const fourScreenVram = (rawBytes[6] & 0x08) !== 0;
  const vsSystem = (rawBytes[7] & 0x01) !== 0;
  const playchoice10 = (rawBytes[7] & 0x02) !== 0;

  const mapperInfo = getMapperInfo(mapper);

  return {
    rawBytes: new Uint8Array(rawBytes.slice(0, 16)),
    format,
    prgRomSizeKiB: prg16k * 16,
    chrRomSizeKiB: chr8k * 8,
    prgRamSizeKiB,
    prgNvramSizeKiB,
    chrRamSizeKiB,
    chrNvramSizeKiB,
    mapperNumber: mapper,
    submapperNumber: submapper,
    mapperName: mapperInfo.name,
    mirroring,
    hasBattery,
    hasTrainer,
    fourScreenVram,
    tvSystem,
    vsSystem,
    playchoice10,
    expansionDevice,
    miscRoms,
  };
}

/**
 * Detailed description for each of the 16 bytes in the NES header
 */
export interface ByteInspectorInfo {
  offset: number;
  hexValue: string;
  name: string;
  shortDesc: string;
  longExplanation: string;
  bits: { bit: number; value: number; label: string }[];
}

export function inspectByte(header: NesRomHeader, offset: number): ByteInspectorInfo {
  const byteVal = header.rawBytes[offset] || 0;
  const hexVal = `$${byteVal.toString(16).padStart(2, '0').toUpperCase()}`;

  const bits: { bit: number; value: number; label: string }[] = [];
  for (let b = 7; b >= 0; b--) {
    bits.push({
      bit: b,
      value: (byteVal >> b) & 1,
      label: `Bit ${b}`,
    });
  }

  switch (offset) {
    case 0:
    case 1:
    case 2:
    case 3: {
      const chars = ['N', 'E', 'S', '<EOF>'];
      const ascii = ['0x4E ("N")', '0x45 ("E")', '0x53 ("S")', '0x1A (MS-DOS Sub / EOF)'];
      return {
        offset,
        hexValue: hexVal,
        name: `Magic Signature [${offset}]`,
        shortDesc: `Identification character '${chars[offset]}'`,
        longExplanation: `Bytes 0-3 must contain the exact 4-byte sequence 'NES\\x1A' (0x4E, 0x45, 0x53, 0x1A). This confirms to emulators and hardware loaders that this is an authentic Nintendo Entertainment System cartridge image.`,
        bits,
      };
    }
    case 4:
      return {
        offset: 4,
        hexValue: hexVal,
        name: 'PRG-ROM Size LSB',
        shortDesc: `${byteVal} × 16 KiB = ${header.prgRomSizeKiB} KiB PRG`,
        longExplanation: `Size of Program ROM in 16,384 byte (16 KiB) units. For standard NROM-128 this is 1 (16 KiB); for NROM-256 or MMC1 this is often 2 (32 KiB) or more. In NES 2.0, Byte 9 provides the upper 4 bits for ROMs up to 64 MiB.`,
        bits,
      };
    case 5:
      return {
        offset: 5,
        hexValue: hexVal,
        name: 'CHR-ROM Size LSB',
        shortDesc: byteVal === 0 ? '0 (Uses CHR-RAM on board)' : `${byteVal} × 8 KiB = ${header.chrRomSizeKiB} KiB CHR`,
        longExplanation: `Size of Character Graphics ROM in 8,192 byte (8 KiB) units. A value of 0 indicates the cartridge uses CHR-RAM, where tiles are loaded into VRAM by the 6502 CPU (e.g. UNROM, MMC1 CHR-RAM). Value $\\ge 1$ indicates dedicated CHR-ROM chips (e.g. NROM, MMC3).`,
        bits,
      };
    case 6: {
      const bitLabels = [
        `Bit 0: Mirroring = ${header.mirroring === 'vertical' ? '1 (Vertical)' : '0 (Horizontal)'}`,
        `Bit 1: Battery RAM = ${header.hasBattery ? '1 (Present at $6000-$7FFF)' : '0 (None)'}`,
        `Bit 2: Trainer = ${header.hasTrainer ? '1 (512-byte Trainer at $7000)' : '0 (None)'}`,
        `Bit 3: Four-screen VRAM = ${header.fourScreenVram ? '1 (Enabled)' : '0 (Standard CIRAM)'}`,
        `Bit 4: Mapper D0 = ${(byteVal >> 4) & 1}`,
        `Bit 5: Mapper D1 = ${(byteVal >> 5) & 1}`,
        `Bit 6: Mapper D2 = ${(byteVal >> 6) & 1}`,
        `Bit 7: Mapper D3 = ${(byteVal >> 7) & 1}`,
      ];
      return {
        offset: 6,
        hexValue: hexVal,
        name: 'Flags 6 (Mirroring & Mapper Low)',
        shortDesc: `Mapper nibble D0..D3 = ${(byteVal >> 4) & 0x0f}, Mirroring = ${header.mirroring}`,
        longExplanation: `Flags 6 controls PPU nametable mirroring, presence of battery-backed save RAM at $6000-$7FFF, 512-byte trainer, and the low 4 bits of the mapper number.`,
        bits: bits.map((b, i) => ({ ...b, label: bitLabels[7 - i] })),
      };
    }
    case 7: {
      const is20 = (byteVal & 0x0c) === 0x08;
      const bitLabels = [
        `Bit 0: VS Unisystem = ${(byteVal & 1) ? '1' : '0'}`,
        `Bit 1: PlayChoice-10 = ${(byteVal & 2) ? '1' : '0'}`,
        `Bit 2: NES 2.0 Identifier (D0) = ${(byteVal >> 2) & 1}`,
        `Bit 3: NES 2.0 Identifier (D1) = ${(byteVal >> 3) & 1} ${is20 ? '(NES 2.0 ACTIVE!)' : ''}`,
        `Bit 4: Mapper D4 = ${(byteVal >> 4) & 1}`,
        `Bit 5: Mapper D5 = ${(byteVal >> 5) & 1}`,
        `Bit 6: Mapper D6 = ${(byteVal >> 6) & 1}`,
        `Bit 7: Mapper D7 = ${(byteVal >> 7) & 1}`,
      ];
      return {
        offset: 7,
        hexValue: hexVal,
        name: 'Flags 7 (NES 2.0 & Mapper High)',
        shortDesc: `Mapper nibble D4..D7 = ${(byteVal >> 4) & 0x0f}, Format = ${header.format}`,
        longExplanation: `Flags 7 contains bits 4..7 of the mapper number. Most importantly, Bits 2 and 3 indicate the header format: if Bits 2-3 are '10' binary (equal to 2, or 0x08 masked with 0x0C), the header is in modern NES 2.0 format!`,
        bits: bits.map((b, i) => ({ ...b, label: bitLabels[7 - i] })),
      };
    }
    case 8:
      return {
        offset: 8,
        hexValue: hexVal,
        name: header.format === 'nes_2_0' ? 'Flags 8 (Mapper Upper & Submapper)' : 'Flags 8 (PRG-RAM Size in iNES 1.0)',
        shortDesc: header.format === 'nes_2_0' ? `Submapper: ${(byteVal >> 4) & 0x0f}, Mapper D8..D11: ${byteVal & 0x0f}` : `${byteVal * 8} KiB PRG-RAM`,
        longExplanation: header.format === 'nes_2_0'
          ? `In NES 2.0, Byte 8 contains bits 8..11 of the 12-bit mapper number (lower nibble) and the 4-bit submapper number (upper nibble, bits 4..7) used to resolve board wiring differences.`
          : `In iNES 1.0, Byte 8 specifies PRG-RAM size in 8 KiB units (a value of 0 typically assumes 8 KiB for backwards compatibility).`,
        bits,
      };
    case 9:
      return {
        offset: 9,
        hexValue: hexVal,
        name: header.format === 'nes_2_0' ? 'Flags 9 (PRG / CHR Size MSB)' : 'Flags 9 (TV System in iNES 1.0)',
        shortDesc: header.format === 'nes_2_0' ? `PRG MSB: ${byteVal & 0x0f}, CHR MSB: ${(byteVal >> 4) & 0x0f}` : `TV System: ${(byteVal & 1) ? 'PAL' : 'NTSC'}`,
        longExplanation: header.format === 'nes_2_0'
          ? `In NES 2.0, Byte 9 holds the high 4 bits of PRG-ROM (bits 0..3) and CHR-ROM (bits 4..7), extending the maximum addressable ROM size to 64 MiB.`
          : `In iNES 1.0, bit 0 indicates TV System (0 = NTSC, 1 = PAL). Bits 1-7 are reserved and must be 0.`,
        bits,
      };
    case 10:
      return {
        offset: 10,
        hexValue: hexVal,
        name: header.format === 'nes_2_0' ? 'Flags 10 (PRG-RAM / NVRAM Size)' : 'Flags 10 (Unofficial PRG-RAM / TV)',
        shortDesc: header.format === 'nes_2_0' ? `${header.prgRamSizeKiB} KiB Volatile RAM, ${header.prgNvramSizeKiB} KiB Battery NVRAM` : 'iNES 1.0 Reserved ($00)',
        longExplanation: header.format === 'nes_2_0'
          ? `In NES 2.0, Byte 10 specifies PRG-RAM sizes: lower nibble is volatile RAM shift count (64 << N bytes), upper nibble is battery-backed non-volatile RAM shift count.`
          : `In iNES 1.0, Byte 10 was defined unofficially by some emulators for TV systems and is recommended to be 0x00 for maximum compatibility.`,
        bits,
      };
    case 11:
      return {
        offset: 11,
        hexValue: hexVal,
        name: header.format === 'nes_2_0' ? 'Flags 11 (CHR-RAM / NVRAM Size)' : 'Byte 11 (Padding / DiskDude Check)',
        shortDesc: header.format === 'nes_2_0' ? `${header.chrRamSizeKiB} KiB Volatile CHR-RAM` : 'Reserved Padding ($00)',
        longExplanation: header.format === 'nes_2_0'
          ? `In NES 2.0, Byte 11 encodes CHR-RAM size in shift counts (64 << N bytes): lower nibble for volatile CHR-RAM, upper nibble for battery-backed CHR-NVRAM.`
          : `In standard clean iNES, bytes 11..15 must be 0x00. In bad dumps from the 1990s, this area often contained 'DiskDude' corruptions which broke modern emulators.`,
        bits,
      };
    case 12:
      return {
        offset: 12,
        hexValue: hexVal,
        name: header.format === 'nes_2_0' ? 'Flags 12 (CPU / PPU Timing)' : 'Byte 12 (Padding)',
        shortDesc: header.format === 'nes_2_0' ? `Timing: ${header.tvSystem.toUpperCase()}` : 'Reserved ($00)',
        longExplanation: `In NES 2.0, Byte 12 defines hardware timing: 0 = RP2A03 NTSC (North America/Japan 60Hz), 1 = RP2A07 PAL (Europe/Australia 50Hz), 2 = Multi-region, 3 = Dendy (PAL clone with NTSC CPU divider).`,
        bits,
      };
    case 13:
      return {
        offset: 13,
        hexValue: hexVal,
        name: header.format === 'nes_2_0' ? 'Flags 13 (Extended Console Type)' : 'Byte 13 (Padding)',
        shortDesc: header.format === 'nes_2_0' ? (header.vsSystem ? 'VS Unisystem Arcade' : 'Standard NES / Famicom') : 'Reserved ($00)',
        longExplanation: `In NES 2.0, Byte 13 specifies arcade hardware variants such as VS. Unisystem PPU types, PlayChoice-10, Famicom Network System, or VT01/VT02 enhanced clones.`,
        bits,
      };
    case 14:
      return {
        offset: 14,
        hexValue: hexVal,
        name: header.format === 'nes_2_0' ? 'Flags 14 (Miscellaneous ROMs)' : 'Byte 14 (Padding)',
        shortDesc: header.format === 'nes_2_0' ? `${header.miscRoms} Misc ROM chips` : 'Reserved ($00)',
        longExplanation: `In NES 2.0, Byte 14 indicates count of additional ROM chips present on board (such as microcontroller speech chips, PlayChoice hint screens, or coprocessors).`,
        bits,
      };
    case 15:
      return {
        offset: 15,
        hexValue: hexVal,
        name: header.format === 'nes_2_0' ? 'Flags 15 (Default Expansion Device)' : 'Byte 15 (Padding)',
        shortDesc: header.format === 'nes_2_0' ? `Device #$${header.expansionDevice.toString(16)} (0 = Standard Controllers)` : 'Reserved ($00)',
        longExplanation: `In NES 2.0, Byte 15 specifies the default expansion device to connect (e.g. 0x00 = Standard 2-button controllers, 0x01 = Four Score, 0x02 = NES Zapper, 0x03 = Arkanoid Vaus paddle, 0x05 = Family BASIC Keyboard, etc.).`,
        bits,
      };
    default:
      return {
        offset,
        hexValue: hexVal,
        name: `Byte ${offset}`,
        shortDesc: 'Unknown header byte',
        longExplanation: 'Standard iNES header is exactly 16 bytes.',
        bits,
      };
  }
}

/**
 * Generates ready-to-use 6502 Assembly code for the header (compatible with ca65 / NESASM / ASM6)
 */
export function generateAsmHeader(header: NesRomHeader): string {
  const bytes = header.rawBytes;
  const hex = (b: number) => `$${b.toString(16).padStart(2, '0').toUpperCase()}`;

  const is20 = header.format === 'nes_2_0';
  const prg16k = header.prgRomSizeKiB / 16;
  const chr8k = header.chrRomSizeKiB / 8;

  return `; ==============================================================================
; NES ROM Header (${is20 ? 'NES 2.0 Specification' : 'iNES 1.0 Specification'})
; Generated by NES ROM & Video Pipeline Studio
; ==============================================================================

.segment "HEADER"
    .byte "NES", $1A             ; Identification: 'NES\\x1A'
    .byte ${hex(bytes[4])}                    ; PRG-ROM: ${prg16k} x 16KiB (${header.prgRomSizeKiB} KiB)
    .byte ${hex(bytes[5])}                    ; CHR-ROM: ${chr8k} x 8KiB (${header.chrRomSizeKiB} KiB)
    .byte ${hex(bytes[6])}                    ; Flags 6: Mapper ${header.mapperNumber & 0x0F}, Mirroring=${header.mirroring}
    .byte ${hex(bytes[7])}                    ; Flags 7: Mapper ${header.mapperNumber & 0xF0}, Format=${header.format}
    .byte ${hex(bytes[8])}                    ; Flags 8: ${is20 ? `Mapper D8..D11 / Submapper ${header.submapperNumber}` : 'PRG-RAM size'}
    .byte ${hex(bytes[9])}                    ; Flags 9: ${is20 ? 'PRG/CHR MSB' : `TV System: ${header.tvSystem}`}
    .byte ${hex(bytes[10])}                    ; Flags 10: ${is20 ? `PRG-RAM: ${header.prgRamSizeKiB}K / NVRAM: ${header.prgNvramSizeKiB}K` : 'Reserved'}
    .byte ${hex(bytes[11])}                    ; Flags 11: ${is20 ? `CHR-RAM: ${header.chrRamSizeKiB}K` : 'Reserved'}
    .byte ${hex(bytes[12])}                    ; Flags 12: ${is20 ? `Timing: ${header.tvSystem.toUpperCase()}` : 'Reserved'}
    .byte ${hex(bytes[13])}                    ; Flags 13: ${is20 ? 'Console type' : 'Reserved'}
    .byte ${hex(bytes[14])}                    ; Flags 14: ${is20 ? 'Misc ROMs' : 'Reserved'}
    .byte ${hex(bytes[15])}                    ; Flags 15: ${is20 ? 'Default Expansion Device' : 'Reserved'}
`;
}

/**
 * Generates C header file code
 */
export function generateCHeader(header: NesRomHeader): string {
  const bytes = header.rawBytes;
  const hex = (b: number) => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`;

  return `/**
 * @file nes_rom_header.h
 * NES Cartridge Header (${header.format === 'nes_2_0' ? 'NES 2.0' : 'iNES 1.0'})
 * Mapper: #${header.mapperNumber} (${header.mapperName})
 * PRG: ${header.prgRomSizeKiB} KB, CHR: ${header.chrRomSizeKiB} KB
 */

#ifndef NES_ROM_HEADER_H
#define NES_ROM_HEADER_H

#include <stdint.h>

#define NES_HEADER_SIZE 16
#define NES_MAPPER_NUM  ${header.mapperNumber}
#define NES_PRG_KIB     ${header.prgRomSizeKiB}
#define NES_CHR_KIB     ${header.chrRomSizeKiB}

static const uint8_t nes_cart_header[NES_HEADER_SIZE] = {
    ${hex(bytes[0])}, ${hex(bytes[1])}, ${hex(bytes[2])}, ${hex(bytes[3])}, // 'NES\\x1A'
    ${hex(bytes[4])}, // PRG-ROM (16KB units)
    ${hex(bytes[5])}, // CHR-ROM (8KB units)
    ${hex(bytes[6])}, // Flags 6
    ${hex(bytes[7])}, // Flags 7
    ${hex(bytes[8])}, // Flags 8
    ${hex(bytes[9])}, // Flags 9
    ${hex(bytes[10])}, // Flags 10
    ${hex(bytes[11])}, // Flags 11
    ${hex(bytes[12])}, // Flags 12
    ${hex(bytes[13])}, // Flags 13
    ${hex(bytes[14])}, // Flags 14
    ${hex(bytes[15])}  // Flags 15
};

#endif // NES_ROM_HEADER_H
`;
}
