import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  VideoProcessingSettings,
  ExtractedFrame,
  DitherAlgorithm,
  NesTile,
} from '../types/nes';
import {
  NES_MASTER_PALETTE,
  PALETTE_PRESETS,
  getNesColor,
} from '../utils/nesPalette';
import { quantizeImageData } from '../utils/dithering';
import { processFrameToTiles, buildChrRom } from '../utils/chrEncoder';
import { SAMPLE_VIDEOS, SampleVideoOption } from '../utils/sampleVideos';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Upload,
  Sparkles,
  Sliders,
  Palette,
  Layers,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react';

interface VideoProcessorProps {
  settings: VideoProcessingSettings;
  onUpdateSettings: (newSettings: VideoProcessingSettings) => void;
  onFramesExtracted: (frames: ExtractedFrame[], allUniqueTiles: NesTile[]) => void;
  onChrCalculated: (chrBytes: Uint8Array, sizeKiB: number) => void;
}

export const VideoProcessor: React.FC<VideoProcessorProps> = ({
  settings,
  onUpdateSettings,
  onFramesExtracted,
  onChrCalculated,
}) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string>('silhouette_bad_apple');
  const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
  const [customVideoName, setCustomVideoName] = useState<string | null>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrameIdx, setCurrentFrameIdx] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [splitViewMode, setSplitViewMode] = useState<'split' | 'quantized' | 'original'>('split');
  const [colorPickerSlot, setColorPickerSlot] = useState<number | null>(null);

  // Generated frames buffer
  const [extractedFrames, setExtractedFrames] = useState<ExtractedFrame[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Canvas refs
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const quantizedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  const activeSample = useMemo(
    () => SAMPLE_VIDEOS.find((s) => s.id === selectedSampleId) || SAMPLE_VIDEOS[0],
    [selectedSampleId]
  );

  // Process frames from sample video or custom video
  const generateFrames = useCallback(() => {
    setIsProcessing(true);
    const { width, height, dither, ditherStrength, brightness, contrast, gamma, invert, selectedPalette, maxFramesToExtract } = settings;

    // Use offscreen canvases
    const frames: ExtractedFrame[] = [];
    const globalTilesMap = new Map<string, NesTile>();

    if (customVideoUrl && videoElementRef.current) {
      // User video processing
      const video = videoElementRef.current;
      const totalFrames = Math.min(maxFramesToExtract, 60);
      const duration = video.duration || 2;
      const step = duration / totalFrames;

      let processedCount = 0;
      const processStep = (idx: number) => {
        if (idx >= totalFrames) {
          finalizeProcessing(frames, globalTilesMap);
          return;
        }

        video.currentTime = idx * step;
        video.onseeked = () => {
          const offCanvas = document.createElement('canvas');
          offCanvas.width = width;
          offCanvas.height = height;
          const ctx = offCanvas.getContext('2d')!;

          // Draw video with aspect mode
          drawMediaToCanvas(ctx, video, video.videoWidth, video.videoHeight, width, height, settings.aspectMode);

          // Quantize
          const imgData = ctx.getImageData(0, 0, width, height);
          const { quantizedImageData, colorIndices } = quantizeImageData(imgData, {
            algorithm: dither,
            ditherStrength,
            brightness,
            contrast,
            gamma,
            invert,
            palette: selectedPalette,
          });

          const quantCanvas = document.createElement('canvas');
          quantCanvas.width = width;
          quantCanvas.height = height;
          const qctx = quantCanvas.getContext('2d')!;
          qctx.putImageData(quantizedImageData, 0, 0);

          const tiling = processFrameToTiles(colorIndices, width, height, globalTilesMap);

          frames.push({
            frameIndex: idx,
            timestamp: idx * step,
            canvas: offCanvas,
            quantizedCanvas: quantCanvas,
            tiles: tiling.tiles,
            nametable: tiling.nametable,
            uniqueTileCount: tiling.uniqueTiles.length,
          });

          processedCount++;
          processStep(processedCount);
        };
      };
      processStep(0);
    } else {
      // Procedural sample video rendering
      const totalFrames = Math.min(activeSample.durationFrames, maxFramesToExtract);

      for (let f = 0; f < totalFrames; f++) {
        const offCanvas = document.createElement('canvas');
        offCanvas.width = width;
        offCanvas.height = height;
        const ctx = offCanvas.getContext('2d')!;

        // Render sample frame
        activeSample.renderFrame(ctx, width, height, f, totalFrames);

        // Quantize
        const imgData = ctx.getImageData(0, 0, width, height);
        const { quantizedImageData, colorIndices } = quantizeImageData(imgData, {
          algorithm: dither,
          ditherStrength,
          brightness,
          contrast,
          gamma,
          invert,
          palette: selectedPalette,
        });

        const quantCanvas = document.createElement('canvas');
        quantCanvas.width = width;
        quantCanvas.height = height;
        const qctx = quantCanvas.getContext('2d')!;
        qctx.putImageData(quantizedImageData, 0, 0);

        const tiling = processFrameToTiles(colorIndices, width, height, globalTilesMap);

        frames.push({
          frameIndex: f,
          timestamp: f / activeSample.fps,
          canvas: offCanvas,
          quantizedCanvas: quantCanvas,
          tiles: tiling.tiles,
          nametable: tiling.nametable,
          uniqueTileCount: tiling.uniqueTiles.length,
        });
      }

      finalizeProcessing(frames, globalTilesMap);
    }
  }, [settings, customVideoUrl, activeSample]);

  const finalizeProcessing = (frames: ExtractedFrame[], globalTilesMap: Map<string, NesTile>) => {
    setExtractedFrames(frames);
    const uniqueTilesArray = Array.from(globalTilesMap.values());
    const { chrData, totalSizeKiB } = buildChrRom(uniqueTilesArray);
    onFramesExtracted(frames, uniqueTilesArray);
    onChrCalculated(chrData, totalSizeKiB);
    setIsProcessing(false);
  };

  // Trigger frame extraction whenever key visual settings change
  useEffect(() => {
    generateFrames();
  }, [
    generateFrames,
    selectedSampleId,
    customVideoUrl,
    settings.dither,
    settings.ditherStrength,
    settings.brightness,
    settings.contrast,
    settings.gamma,
    settings.invert,
    settings.selectedPalette,
    settings.width,
    settings.height,
  ]);

  // Animation playback loop
  useEffect(() => {
    if (!isPlaying || extractedFrames.length === 0) return;

    const fps = activeSample.fps * playbackSpeed;
    const intervalMs = 1000 / fps;

    const tick = (time: number) => {
      if (time - lastTickTimeRef.current >= intervalMs) {
        lastTickTimeRef.current = time;
        setCurrentFrameIdx((prev) => (prev + 1) % extractedFrames.length);
      }
      animFrameIdRef.current = requestAnimationFrame(tick);
    };

    animFrameIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isPlaying, extractedFrames.length, activeSample.fps, playbackSpeed]);

  // Render current frame to display canvases
  useEffect(() => {
    if (extractedFrames.length === 0) return;
    const frame = extractedFrames[currentFrameIdx] || extractedFrames[0];
    if (!frame) return;

    if (originalCanvasRef.current) {
      const ctx = originalCanvasRef.current.getContext('2d')!;
      ctx.clearRect(0, 0, settings.width, settings.height);
      ctx.drawImage(frame.canvas, 0, 0);
    }

    if (quantizedCanvasRef.current) {
      const ctx = quantizedCanvasRef.current.getContext('2d')!;
      ctx.clearRect(0, 0, settings.width, settings.height);
      ctx.drawImage(frame.quantizedCanvas, 0, 0);
    }
  }, [currentFrameIdx, extractedFrames, settings.width, settings.height]);

  // Handle custom user video file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setCustomVideoUrl(url);
    setCustomVideoName(file.name);
    setIsPlaying(false);
  };

  const handlePaletteColorChange = (slotIndex: number, newNesColorIndex: number) => {
    const updated = [...settings.selectedPalette];
    updated[slotIndex] = newNesColorIndex;
    onUpdateSettings({ ...settings, selectedPalette: updated });
    setColorPickerSlot(null);
  };

  const currentFrameData = extractedFrames[currentFrameIdx];
  const uniqueCount = currentFrameData?.uniqueTileCount || 0;
  const totalCount = 960;
  const compressionRatio = totalCount > 0 ? Math.round((1 - uniqueCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Hidden video element for custom video frame extraction */}
      {customVideoUrl && (
        <video
          ref={videoElementRef}
          src={customVideoUrl}
          className="hidden"
          muted
          playsInline
        />
      )}

      {/* Top Source Selector Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 shrink-0">
            Source Animation:
          </span>

          {SAMPLE_VIDEOS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => {
                setCustomVideoUrl(null);
                setSelectedSampleId(sample.id);
                setCurrentFrameIdx(0);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                !customVideoUrl && selectedSampleId === sample.id
                  ? 'border border-amber-500/40 bg-amber-500/15 text-amber-300 font-semibold'
                  : 'border border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {sample.name}
            </button>
          ))}
        </div>

        {/* Upload Custom Video Button */}
        <label className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-colors cursor-pointer shrink-0">
          <Upload className="h-3.5 w-3.5 text-amber-400" />
          <span>{customVideoName ? `File: ${customVideoName.slice(0, 16)}...` : 'Upload Video / GIF'}</span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/ogg,image/gif"
            className="hidden"
            onChange={handleFileUpload}
          />
        </label>
      </div>

      {/* Main Studio Viewport: Video Preview & Parameter Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Monitor & Scrubber (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
            {/* View Mode Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-200">
                  NES 2C02 PPU Viewport
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  {settings.width}×{settings.height} px
                </span>
              </div>

              <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
                <button
                  onClick={() => setSplitViewMode('split')}
                  className={`rounded px-2.5 py-0.5 text-xs font-medium transition-all ${
                    splitViewMode === 'split' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400'
                  }`}
                >
                  Side by Side
                </button>
                <button
                  onClick={() => setSplitViewMode('quantized')}
                  className={`rounded px-2.5 py-0.5 text-xs font-medium transition-all ${
                    splitViewMode === 'quantized' ? 'bg-amber-500 text-neutral-950 font-semibold' : 'text-neutral-400'
                  }`}
                >
                  2bpp NES
                </button>
                <button
                  onClick={() => setSplitViewMode('original')}
                  className={`rounded px-2.5 py-0.5 text-xs font-medium transition-all ${
                    splitViewMode === 'original' ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400'
                  }`}
                >
                  Source
                </button>
              </div>
            </div>

            {/* Display Viewport */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-neutral-800 bg-black flex items-center justify-center">
              {splitViewMode === 'split' ? (
                <div className="grid grid-cols-2 w-full h-full divide-x divide-neutral-800">
                  <div className="relative flex flex-col items-center justify-center p-2 bg-neutral-950">
                    <span className="absolute top-2 left-2 z-10 text-[10px] font-mono bg-neutral-900/80 px-2 py-0.5 rounded text-neutral-400">
                      SOURCE
                    </span>
                    <canvas
                      ref={originalCanvasRef}
                      width={settings.width}
                      height={settings.height}
                      className="max-h-full max-w-full object-contain image-rendering-pixelated shadow-lg"
                    />
                  </div>

                  <div className="relative flex flex-col items-center justify-center p-2 bg-black">
                    <span className="absolute top-2 left-2 z-10 text-[10px] font-mono bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded text-amber-300 font-semibold">
                      NES 2C02 (2bpp)
                    </span>
                    <canvas
                      ref={quantizedCanvasRef}
                      width={settings.width}
                      height={settings.height}
                      className="max-h-full max-w-full object-contain image-rendering-pixelated shadow-lg"
                    />
                  </div>
                </div>
              ) : splitViewMode === 'quantized' ? (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  <span className="absolute top-3 left-3 z-10 text-[10px] font-mono bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded text-amber-300 font-semibold">
                    NES 2C02 QUANTIZED
                  </span>
                  <canvas
                    ref={quantizedCanvasRef}
                    width={settings.width}
                    height={settings.height}
                    className="max-h-full max-w-full object-contain image-rendering-pixelated shadow-2xl"
                  />
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                  <span className="absolute top-3 left-3 z-10 text-[10px] font-mono bg-neutral-900/80 px-2 py-0.5 rounded text-neutral-400">
                    ORIGINAL SOURCE
                  </span>
                  <canvas
                    ref={originalCanvasRef}
                    width={settings.width}
                    height={settings.height}
                    className="max-h-full max-w-full object-contain image-rendering-pixelated shadow-2xl"
                  />
                </div>
              )}
            </div>

            {/* Playback & Frame Scrubber */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="text-amber-400 font-semibold">
                    Frame {currentFrameIdx + 1}
                  </span>
                  <span>/ {extractedFrames.length || activeSample.durationFrames}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{(currentFrameData?.timestamp || 0).toFixed(2)}s</span>
                  <span className="text-neutral-600">·</span>
                  <span>{activeSample.fps} FPS</span>
                </div>
              </div>

              {/* Progress Scrubber */}
              <input
                type="range"
                min={0}
                max={Math.max(0, extractedFrames.length - 1)}
                value={currentFrameIdx}
                onChange={(e) => {
                  setIsPlaying(false);
                  setCurrentFrameIdx(parseInt(e.target.value, 10));
                }}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
              />

              {/* Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentFrameIdx((p) => Math.max(0, p - 1));
                    }}
                    className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors"
                    title="Previous Frame"
                  >
                    <SkipBack className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-sm"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span>{isPlaying ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentFrameIdx((p) => (p + 1) % Math.max(1, extractedFrames.length));
                    }}
                    className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 transition-colors"
                    title="Next Frame"
                  >
                    <SkipForward className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Speed:</span>
                  {[0.5, 1.0, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      onClick={() => setPlaybackSpeed(s)}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-all ${
                        playbackSpeed === s
                          ? 'bg-neutral-800 text-amber-400 font-semibold'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Hardware Telemetry Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <span className="text-[11px] text-neutral-400 block">Unique 8x8 Tiles</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-mono font-bold text-neutral-100 tabular-nums">
                  {uniqueCount}
                </span>
                <span className="text-xs font-mono text-neutral-500">/ 960</span>
              </div>
              <span className="text-[10px] text-neutral-500">Pattern table footprint</span>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <span className="text-[11px] text-neutral-400 block">Deduplication Ratio</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-mono font-bold text-emerald-400 tabular-nums">
                  {compressionRatio}%
                </span>
                <span className="text-xs font-mono text-neutral-500">saved</span>
              </div>
              <span className="text-[10px] text-neutral-500">Nametable efficiency</span>
            </div>

            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <span className="text-[11px] text-neutral-400 block">CHR Bank Usage</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-mono font-bold text-amber-400 tabular-nums">
                  {Math.max(1, Math.ceil(uniqueCount / 512))} Bank
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  ({Math.max(1, Math.ceil(uniqueCount / 512)) * 8} KB)
                </span>
              </div>
              <span className="text-[10px] text-neutral-500">512 tiles per 8KB bank</span>
            </div>
          </div>
        </div>

        {/* Right: Quantization & Palette Tuning Deck (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active 4-Color Subpalette Deck */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-neutral-100">
                  Active 4-Color NES Subpalette
                </h3>
              </div>
              <span className="text-xs text-neutral-500">NES 2C02 PPU</span>
            </div>

            <p className="text-xs text-neutral-400">
              Color 0 acts as the universal backdrop; Colors 1, 2, and 3 define the foreground
              shades for the 2bpp bitplanes. Click any swatch to select from the 64 NES colors.
            </p>

            {/* 4 Swatches */}
            <div className="grid grid-cols-4 gap-2">
              {settings.selectedPalette.map((colorIdx, slot) => {
                const color = getNesColor(colorIdx);
                const isSelected = colorPickerSlot === slot;

                return (
                  <button
                    key={slot}
                    onClick={() => setColorPickerSlot(isSelected ? null : slot)}
                    className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/30 bg-neutral-800'
                        : 'border-neutral-800 bg-neutral-950 hover:border-neutral-700'
                    }`}
                  >
                    <div
                      className="w-full h-8 rounded border border-neutral-700 shadow-inner"
                      style={{ backgroundColor: color.hexColor }}
                    />
                    <span className="mt-1 text-[10px] font-mono font-semibold text-neutral-300">
                      Color {slot}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400">
                      {color.hexIndex}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Interactive 64-Color Matrix Popup when slot clicked */}
            {colorPickerSlot !== null && (
              <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-400">
                    Pick NES Color for Slot {colorPickerSlot}
                  </span>
                  <button
                    onClick={() => setColorPickerSlot(null)}
                    className="text-neutral-500 hover:text-neutral-300"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-16 gap-1 p-1 bg-neutral-900 rounded max-h-48 overflow-y-auto">
                  {NES_MASTER_PALETTE.map((nc) => (
                    <button
                      key={nc.index}
                      onClick={() => handlePaletteColorChange(colorPickerSlot, nc.index)}
                      className="group relative h-6 w-full rounded border border-neutral-800 hover:scale-125 hover:z-20 hover:border-white transition-transform"
                      style={{ backgroundColor: nc.hexColor }}
                      title={`${nc.hexIndex}: ${nc.name}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quick Palette Presets */}
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <span className="text-xs font-medium text-neutral-300">Curated NES Presets</span>
              <div className="grid grid-cols-2 gap-2">
                {PALETTE_PRESETS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => onUpdateSettings({ ...settings, selectedPalette: preset.colors })}
                    className="flex items-center justify-between p-2 rounded-lg border border-neutral-800 bg-neutral-950/80 hover:border-neutral-700 text-left transition-colors"
                  >
                    <div>
                      <div className="text-xs font-medium text-neutral-200">{preset.name}</div>
                      <div className="text-[10px] text-neutral-500 truncate">{preset.colors.map(c => `$${c.toString(16).padStart(2,'0')}`).join(' ')}</div>
                    </div>
                    <div className="flex -space-x-1 shrink-0">
                      {preset.colors.map((c, i) => (
                        <div
                          key={i}
                          className="h-4 w-4 rounded-full border border-neutral-900"
                          style={{ backgroundColor: getNesColor(c).hexColor }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Dithering & Signal Processing */}
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-neutral-100">
                Quantization & Dithering Engine
              </h3>
            </div>

            {/* Dither Algorithm Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Dithering Method</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'floyd_steinberg', label: 'Floyd-Steinberg' },
                  { id: 'atkinson', label: 'Atkinson (GB/Mac)' },
                  { id: 'bayer_4x4', label: 'Bayer 4×4 Matrix' },
                  { id: 'none', label: 'Crisp Threshold' },
                ].map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onUpdateSettings({ ...settings, dither: d.id as DitherAlgorithm })}
                    className={`rounded-lg py-1.5 px-2 text-xs font-medium text-center transition-all ${
                      settings.dither === d.id
                        ? 'border border-amber-500/50 bg-amber-500/20 text-amber-300 font-semibold'
                        : 'border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sliders: Dither Strength, Brightness, Contrast, Gamma */}
            <div className="space-y-3 pt-2">
              {settings.dither !== 'none' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Dither Error Diffusion</span>
                    <span className="font-mono text-amber-400">{Math.round(settings.ditherStrength * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={settings.ditherStrength}
                    onChange={(e) => onUpdateSettings({ ...settings, ditherStrength: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Brightness</span>
                    <span className="font-mono text-neutral-300">{settings.brightness}</span>
                  </div>
                  <input
                    type="range"
                    min={-80}
                    max={80}
                    value={settings.brightness}
                    onChange={(e) => onUpdateSettings({ ...settings, brightness: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-400">Contrast</span>
                    <span className="font-mono text-neutral-300">{settings.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min={-80}
                    max={100}
                    value={settings.contrast}
                    onChange={(e) => onUpdateSettings({ ...settings, contrast: parseInt(e.target.value, 10) })}
                    className="w-full accent-amber-500 cursor-pointer h-1.5 bg-neutral-800 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.invert}
                    onChange={(e) => onUpdateSettings({ ...settings, invert: e.target.checked })}
                    className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span>Invert Video Signal</span>
                </label>

                <button
                  onClick={() =>
                    onUpdateSettings({
                      ...settings,
                      brightness: 0,
                      contrast: 0,
                      gamma: 1.0,
                      invert: false,
                      ditherStrength: 0.85,
                    })
                  }
                  className="text-xs text-neutral-500 hover:text-neutral-300 underline"
                >
                  Reset Adjustments
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function drawMediaToCanvas(
  ctx: CanvasRenderingContext2D,
  media: CanvasImageSource,
  sWidth: number,
  sHeight: number,
  dWidth: number,
  dHeight: number,
  mode: 'fill' | 'fit_letterbox' | 'center_crop'
) {
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, dWidth, dHeight);

  if (mode === 'fill') {
    ctx.drawImage(media, 0, 0, dWidth, dHeight);
  } else if (mode === 'fit_letterbox') {
    const sRatio = sWidth / sHeight;
    const dRatio = dWidth / dHeight;

    let targetW = dWidth;
    let targetH = dHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (sRatio > dRatio) {
      targetH = dWidth / sRatio;
      offsetY = (dHeight - targetH) / 2;
    } else {
      targetW = dHeight * sRatio;
      offsetX = (dWidth - targetW) / 2;
    }

    ctx.drawImage(media, offsetX, offsetY, targetW, targetH);
  } else {
    // center_crop
    const sRatio = sWidth / sHeight;
    const dRatio = dWidth / dHeight;

    let sx = 0;
    let sy = 0;
    let sw = sWidth;
    let sh = sHeight;

    if (sRatio > dRatio) {
      sw = sHeight * dRatio;
      sx = (sWidth - sw) / 2;
    } else {
      sh = sWidth / dRatio;
      sy = (sHeight - sh) / 2;
    }

    ctx.drawImage(media, sx, sy, sw, sh, 0, 0, dWidth, dHeight);
  }
}
