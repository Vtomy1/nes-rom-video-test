import React, { useState, useEffect, useRef } from 'react';
import { ExtractedFrame } from '../types/nes';
import { Tv, Monitor, Sliders, Play, Pause, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface CrtMonitorProps {
  currentFrame?: ExtractedFrame;
  totalFrames: number;
  currentFrameIdx: number;
  onSeekFrame: (idx: number) => void;
  fps: number;
  width: number;
  height: number;
}

export const CrtMonitor: React.FC<CrtMonitorProps> = ({
  currentFrame,
  totalFrames,
  currentFrameIdx,
  onSeekFrame,
  fps,
  width,
  height,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showScanlines, setShowScanlines] = useState<boolean>(true);
  const [showCurvature, setShowCurvature] = useState<boolean>(true);
  const [showPhosphorBloom, setShowPhosphorBloom] = useState<boolean>(true);
  const [parCorrect, setParCorrect] = useState<boolean>(true); // 8:7 NTSC Pixel Aspect Ratio
  const [scale, setScale] = useState<number>(2); // 1x, 2x, 3x

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || totalFrames === 0) return;

    const interval = 1000 / fps;
    const tick = (time: number) => {
      if (time - lastTimeRef.current >= interval) {
        lastTimeRef.current = time;
        onSeekFrame((currentFrameIdx + 1) % totalFrames);
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, totalFrames, fps, currentFrameIdx, onSeekFrame]);

  // Render quantized canvas to CRT display
  useEffect(() => {
    if (!canvasRef.current || !currentFrame) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(currentFrame.quantizedCanvas, 0, 0);
  }, [currentFrame, width, height]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-neutral-800 bg-neutral-900/60 p-5">
        <div>
          <div className="flex items-center gap-2">
            <Tv className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-semibold text-neutral-100">
              NES 2C02 Virtual CRT Television
            </h2>
            <span className="text-xs font-mono text-neutral-500">·</span>
            <span className="text-xs font-mono text-amber-400">
              Composite Video Simulation
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-400 max-w-2xl">
            Simulates the authentic visual output of a 1985 Nintendo Entertainment System connected
            via RF or RCA composite video to a cathode ray tube display.
          </p>
        </div>

        {/* Video Scrubber & Playback */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-400 transition-colors shadow-sm"
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
        </div>
      </div>

      {/* Main CRT Enclosure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CRT Screen Display (8 cols) */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center rounded-2xl border-4 border-neutral-800 bg-neutral-950 p-6 shadow-2xl relative overflow-hidden">
          {/* Bezel details */}
          <div className="absolute top-2 left-6 text-[10px] font-mono tracking-widest text-neutral-600 uppercase">
            SOLID STATE COLOR RECEIVER · 2C02 NTSC
          </div>

          <div
            className={`relative overflow-hidden transition-all duration-300 border border-neutral-800 shadow-inner ${
              showCurvature ? 'rounded-2xl' : 'rounded-none'
            }`}
            style={{
              width: `${width * scale}px`,
              maxWidth: '100%',
              aspectRatio: parCorrect ? '8 / 7' : `${width} / ${height}`,
              boxShadow: showPhosphorBloom ? '0 0 50px rgba(255, 170, 0, 0.15)' : 'none',
            }}
          >
            {/* The Raw Pixel Canvas */}
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              className="w-full h-full object-fill image-rendering-pixelated"
            />

            {/* Scanlines Overlay */}
            {showScanlines && (
              <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
                  backgroundSize: '100% 4px, 6px 100%',
                }}
              />
            )}

            {/* Curved Glass Vignette Reflection */}
            {showCurvature && (
              <div
                className="pointer-events-none absolute inset-0 z-20"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 65%, rgba(0, 0, 0, 0.6) 100%)',
                }}
              />
            )}
          </div>

          {/* Bottom CRT badge */}
          <div className="mt-4 flex items-center justify-between w-full max-w-md px-4 text-xs font-mono text-neutral-500">
            <span>CH 3 VHF</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-neutral-400">SIGNAL LOCKED</span>
            </div>
            <span>60.098 Hz</span>
          </div>
        </div>

        {/* TV Controls & Settings (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <Sliders className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-100">
              CRT Display Adjustment
            </h3>
          </div>

          {/* Scale Stepper */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300">Display Zoom Level</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 2.5].map((s) => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  className={`rounded-lg py-1.5 text-xs font-mono transition-all ${
                    scale === s
                      ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300 font-semibold'
                      : 'border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {s}× Scale
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
              <span>CRT Scanlines (Interlace)</span>
              <input
                type="checkbox"
                checked={showScanlines}
                onChange={(e) => setShowScanlines(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
              <span>Phosphor Glow & Bloom</span>
              <input
                type="checkbox"
                checked={showPhosphorBloom}
                onChange={(e) => setShowPhosphorBloom(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
              <span>Curved Glass Vignette</span>
              <input
                type="checkbox"
                checked={showCurvature}
                onChange={(e) => setShowCurvature(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-neutral-300 cursor-pointer">
              <span>8:7 NTSC Pixel Aspect Ratio</span>
              <input
                type="checkbox"
                checked={parCorrect}
                onChange={(e) => setParCorrect(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-amber-500 focus:ring-amber-500"
              />
            </label>
          </div>

          <div className="rounded-lg border border-neutral-800/80 bg-neutral-950 p-3 text-xs text-neutral-400 leading-relaxed">
            <span className="font-semibold text-neutral-300 block mb-1">Pixel Aspect Note:</span>
            On standard NTSC televisions, the 256x240 image is stretched slightly to 8:7 pixel aspect
            ratio (4:3 physical CRT screen), ensuring circles appear round rather than squished.
          </div>
        </div>
      </div>
    </div>
  );
};
