import React from 'react';
import { Cpu, HardDrive, Download, Upload, MonitorPlay, Sparkles } from 'lucide-react';

interface HeaderBarProps {
  activeTab: 'video' | 'header' | 'chr' | 'crt';
  setActiveTab: (tab: 'video' | 'header' | 'chr' | 'crt') => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  prgSizeKiB: number;
  chrSizeKiB: number;
  mapperName: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenImport,
  onOpenExport,
  prgSizeKiB,
  chrSizeKiB,
  mapperName,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
            <Cpu className="h-4 w-4" />
          </div>
          <a href="#" className="font-semibold tracking-tight text-neutral-100 hover:text-amber-400 transition-colors">
            NES ROM & Video Pipeline Studio
          </a>
        </div>

        {/* Zone 2: Navigation Links / Mode Selector */}
        <nav className="hidden md:flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/60 p-1">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'video'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MonitorPlay className="h-3.5 w-3.5" />
            <span>Video & Quantizer</span>
          </button>

          <button
            onClick={() => setActiveTab('header')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'header'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span>16-Byte Header Architect</span>
          </button>

          <button
            onClick={() => setActiveTab('chr')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'chr'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>CHR & Bitplanes</span>
          </button>

          <button
            onClick={() => setActiveTab('crt')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === 'crt'
                ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>CRT 2C02 Screen</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-neutral-400 border-r border-neutral-800 pr-3">
            <span className="text-neutral-500">MAPPER:</span>
            <span className="text-amber-400">{mapperName}</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-300">{prgSizeKiB}KB PRG</span>
            <span className="text-neutral-600">·</span>
            <span className="text-neutral-300">{chrSizeKiB}KB CHR</span>
          </div>

          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors"
            title="Import an existing .nes file to inspect and edit its header"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Import ROM</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export .NES</span>
          </button>
        </div>
      </div>
    </header>
  );
};
