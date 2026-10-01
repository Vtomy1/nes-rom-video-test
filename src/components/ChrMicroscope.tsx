import React, { useState, useMemo, useRef, useEffect } from 'react';
import { NesTile, ExtractedFrame } from '../types/nes';
import { getNesColor } from '../utils/nesPalette';
import { Layers, ZoomIn, Eye, Sparkles, Binary, Download } from 'lucide-react';
import { downloadBlob } from '../utils/romBuilder';

interface ChrMicroscopeProps {
  tiles: NesTile[];
  currentFrame?: ExtractedFrame;
  selectedPalette: number[];
  chrBytes: Uint8Array;
}

export const ChrMicroscope: React.FC<ChrMicroscopeProps> = ({
  tiles,
  currentFrame,
  selectedPalette,
  chrBytes,
}) => {
  const [selectedTileIndex, setSelectedTileIndex] = useState<number>(0);
  const [hoveredNtIndex, setHoveredNtIndex] = useState<number | null>(null);
  const [activeBank, setActiveBank] = useState<number>(0);

  const selectedTile = useMemo(() => {
    return tiles[selectedTileIndex] || tiles[0];
  }, [tiles, selectedTileIndex]);

  // Palette colors RGB
  const paletteRgb = useMemo(() => {
    return selectedPalette.map((idx) => getNesColor(idx));
  }, [selectedPalette]);

  // Export CHR binary
  const handleDownloadChr = () => {
    downloadBlob(chrBytes, 'video_stream.chr', 'application/octet-stream');
  };

  const totalBanks = Math.max(1, Math.ceil(tiles.length / 512));
  const bankTiles = useMemo(() => {
    const start = activeBank * 512;
    return tiles.slice(start, start + 512);
  }, [tiles, activeBank]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-neutral-100">
              NES 2bpp Pattern Table & Bitplane Microscope
            </h2>
            <span className="text-xs font-mono text-neutral-500">·</span>
            <span className="text-xs font-mono text-amber-400">
              {tiles.length} Unique Tiles ({Math.ceil(tiles.length / 512) * 8} KiB CHR)
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400 max-w-2xl">
            Inspect NES 2bpp planar graphics memory. Each 8x8 tile is stored as 16 bytes: Plane 0
            encodes bit 0, Plane 1 encodes bit 1. The 6502 CPU/PPU combines them to address the 4
            subpalette colors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {totalBanks > 1 && (
            <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-950 p-1">
              {Array.from({ length: totalBanks }).map((_, b) => (
                <button
                  key={b}
                  onClick={() => setActiveBank(b)}
                  className={`rounded px-2.5 py-1 text-xs font-mono transition-all ${
                    activeBank === b ? 'bg-amber-500 text-neutral-950 font-bold' : 'text-neutral-400'
                  }`}
                >
                  Bank {b}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleDownloadChr}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-neutral-200 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-amber-400" />
            <span>Download .CHR Dump</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Pattern Table Viewer (Left) + Bitplane Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pattern Table 16x16 / 16x32 Grid (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-neutral-100">
                Pattern Table $0000 – $1FFF
              </h3>
              <span className="text-xs text-neutral-400">
                Click any tile to inspect its 16-byte bitplane layers
              </span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              Selected: #{selectedTileIndex} (Tile ${selectedTileIndex.toString(16).padStart(2, '0').toUpperCase()})
            </span>
          </div>

          {/* 16-column Tile Grid */}
          <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 max-h-[460px] overflow-y-auto p-2 bg-neutral-950 rounded-lg border border-neutral-800/80">
            {bankTiles.map((tile, i) => {
              const actualIdx = activeBank * 512 + i;
              const isSelected = selectedTileIndex === actualIdx;

              return (
                <button
                  key={actualIdx}
                  onClick={() => setSelectedTileIndex(actualIdx)}
                  className={`group relative aspect-square p-0.5 rounded border transition-transform ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 z-10 scale-110'
                      : 'border-neutral-800/80 hover:border-neutral-500'
                  }`}
                  title={`Tile #${actualIdx} ($${actualIdx.toString(16).toUpperCase()})`}
                >
                  <TileCanvas
                    pixelData={tile.pixelData}
                    paletteRgb={paletteRgb}
                    className="w-full h-full image-rendering-pixelated"
                  />
                </button>
              );
            })}
          </div>

          <div className="text-xs text-neutral-500 flex items-center justify-between">
            <span>Showing {bankTiles.length} tiles in active bank</span>
            <span>Offset: ${(activeBank * 0x1000).toString(16).toUpperCase()}</span>
          </div>
        </div>

        {/* Right: Selected Tile Bitplane Microscope (6 cols) */}
        {selectedTile ? (
          <div className="lg:col-span-6 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Binary className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-neutral-100">
                  Tile #{selectedTile.index} Bitplane Dissection
                </h3>
              </div>
              <span className="text-xs font-mono text-amber-400">
                PPU CHR Offset: ${(selectedTile.index * 16).toString(16).padStart(4, '0').toUpperCase()}
              </span>
            </div>

            {/* 8x8 Zoomed Pixel Grid + Planes */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              {/* Zoomed Tile Canvas (4 cols) */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center p-3 rounded-lg border border-neutral-800 bg-neutral-950">
                <span className="text-[10px] font-mono text-neutral-400 mb-2">COMPOSITE TILE</span>
                <div className="relative h-28 w-28 border border-neutral-700 rounded overflow-hidden shadow-2xl">
                  <TileCanvas
                    pixelData={selectedTile.pixelData}
                    paletteRgb={paletteRgb}
                    className="h-full w-full image-rendering-pixelated"
                  />
                </div>
                <div className="mt-2 text-center">
                  <span className="text-[10px] font-mono text-neutral-400">8×8 Pixels · 2bpp</span>
                </div>
              </div>

              {/* Bitplane Math explanation (8 cols) */}
              <div className="sm:col-span-8 space-y-2 text-xs font-mono bg-neutral-950 p-3 rounded-lg border border-neutral-800/80">
                <div className="text-neutral-400 text-[11px] mb-1 font-sans">
                  Formula: <span className="text-amber-400 font-mono">Pixel = (Plane 1 &lt;&lt; 1) | Plane 0</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-neutral-400 border-b border-neutral-800 pb-1">
                  <span>ROW</span>
                  <span>PLANE 0 (Low Bit)</span>
                  <span>PLANE 1 (High Bit)</span>
                </div>

                {Array.from({ length: 8 }).map((_, r) => {
                  const p0 = selectedTile.data[r];
                  const p1 = selectedTile.data[r + 8];
                  const p0Bin = p0.toString(2).padStart(8, '0');
                  const p1Bin = p1.toString(2).padStart(8, '0');

                  return (
                    <div key={r} className="grid grid-cols-3 gap-2 text-center text-[11px]">
                      <span className="text-neutral-500">Row {r}</span>
                      <span className="text-sky-400 font-mono">%{p0Bin} (${p0.toString(16).padStart(2,'0')})</span>
                      <span className="text-emerald-400 font-mono">%{p1Bin} (${p1.toString(16).padStart(2,'0')})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raw 16 Bytes Hex String */}
            <div className="space-y-1.5 pt-2 border-t border-neutral-800">
              <span className="text-xs font-medium text-neutral-300">Raw 16-Byte Stream (ASM Format)</span>
              <pre className="p-3 rounded-lg border border-neutral-800/80 bg-neutral-950 text-xs font-mono text-amber-300 overflow-x-auto">
                {`.byte ` +
                  Array.from(selectedTile.data)
                    .map((b) => `$${b.toString(16).padStart(2, '0').toUpperCase()}`)
                    .join(', ')}
              </pre>
            </div>
          </div>
        ) : null}
      </div>

      {/* Bottom: Nametable Screen Layout (32x30 Matrix) */}
      {currentFrame && currentFrame.nametable && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-neutral-100">
                PPU Nametable 0 Matrix ($2000 – $23BF · 32×30 Tiles)
              </h3>
            </div>
            <span className="text-xs text-neutral-400 font-mono">
              {hoveredNtIndex !== null
                ? `Tile @ [X:${hoveredNtIndex % 32}, Y:${Math.floor(hoveredNtIndex / 32)}] → Tile #${currentFrame.nametable[hoveredNtIndex]}`
                : 'Hover over screen tile to inspect reference'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div
              className="inline-grid grid-cols-32 gap-0.5 p-2 bg-neutral-950 rounded-lg border border-neutral-800"
              style={{ minWidth: '640px' }}
            >
              {currentFrame.nametable.map((tileIdx, idx) => {
                const isTarget = selectedTileIndex === tileIdx;
                const isHovered = hoveredNtIndex === idx;

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredNtIndex(idx)}
                    onMouseLeave={() => setHoveredNtIndex(null)}
                    onClick={() => setSelectedTileIndex(tileIdx)}
                    className={`aspect-square w-full rounded-[1px] transition-all cursor-pointer ${
                      isTarget
                        ? 'ring-2 ring-amber-400 bg-amber-500/40 z-10'
                        : isHovered
                        ? 'bg-neutral-600'
                        : 'bg-neutral-800/80 hover:bg-neutral-700'
                    }`}
                    title={`Tile #${tileIdx}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface TileCanvasProps {
  pixelData: number[][];
  paletteRgb: { rgb: [number, number, number] }[];
  className?: string;
}

const TileCanvas: React.FC<TileCanvasProps> = ({ pixelData, paletteRgb, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const imgData = ctx.createImageData(8, 8);
    const d = imgData.data;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const colorIdx = pixelData[r]?.[c] ?? 0;
        const color = paletteRgb[colorIdx] || paletteRgb[0];
        const [red, green, blue] = color.rgb;

        const offset = (r * 8 + c) * 4;
        d[offset] = red;
        d[offset + 1] = green;
        d[offset + 2] = blue;
        d[offset + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [pixelData, paletteRgb]);

  return <canvas ref={canvasRef} width={8} height={8} className={className} />;
};
