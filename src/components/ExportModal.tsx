import React, { useState } from 'react';
import { NesRomHeader, ExtractedFrame } from '../types/nes';
import {
  buildNesRom,
  downloadBlob,
  downloadText,
} from '../utils/romBuilder';
import {
  generateAsmHeader,
  generateCHeader,
  buildHeaderBytes,
} from '../utils/nesHeader';
import {
  X,
  Download,
  FileCode,
  Layers,
  HardDrive,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  header: NesRomHeader;
  chrBytes: Uint8Array;
  selectedPalette: number[];
  currentFrame?: ExtractedFrame;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  header,
  chrBytes,
  selectedPalette,
  currentFrame,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  // Build complete .nes ROM
  const handleDownloadNesRom = () => {
    const nesBytes = buildNesRom({
      header,
      chrBytes,
      palette: selectedPalette,
      nametable: currentFrame?.nametable,
    });
    downloadBlob(nesBytes, 'video_cartridge.nes', 'application/x-nes-rom');
  };

  // Download raw 16-byte header
  const handleDownloadHeaderBin = () => {
    const raw = buildHeaderBytes(header);
    downloadBlob(raw, 'nes_header.bin', 'application/octet-stream');
  };

  // Download CHR-ROM dump
  const handleDownloadChrRom = () => {
    downloadBlob(chrBytes, 'video_graphics.chr', 'application/octet-stream');
  };

  // Download 6502 ASM file
  const handleDownloadAsm = () => {
    const asm = generateAsmHeader(header);
    downloadText(asm, 'nes_rom_header.asm');
  };

  // Download C header
  const handleDownloadCHeader = () => {
    const code = generateCHeader(header);
    downloadText(code, 'nes_rom_header.h');
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-neutral-100">
              Export NES Cartridge & Developer Assets
            </h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary Action: Download .NES ROM */}
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-neutral-100">
                Playable .NES Cartridge Image
              </h3>
            </div>
            <p className="mt-1 text-xs text-neutral-300">
              Includes compliant {header.format.toUpperCase()} 16-byte header, assembled 6502 CPU
              player engine ($8000), palette tables ($3F00), and all extracted video CHR tiles.
            </p>
            <div className="mt-2 text-[11px] font-mono text-amber-300 flex items-center gap-2">
              <span>{header.prgRomSizeKiB}KB PRG</span>
              <span>·</span>
              <span>{header.chrRomSizeKiB}KB CHR</span>
              <span>·</span>
              <span>Mapper #{header.mapperNumber} ({header.mapperName})</span>
            </div>
          </div>

          <button
            onClick={handleDownloadNesRom}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950 hover:bg-amber-400 transition-colors shadow-lg shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>Download .NES</span>
          </button>
        </div>

        {/* Secondary Downloads Grid */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
            Modular Developer Formats
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 16-byte binary header */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-200">16-Byte Raw Header</div>
                <div className="text-[11px] text-neutral-500 font-mono">nes_header.bin (16 bytes)</div>
              </div>
              <button
                onClick={handleDownloadHeaderBin}
                className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                title="Download 16-byte raw header binary"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* CHR-ROM dump */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-200">CHR Pattern Bank</div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  video_graphics.chr ({chrBytes.length / 1024} KiB)
                </div>
              </div>
              <button
                onClick={handleDownloadChrRom}
                className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                title="Download CHR-ROM binary bank"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 6502 Assembly Header */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-200">6502 Assembly Include</div>
                <div className="text-[11px] text-neutral-500 font-mono">ca65 / nesasm / asm6 syntax</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy(generateAsmHeader(header), 'asm')}
                  className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                  title="Copy Assembly to clipboard"
                >
                  {copiedType === 'asm' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={handleDownloadAsm}
                  className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                  title="Download .asm file"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* C/C++ Header */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-neutral-200">C / C++ Header File</div>
                <div className="text-[11px] text-neutral-500 font-mono">nes_rom_header.h (stdint array)</div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopy(generateCHeader(header), 'c')}
                  className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                  title="Copy C header to clipboard"
                >
                  {copiedType === 'c' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={handleDownloadCHeader}
                  className="p-2 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                  title="Download .h file"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="rounded-lg bg-neutral-800 px-4 py-2 text-xs font-medium text-neutral-200 hover:bg-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
