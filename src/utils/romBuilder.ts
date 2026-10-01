/**
 * Assembles fully compliant, playable NES cartridge ROM (.nes) files
 * Generates valid 6502 machine code PRG-ROM with reset, NMI, and IRQ vectors
 */

import { NesRomHeader } from '../types/nes';
import { buildHeaderBytes } from './nesHeader';

export interface RomBuildOptions {
  header: NesRomHeader;
  chrBytes: Uint8Array;
  palette: number[]; // 4 NES colors
  nametable?: number[]; // 960 tile indices
}

/**
 * Builds a complete .nes binary file with header, 6502 PRG-ROM, and CHR-ROM
 */
export function buildNesRom(options: RomBuildOptions): Uint8Array {
  const { header, chrBytes, palette, nametable } = options;

  // 1. Build 16-byte Header
  const headerBytes = buildHeaderBytes(header);

  // 2. Trainer (512 bytes, if enabled)
  const trainerBytes = header.hasTrainer ? new Uint8Array(512) : new Uint8Array(0);

  // 3. PRG-ROM: 16 KiB or 32 KiB
  const prgSizeBytes = Math.max(16384, header.prgRomSizeKiB * 1024);
  const prgRom = new Uint8Array(prgSizeBytes);

  // Assemble real 6502 executable machine code into PRG-ROM
  assemblePrgEngine(prgRom, palette, nametable);

  // 4. CHR-ROM: Pad to 8 KiB units
  const chrUnits = Math.max(1, Math.ceil(chrBytes.length / 8192));
  const finalChrSize = header.chrRomSizeKiB > 0 ? header.chrRomSizeKiB * 1024 : chrUnits * 8192;
  const paddedChr = new Uint8Array(finalChrSize);
  paddedChr.set(chrBytes.slice(0, finalChrSize));

  // Combine into single cartridge binary
  const totalLength = headerBytes.length + trainerBytes.length + prgRom.length + (header.chrRomSizeKiB > 0 ? paddedChr.length : 0);
  const nesRom = new Uint8Array(totalLength);

  let offset = 0;
  nesRom.set(headerBytes, offset);
  offset += headerBytes.length;

  if (trainerBytes.length > 0) {
    nesRom.set(trainerBytes, offset);
    offset += trainerBytes.length;
  }

  nesRom.set(prgRom, offset);
  offset += prgRom.length;

  if (header.chrRomSizeKiB > 0) {
    nesRom.set(paddedChr, offset);
  }

  return nesRom;
}

/**
 * 6502 Machine Code Assembler for NES Video Display Engine
 * Maps to $8000-$FFFF (or $C000-$FFFF for 16KB)
 */
