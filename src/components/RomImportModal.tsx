import React, { useState } from 'react';
import { NesRomHeader } from '../types/nes';
import { parseHeader } from '../utils/nesHeader';
import { X, Upload, CheckCircle2, AlertTriangle, FileCheck, ArrowRight } from 'lucide-react';

interface RomImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyHeader: (header: NesRomHeader, chrData?: Uint8Array) => void;
}

export const RomImportModal: React.FC<RomImportModalProps> = ({
  isOpen,
  onClose,
  onApplyHeader,
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [parsedHeader, setParsedHeader] = useState<NesRomHeader | null>(null);
  const [extractedChr, setExtractedChr] = useState<Uint8Array | null>(null);
  const [romFileName, setRomFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    setErrorMsg(null);
    setRomFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer || buffer.byteLength < 16) {
          throw new Error('File is too small to contain a 16-byte NES header');
        }

        const uint8 = new Uint8Array(buffer);
        const header = parseHeader(uint8.slice(0, 16));
        setParsedHeader(header);

        // Check if file contains CHR data
        const hasTrainer = header.hasTrainer;
        const trainerLen = hasTrainer ? 512 : 0;
        const prgLen = header.prgRomSizeKiB * 1024;
        const chrOffset = 16 + trainerLen + prgLen;
        const chrLen = header.chrRomSizeKiB * 1024;

        if (chrLen > 0 && buffer.byteLength >= chrOffset + chrLen) {
          setExtractedChr(uint8.slice(chrOffset, chrOffset + chrLen));
        } else {
          setExtractedChr(null);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to parse NES ROM file');
        setParsedHeader(null);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (parsedHeader) {
      onApplyHeader(parsedHeader, extractedChr || undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-neutral-100">
              Import Existing .NES ROM
            </h2>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed transition-all ${
            dragActive
              ? 'border-amber-400 bg-amber-500/10'
              : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/40'
          }`}
        >
          <Upload className="h-8 w-8 text-neutral-500 mb-2" />
          <span className="text-xs font-medium text-neutral-200">
            Drag & drop any .nes cartridge file here
          </span>
          <span className="text-[11px] text-neutral-500 mt-1">
            or browse from your computer
          </span>

          <label className="mt-4 cursor-pointer rounded-lg bg-neutral-800 px-4 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition-colors">
            Select File
            <input
              type="file"
              accept=".nes"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            />
          </label>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Parsed Inspection Preview */}
        {parsedHeader && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-emerald-400" />
                <span>{romFileName}</span>
              </span>
              <span className="text-xs font-mono text-amber-400 font-semibold">
                {parsedHeader.format.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-[10px] text-neutral-500 block">MAPPER</span>
                <span className="text-neutral-200 font-semibold">#{parsedHeader.mapperNumber}</span>
                <div className="text-[10px] text-neutral-400 truncate">{parsedHeader.mapperName}</div>
              </div>

              <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-[10px] text-neutral-500 block">PRG-ROM</span>
                <span className="text-neutral-200 font-semibold">{parsedHeader.prgRomSizeKiB} KiB</span>
                <div className="text-[10px] text-neutral-400">{parsedHeader.prgRomSizeKiB / 16} units</div>
              </div>

              <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-[10px] text-neutral-500 block">CHR-ROM</span>
                <span className="text-neutral-200 font-semibold">{parsedHeader.chrRomSizeKiB} KiB</span>
                <div className="text-[10px] text-neutral-400">
                  {parsedHeader.chrRomSizeKiB === 0 ? 'CHR-RAM' : `${parsedHeader.chrRomSizeKiB / 8} units`}
                </div>
              </div>

              <div className="p-2 rounded bg-neutral-950 border border-neutral-800/80">
                <span className="text-[10px] text-neutral-500 block">MIRRORING</span>
                <span className="text-neutral-200 font-semibold capitalize">{parsedHeader.mirroring}</span>
                <div className="text-[10px] text-neutral-400">{parsedHeader.tvSystem.toUpperCase()}</div>
              </div>
            </div>

            <div className="text-[11px] font-mono text-neutral-400 pt-1">
              Raw 16-Byte Header:{' '}
              <span className="text-amber-300">
                {Array.from(parsedHeader.rawBytes)
                  .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
                  .join(' ')}
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!parsedHeader}
            onClick={handleApply}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Load Header into Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
