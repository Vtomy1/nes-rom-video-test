import React, { useState } from 'react';
import { NesRomHeader } from '../types/nes';
import {
  COMMON_MAPPERS,
  inspectByte,
  generateAsmHeader,
  generateCHeader,
  buildHeaderBytes,
  parseHeader,
} from '../utils/nesHeader';
import { Copy, Check, Info, FileCode, Cpu, ShieldCheck } from 'lucide-react';

interface HeaderInspectorProps {
  header: NesRomHeader;
  onUpdateHeader: (newHeader: NesRomHeader) => void;
  calculatedChrSizeKiB?: number;
}

export const HeaderInspector: React.FC<HeaderInspectorProps> = ({
  header,
  onUpdateHeader,
  calculatedChrSizeKiB,
}) => {
  const [selectedByteOffset, setSelectedByteOffset] = useState<number>(6); // Start on Flags 6 (common interest)
  const [viewCodeFormat, setViewCodeFormat] = useState<'asm' | 'c' | 'hex'>('asm');
  const [copied, setCopied] = useState<boolean>(false);

  const byteInfo = inspectByte(header, selectedByteOffset);

  const handleCopyCode = () => {
    let text = '';
    if (viewCodeFormat === 'asm') {
      text = generateAsmHeader(header);
    } else if (viewCodeFormat === 'c') {
      text = generateCHeader(header);
    } else {
      text = Array.from(header.rawBytes)
        .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
        .join(' ');
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateHeaderProperty = (partial: Partial<NesRomHeader>) => {
    const updated = { ...header, ...partial };
    // Rebuild raw bytes and re-parse to ensure consistency
    const raw = buildHeaderBytes(updated);
    const parsed = parseHeader(raw);
    onUpdateHeader(parsed);
  };

  const handleBitToggle = (bitPosition: number) => {
    const newBytes = new Uint8Array(header.rawBytes);
    const mask = 1 << bitPosition;
    newBytes[selectedByteOffset] ^= mask;

    // If changing byte 0-3, keep 'NES\x1A' signature valid
    if (selectedByteOffset < 4) return;

    try {
      const parsed = parseHeader(newBytes);
      onUpdateHeader(parsed);
    } catch {
      // Invalid state prevented
    }
  };

  const getByteCategoryColor = (offset: number) => {
    if (offset < 4) return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
    if (offset === 4) return 'border-sky-500/40 bg-sky-500/10 text-sky-300';
    if (offset === 5) return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
    if (offset === 6 || offset === 7) return 'border-violet-500/40 bg-violet-500/10 text-violet-300';
    if (offset === 8 || offset === 9) return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
    return 'border-neutral-700 bg-neutral-800/40 text-neutral-300';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Overview & Format Switch */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-100">16-Byte ROM Header Architect</h2>
            <span className="text-xs font-mono text-neutral-400">·</span>
            <span className="text-xs font-mono text-amber-400">
              {header.format === 'nes_2_0' ? 'NES 2.0 (Modern)' : 'iNES 1.0 (Standard)'}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400 max-w-2xl">
            Configure PPU nametable mirroring, mapper hardware bankswitching, PRG/CHR ROM geometry,
            and timing flags required by NES emulators and flash cartridges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {calculatedChrSizeKiB !== undefined && calculatedChrSizeKiB !== header.chrRomSizeKiB && (
            <button
              onClick={() => updateHeaderProperty({ chrRomSizeKiB: calculatedChrSizeKiB })}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Sync CHR ({calculatedChrSizeKiB} KB from video)</span>
            </button>
          )}

          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-950 p-1">
            <button
              onClick={() => updateHeaderProperty({ format: 'ines_1_0' })}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                header.format === 'ines_1_0'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              iNES 1.0
            </button>
            <button
              onClick={() => updateHeaderProperty({ format: 'nes_2_0' })}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                header.format === 'nes_2_0'
                  ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              NES 2.0
            </button>
          </div>
        </div>
      </div>

      {/* 16-Byte Hex Grid */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Raw 16-Byte Cartridge Header Matrix ($00 – $0F)
          </span>
          <span className="text-xs text-neutral-500">
            Click any byte block to inspect bits & specification
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-2">
          {Array.from({ length: 16 }).map((_, offset) => {
            const byteVal = header.rawBytes[offset] || 0;
            const hex = `$${byteVal.toString(16).padStart(2, '0').toUpperCase()}`;
            const isSelected = selectedByteOffset === offset;
            const categoryClass = getByteCategoryColor(offset);

            return (
              <button
                key={offset}
                onClick={() => setSelectedByteOffset(offset)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
                  isSelected
                    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-950 scale-105 z-10'
                    : 'hover:border-neutral-500'
                } ${categoryClass}`}
              >
                <span className="text-[10px] font-mono text-neutral-400">+{offset}</span>
                <span className="text-sm font-mono font-bold">{hex}</span>
                <span className="text-[9px] font-mono opacity-70 truncate max-w-full">
                  {offset < 4 ? 'SIGN' : offset === 4 ? 'PRG' : offset === 5 ? 'CHR' : offset <= 7 ? 'FLAG' : 'EXT'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Column Workspace: Left = Selected Byte Bit Microscope, Right = Hardware Parameters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Byte Deep-Dive Microscope (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-800 text-amber-300 font-semibold">
                  Byte [{byteInfo.offset}]
                </span>
                <h3 className="text-sm font-semibold text-neutral-100">{byteInfo.name}</h3>
              </div>
              <p className="mt-1 text-xs text-neutral-400">{byteInfo.shortDesc}</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-mono font-bold text-amber-400">{byteInfo.hexValue}</span>
              <div className="text-[10px] font-mono text-neutral-500">
                Dec: {header.rawBytes[selectedByteOffset]}
              </div>
            </div>
          </div>

          {/* Bit Toggles (7 to 0) */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-neutral-300">Bitfield Dissection (D7 → D0)</span>
            <div className="space-y-1.5">
              {byteInfo.bits.map((b) => (
                <div
                  key={b.bit}
                  onClick={() => selectedByteOffset >= 4 && handleBitToggle(b.bit)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-mono transition-all ${
                    selectedByteOffset < 4
                      ? 'border-neutral-800/60 bg-neutral-950/40 text-neutral-500 cursor-not-allowed'
                      : b.value === 1
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-200 cursor-pointer hover:bg-amber-500/20'
                      : 'border-neutral-800 bg-neutral-950/60 text-neutral-400 cursor-pointer hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold ${
                        b.value === 1 ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {b.value}
                    </span>
                    <span className="text-neutral-300">{b.label}</span>
                  </div>
                  <span className="text-[11px] text-neutral-500">D{b.bit} (1&lt;&lt;{b.bit})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800/80 bg-neutral-950/60 p-3 text-xs text-neutral-400 leading-relaxed">
            <div className="flex items-center gap-1.5 text-neutral-300 font-medium mb-1">
              <Info className="h-3.5 w-3.5 text-amber-400" />
              <span>Specification Reference</span>
            </div>
            {byteInfo.longExplanation}
          </div>
        </div>

        {/* Right: High-Level Cartridge & Hardware Config (7 cols) */}
        <div className="lg:col-span-7 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-5">
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-amber-400" />
            <span>Cartridge Hardware & Board Parameters</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mapper Selector */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-medium text-neutral-300">
                Memory Mapper Chip
              </label>
              <select
                value={header.mapperNumber}
                onChange={(e) => updateHeaderProperty({ mapperNumber: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-100 focus:border-amber-400 focus:outline-none"
              >
                {COMMON_MAPPERS.map((m) => (
                  <option key={m.number} value={m.number}>
                    #{m.number} - {m.name} ({m.shortDescription.split('.')[0]})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-400">
                Current: <span className="text-amber-400 font-mono font-medium">{header.mapperName}</span>
                {' · '}{COMMON_MAPPERS.find((m) => m.number === header.mapperNumber)?.prgBanking || 'Standard'}
              </p>
            </div>

            {/* PRG-ROM Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                PRG-ROM Size (Program Code)
              </label>
              <select
                value={header.prgRomSizeKiB}
                onChange={(e) => updateHeaderProperty({ prgRomSizeKiB: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-100 focus:border-amber-400 focus:outline-none"
              >
                <option value={16}>16 KiB (1 bank · NROM-128)</option>
                <option value={32}>32 KiB (2 banks · NROM-256)</option>
                <option value={64}>64 KiB (4 banks)</option>
                <option value={128}>128 KiB (8 banks · MMC1/UNROM)</option>
                <option value={256}>256 KiB (16 banks · MMC3/MMC1)</option>
                <option value={512}>512 KiB (32 banks · Max standard)</option>
                <option value={1024}>1024 KiB (64 banks · MMC5/ExROM)</option>
              </select>
            </div>

            {/* CHR-ROM Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                CHR-ROM Size (Graphics Bank)
              </label>
              <select
                value={header.chrRomSizeKiB}
                onChange={(e) => updateHeaderProperty({ chrRomSizeKiB: parseInt(e.target.value, 10) })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-100 focus:border-amber-400 focus:outline-none"
              >
                <option value={0}>0 KiB (CHR-RAM loaded dynamically)</option>
                <option value={8}>8 KiB (1 bank = 512 tiles · NROM)</option>
                <option value={16}>16 KiB (2 banks = 1024 tiles)</option>
                <option value={32}>32 KiB (4 banks = 2048 tiles · CNROM)</option>
                <option value={64}>64 KiB (8 banks = 4096 tiles)</option>
                <option value={128}>128 KiB (16 banks · MMC3)</option>
                <option value={256}>256 KiB (32 banks · High FMV video)</option>
                <option value={512}>512 KiB (64 banks · Extended FMV)</option>
              </select>
            </div>

            {/* Mirroring */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                PPU Nametable Mirroring
              </label>
              <select
                value={header.mirroring}
                onChange={(e) => updateHeaderProperty({ mirroring: e.target.value as any })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-100 focus:border-amber-400 focus:outline-none"
              >
                <option value="horizontal">Horizontal (CIRAM A10 = PPU A11 · Vertical scroll)</option>
                <option value="vertical">Vertical (CIRAM A10 = PPU A10 · Horiz scroll)</option>
                <option value="four_screen">Four-Screen VRAM (Extra 2KB on board)</option>
              </select>
            </div>

            {/* TV System / Timing */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                TV System & Hardware Timing
              </label>
              <select
                value={header.tvSystem}
                onChange={(e) => updateHeaderProperty({ tvSystem: e.target.value as any })}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-medium text-neutral-100 focus:border-amber-400 focus:outline-none"
              >
                <option value="ntsc">NTSC (RP2A03 · 60Hz North America/Japan)</option>
                <option value="pal">PAL (RP2A07 · 50Hz Europe/Australia)</option>
                <option value="multi">Multi-Region (Compatible with both)</option>
                <option value="dendy">Dendy (PAL clone with NTSC CPU divider)</option>
              </select>
            </div>
          </div>

          {/* Checkboxes & Boolean Flags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-neutral-800 pt-4">
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={header.hasBattery}
                onChange={(e) => updateHeaderProperty({ hasBattery: e.target.checked })}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
              <span>Battery-Backed RAM ($6000)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={header.hasTrainer}
                onChange={(e) => updateHeaderProperty({ hasTrainer: e.target.checked })}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
              <span>512-Byte Trainer ($7000)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={header.vsSystem}
                onChange={(e) => updateHeaderProperty({ vsSystem: e.target.checked })}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
              <span>VS Unisystem Arcade</span>
            </label>
          </div>

          {/* Code Generation Preview (ASM, C, Hex) */}
          <div className="border-t border-neutral-800 pt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-neutral-400" />
                <span className="text-xs font-semibold text-neutral-300">Generated Header Embed Code</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-950 p-0.5">
                  <button
                    onClick={() => setViewCodeFormat('asm')}
                    className={`rounded px-2 py-0.5 text-[11px] font-mono transition-all ${
                      viewCodeFormat === 'asm' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400'
                    }`}
                  >
                    6502 ASM
                  </button>
                  <button
                    onClick={() => setViewCodeFormat('c')}
                    className={`rounded px-2 py-0.5 text-[11px] font-mono transition-all ${
                      viewCodeFormat === 'c' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400'
                    }`}
                  >
                    C Header
                  </button>
                  <button
                    onClick={() => setViewCodeFormat('hex')}
                    className={`rounded px-2 py-0.5 text-[11px] font-mono transition-all ${
                      viewCodeFormat === 'hex' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400'
                    }`}
                  >
                    Raw Hex
                  </button>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 rounded border border-neutral-800 bg-neutral-900 px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <pre className="max-h-40 overflow-y-auto rounded-lg border border-neutral-800/80 bg-neutral-950 p-3 text-[11px] font-mono text-neutral-300 leading-relaxed">
              {viewCodeFormat === 'asm'
                ? generateAsmHeader(header)
                : viewCodeFormat === 'c'
                ? generateCHeader(header)
                : Array.from(header.rawBytes)
                    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
                    .join(' ')}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
