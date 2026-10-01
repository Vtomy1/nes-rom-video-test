import React, { useState, useCallback } from 'react';
import {
  NesRomHeader,
  VideoProcessingSettings,
  ExtractedFrame,
  NesTile,
} from './types/nes';
import { createDefaultHeader, parseHeader } from './utils/nesHeader';
import { HeaderBar } from './components/HeaderBar';
import { VideoProcessor } from './components/VideoProcessor';
import { HeaderInspector } from './components/HeaderInspector';
import { ChrMicroscope } from './components/ChrMicroscope';
import { CrtMonitor } from './components/CrtMonitor';
import { RomImportModal } from './components/RomImportModal';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'video' | 'header' | 'chr' | 'crt'>('video');

  // Video and conversion settings
  const [videoSettings, setVideoSettings] = useState<VideoProcessingSettings>({
    targetFps: 15,
    width: 256,
    height: 240,
    aspectMode: 'fit_letterbox',
    dither: 'floyd_steinberg',
    ditherStrength: 0.85,
    brightness: 0,
    contrast: 0,
    gamma: 1.0,
    invert: false,
    selectedPalette: [0x0f, 0x00, 0x10, 0x20], // High-contrast monochrome: Black, Mid Gray, Light Gray, White
    autoDeduplicateTiles: true,
    maxFramesToExtract: 60,
  });

  // Current NES ROM Header
  const [romHeader, setRomHeader] = useState<NesRomHeader>(() => createDefaultHeader('ines_1_0'));

  // Video processing outputs
  const [extractedFrames, setExtractedFrames] = useState<ExtractedFrame[]>([]);
  const [uniqueTiles, setUniqueTiles] = useState<NesTile[]>([]);
  const [chrBytes, setChrBytes] = useState<Uint8Array>(() => new Uint8Array(8192));
  const [calculatedChrSizeKiB, setCalculatedChrSizeKiB] = useState<number>(8);
  const [currentCrtFrameIdx, setCurrentCrtFrameIdx] = useState<number>(0);

  // Modals
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Callbacks
  const handleFramesExtracted = useCallback(
    (frames: ExtractedFrame[], allTiles: NesTile[]) => {
      setExtractedFrames(frames);
      setUniqueTiles(allTiles);
    },
    []
  );

  const handleChrCalculated = useCallback(
    (bytes: Uint8Array, sizeKiB: number) => {
      setChrBytes(bytes);
      setCalculatedChrSizeKiB(sizeKiB);

      // Auto-update header CHR size if currently lower than needed
      setRomHeader((prev) => {
        if (prev.chrRomSizeKiB < sizeKiB) {
          const updated = { ...prev, chrRomSizeKiB: sizeKiB };
          return updated;
        }
        return prev;
      });
    },
    []
  );

  const handleApplyImportedHeader = useCallback(
    (importedHeader: NesRomHeader, importedChr?: Uint8Array) => {
      setRomHeader(importedHeader);
      if (importedChr && importedChr.length > 0) {
        setChrBytes(importedChr);
        setCalculatedChrSizeKiB(importedChr.length / 1024);
      }
      setActiveTab('header');
    },
    []
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top 3-Zone Navigation Bar */}
      <HeaderBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        prgSizeKiB={romHeader.prgRomSizeKiB}
        chrSizeKiB={romHeader.chrRomSizeKiB}
        mapperName={romHeader.mapperName}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8">
        {activeTab === 'video' && (
          <VideoProcessor
            settings={videoSettings}
            onUpdateSettings={setVideoSettings}
            onFramesExtracted={handleFramesExtracted}
            onChrCalculated={handleChrCalculated}
          />
        )}

        {activeTab === 'header' && (
          <HeaderInspector
            header={romHeader}
            onUpdateHeader={setRomHeader}
            calculatedChrSizeKiB={calculatedChrSizeKiB}
          />
        )}

        {activeTab === 'chr' && (
          <ChrMicroscope
            tiles={uniqueTiles}
            currentFrame={extractedFrames[0]}
            selectedPalette={videoSettings.selectedPalette}
            chrBytes={chrBytes}
          />
        )}

        {activeTab === 'crt' && (
          <CrtMonitor
            currentFrame={extractedFrames[currentCrtFrameIdx] || extractedFrames[0]}
            totalFrames={extractedFrames.length}
            currentFrameIdx={currentCrtFrameIdx}
            onSeekFrame={setCurrentCrtFrameIdx}
            fps={videoSettings.targetFps}
            width={videoSettings.width}
            height={videoSettings.height}
          />
        )}
      </main>

      {/* Technical Footnote Footer */}
      <footer className="w-full border-t border-neutral-900 bg-neutral-950 py-6 px-4 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>NES 2C02 PPU</span>
            <span aria-hidden="true">·</span>
            <span>2bpp Planar Tiles</span>
            <span aria-hidden="true">·</span>
            <span>iNES 1.0 & NES 2.0 Compliant</span>
          </div>

          <div className="text-neutral-600">
            Precision 6502 Machine Code Generator & Video Cartridge Pipeline
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RomImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onApplyHeader={handleApplyImportedHeader}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        header={romHeader}
        chrBytes={chrBytes}
        selectedPalette={videoSettings.selectedPalette}
        currentFrame={extractedFrames[0]}
      />
    </div>
  );
}