function assemblePrgEngine(prgRom: Uint8Array, palette: number[], nametable?: number[]) {
  // Clear PRG to NOP ($EA)
  prgRom.fill(0xea);

  // If 16KB PRG, base address is $C000. If 32KB+, base is $8000.
  const is16Kb = prgRom.length === 16384;
  const baseAddr = is16Kb ? 0xc000 : 0x8000;

  let pc = 0; // Relative to start of PRG ROM

  // Reset entry point: $baseAddr
  // SEI ($78)
  prgRom[pc++] = 0x78;
  // CLD ($D8)
  prgRom[pc++] = 0xd8;
  // LDX #$FF ($A2 $FF)
  prgRom[pc++] = 0xa2;
  prgRom[pc++] = 0xff;
  // TXS ($9A)
  prgRom[pc++] = 0x9a;
  // INX ($E8) -> X = 0
  prgRom[pc++] = 0xe8;
  // STX $2000 ($8E $00 $20)
  prgRom[pc++] = 0x8e;
  prgRom[pc++] = 0x00;
  prgRom[pc++] = 0x20;
  // STX $2001 ($8E $01 $20)
  prgRom[pc++] = 0x8e;
  prgRom[pc++] = 0x01;
  prgRom[pc++] = 0x20;
  // STX $4010 ($8E $10 $40)
  prgRom[pc++] = 0x8e;
  prgRom[pc++] = 0x10;
  prgRom[pc++] = 0x40;

  // VBlank wait 1:
  // vblank1: BIT $2002 ($2C $02 $20)
  const vblank1Pc = pc;
  prgRom[pc++] = 0x2c;
  prgRom[pc++] = 0x02;
  prgRom[pc++] = 0x20;
  // BPL vblank1 ($10, offset)
  prgRom[pc++] = 0x10;
  prgRom[pc++] = (vblank1Pc - (pc + 1)) & 0xff;

  // Clear RAM $0000-$07FF
  // clrmem:
  const clrMemPc = pc;
  // LDA #$00 ($A9 $00)
  prgRom[pc++] = 0xa9;
  prgRom[pc++] = 0x00;
  // STA $0000, X ($9D $00 $00)
  prgRom[pc++] = 0x9d;
  prgRom[pc++] = 0x00;
  prgRom[pc++] = 0x00;
  // STA $0100, X ($9D $00 $01)
  prgRom[pc++] = 0x9d;
  prgRom[pc++] = 0x00;
  prgRom[pc++] = 0x01;
  // STA $0200, X ($9D $00 $02)
  prgRom[pc++] = 0x9d;
  prgRom[pc++] = 0x00;
  prgRom[pc++] = 0x02;
  // STA $0300, X ($9D $00 $03)
  prgRom[pc++] = 0x9d;
  prgRom[pc++] = 0x00;
  prgRom[pc++] = 0x03;
  // STA $0400, X ($9D $00 $04)
  prgRom[pc++] = 0x9d;
  prgRom[pc++] = 0x00;
  prgRom[pc++] = 0x04;
  // STA $0500, X ($9D $00 $05)
  prgRom[pc++] = 0x9d;
  prgRom[pc++] = 0x00;
  prgRom[pc++] = 0x05;
  // STA $0600, X ($9D $00 $06)
  prgRom[pc++] = 0x9d;
  prgRom[pc++] = 0x00;
  prgRom[pc++] = 0x06;
  // STA $0700, X ($9D $00 $07)
  prgRom[pc++] = 0x9d;
  prgRom[pc++] = 0x00;
  prgRom[pc++] = 0x07;
  // INX ($E8)
  prgRom[pc++] = 0xe8;
  // BNE clrmem ($D0 offset)
  prgRom[pc++] = 0xd0;
  prgRom[pc++] = (clrMemPc - (pc + 1)) & 0xff;

  // VBlank wait 2:
  const vblank2Pc = pc;
  prgRom[pc++] = 0x2c;
  prgRom[pc++] = 0x02;
  prgRom[pc++] = 0x20;
  prgRom[pc++] = 0x10;
  prgRom[pc++] = (vblank2Pc - (pc + 1)) & 0xff;

  // Read $2002 to reset PPUADDR latch
  // BIT $2002 ($2C $02 $20)
  prgRom[pc++] = 0x2c;
  prgRom[pc++] = 0x02;
  prgRom[pc++] = 0x20;

  // Write Palette to $3F00
  // LDA #$3F ($A9 $3F)
  prgRom[pc++] = 0xa9;
  prgRom[pc++] = 0x3f;
  // STA $2006 ($8D $06 $20)
  prgRom[pc++] = 0x8d;
  prgRom[pc++] = 0x06;
  prgRom[pc++] = 0x20;
  // LDA #$00 ($A9 $00)
  prgRom[pc++] = 0xa9;
  prgRom[pc++] = 0x00;
  // STA $2006 ($8D $06 $20)
  prgRom[pc++] = 0x8d;
  prgRom[pc++] = 0x06;
  prgRom[pc++] = 0x20;

  // Load Palette entries (32 bytes)
  const paletteTableOffset = 0x0180;
  // LDX #$00 ($A2 $00)
  prgRom[pc++] = 0xa2;
  prgRom[pc++] = 0x00;
  const loadPalPc = pc;
  // LDA $paletteTable, X ($BD addr_lo addr_hi)
  const palAddr = baseAddr + paletteTableOffset;
  prgRom[pc++] = 0xbd;
  prgRom[pc++] = palAddr & 0xff;
  prgRom[pc++] = (palAddr >> 8) & 0xff;
  // STA $2007 ($8D $07 $20)
  prgRom[pc++] = 0x8d;
  prgRom[pc++] = 0x07;
  prgRom[pc++] = 0x20;
  // INX ($E8)
  prgRom[pc++] = 0xe8;
  // CPX #$20 ($E0 $20)
  prgRom[pc++] = 0xe0;
  prgRom[pc++] = 0x20;
  // BNE loadpal ($D0 offset)
  prgRom[pc++] = 0xd0;
  prgRom[pc++] = (loadPalPc - (pc + 1)) & 0xff;

  // Write Nametable 0 at $2000
  // LDA #$20 ($A9 $20)
  prgRom[pc++] = 0xa9;
  prgRom[pc++] = 0x20;
  // STA $2006 ($8D $06 $20)
  prgRom[pc++] = 0x8d;
  prgRom[pc++] = 0x06;
  prgRom[pc++] = 0x20;
  // LDA #$00 ($A9 $00)
  prgRom[pc++] = 0xa9;
  prgRom[pc++] = 0x00;
  // STA $2006 ($8D $06 $20)
  prgRom[pc++] = 0x8d;
  prgRom[pc++] = 0x06;
  prgRom[pc++] = 0x20;

  // Write 960 tile bytes
  // If nametable provided, store it starting at $0200 in PRG ROM
  const ntOffset = 0x0200;
  const ntAddr = baseAddr + ntOffset;

  // Loop 4 pages of 256 bytes = 1024 bytes (covers 960 tiles + 64 attribute bytes)
  for (let page = 0; page < 4; page++) {
    // LDX #$00 ($A2 $00)
    prgRom[pc++] = 0xa2;
    prgRom[pc++] = 0x00;
    const ntLoopPc = pc;
    // LDA $ntAddr + page*256, X ($BD lo hi)
    const pageAddr = ntAddr + page * 256;
    prgRom[pc++] = 0xbd;
    prgRom[pc++] = pageAddr & 0xff;
    prgRom[pc++] = (pageAddr >> 8) & 0xff;
    // STA $2007 ($8D $07 $20)
    prgRom[pc++] = 0x8d;
    prgRom[pc++] = 0x07;
    prgRom[pc++] = 0x20;
    // INX ($E8)
    prgRom[pc++] = 0xe8;
    // BNE ntLoopPc ($D0 offset)
    prgRom[pc++] = 0xd0;
    prgRom[pc++] = (ntLoopPc - (pc + 1)) & 0xff;
  }

  // Reset scroll
  // LDA #$00 ($A9 $00)
  prgRom[pc++] = 0xa9;
  prgRom[pc++] = 0x00;
  // STA $2005 ($8D $05 $20) - X
  prgRom[pc++] = 0x8d;
  prgRom[pc++] = 0x05;
  prgRom[pc++] = 0x20;
  // STA $2005 ($8D $05 $20) - Y
  prgRom[pc++] = 0x8d;
  prgRom[pc++] = 0x05;
  prgRom[pc++] = 0x20;

  // Enable Rendering & NMI
  // LDA #$90 ($A9 $90) - NMI on, background at $0000
  prgRom[pc++] = 0xa9;
  prgRom[pc++] = 0x90;
  // STA $2000 ($8D $00 $20)
  prgRom[pc++] = 0x8d;
  prgRom[pc++] = 0x00;
  prgRom[pc++] = 0x20;

  // LDA #$1E ($A9 $1E) - Enable sprites & background, show left 8px
  prgRom[pc++] = 0xa9;
  prgRom[pc++] = 0x1e;
  // STA $2001 ($8D $01 $20)
  prgRom[pc++] = 0x8d;
  prgRom[pc++] = 0x01;
  prgRom[pc++] = 0x20;

  // Infinite main loop
  const loopAddr = baseAddr + pc;
  prgRom[pc++] = 0x4c; // JMP loop
  prgRom[pc++] = loopAddr & 0xff;
  prgRom[pc++] = (loopAddr >> 8) & 0xff;

  // NMI Handler (reset scroll to 0, 0 on each frame)
  const nmiOffset = 0x0150;
  const nmiAddr = baseAddr + nmiOffset;
  let npc = nmiOffset;
  // LDA #$00
  prgRom[npc++] = 0xa9;
  prgRom[npc++] = 0x00;
  // STA $2005
  prgRom[npc++] = 0x8d;
  prgRom[npc++] = 0x05;
  prgRom[npc++] = 0x20;
  // STA $2005
  prgRom[npc++] = 0x8d;
  prgRom[npc++] = 0x05;
  prgRom[npc++] = 0x20;
  // RTI ($40)
  prgRom[npc++] = 0x40;

  // IRQ Handler (RTI)
  const irqOffset = 0x0160;
  const irqAddr = baseAddr + irqOffset;
  prgRom[irqOffset] = 0x40; // RTI

  // Populate Palette Table (32 bytes at paletteTableOffset)
  // Background sub-palette 0, 1, 2, 3 + Sprite sub-palette 0, 1, 2, 3
  const palData = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    palData[i * 4 + 0] = palette[0] & 0x3f;
    palData[i * 4 + 1] = palette[1] & 0x3f;
    palData[i * 4 + 2] = palette[2] & 0x3f;
    palData[i * 4 + 3] = palette[3] & 0x3f;
  }
  prgRom.set(palData, paletteTableOffset);

  // Populate Nametable Table (960 tile bytes + 64 attribute bytes)
  if (nametable && nametable.length >= 960) {
    const ntData = new Uint8Array(1024);
    for (let i = 0; i < 960; i++) {
      ntData[i] = nametable[i] & 0xff;
    }
    // Attribute table: all sub-palette 0
    ntData.fill(0x00, 960, 1024);
    prgRom.set(ntData, ntOffset);
  } else {
    // Sequential default tiles
    const ntData = new Uint8Array(1024);
    for (let i = 0; i < 960; i++) {
      ntData[i] = i % 256;
    }
    prgRom.set(ntData, ntOffset);
  }

  // 6502 Interrupt Vectors at end of PRG ROM:
  // $FFFA-$FFFB: NMI Vector
  // $FFFC-$FFFD: RESET Vector
  // $FFFE-$FFFF: IRQ/BRK Vector
  const vectorOffset = prgRom.length - 6;
  // NMI Vector ($FFFA)
  prgRom[vectorOffset + 0] = nmiAddr & 0xff;
  prgRom[vectorOffset + 1] = (nmiAddr >> 8) & 0xff;
  // Reset Vector ($FFFC) -> baseAddr (entry point)
  prgRom[vectorOffset + 2] = baseAddr & 0xff;
  prgRom[vectorOffset + 3] = (baseAddr >> 8) & 0xff;
  // IRQ Vector ($FFFE)
  prgRom[vectorOffset + 4] = irqAddr & 0xff;
  prgRom[vectorOffset + 5] = (irqAddr >> 8) & 0xff;
}

/**
 * Initiates browser download of binary data
 */
export function downloadBlob(data: Uint8Array, filename: string, mimeType: string = 'application/octet-stream') {
  const blob = new Blob([data as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Initiates browser download of text data
 */
export function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
