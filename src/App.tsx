/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BrainCircuit, 
  Cpu, 
  Blocks, 
  ArrowLeft, 
  Settings, 
  Sparkles, 
  BookOpen, 
  Terminal, 
  CheckCircle2, 
  Activity, 
  ChevronRight, 
  Sliders, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import ParticleCanvas from './components/ParticleCanvas';
import { SECTORS_DATA } from './data';
import { SectorId } from './types';

export default function App() {
  const [activeSector, setActiveSector] = useState<SectorId | null>(null);
  const [selectedDetailedSector, setSelectedDetailedSector] = useState<SectorId | null>(null);
  const [particleDensity, setParticleDensity] = useState<number>(1.2);
  const [dispersionStrength, setDispersionStrength] = useState<number>(1.1);
  const [restingSpread, setRestingSpread] = useState<number>(10.0); // Defaults to 10px organic outline dispersion
  const [isControlModalOpen, setIsControlModalOpen] = useState<boolean>(false);
  const [gridOpacity, setGridOpacity] = useState<number>(0.4);
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1440, 
    height: typeof window !== 'undefined' ? window.innerHeight : 900 
  });

  // Track window resizing for full page dynamic layout
  React.useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const flashlightOverlayRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!flashlightOverlayRef.current) return;
      const rect = flashlightOverlayRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const maskStr = `radial-gradient(circle 220px at ${x}px ${y}px, transparent 0%, black 100%)`;
      flashlightOverlayRef.current.style.maskImage = maskStr;
      flashlightOverlayRef.current.style.webkitMaskImage = maskStr;
    };

    const handleGlobalMouseLeave = () => {
      if (!flashlightOverlayRef.current) return;
      const maskStr = `radial-gradient(circle 220px at -1000px -1000px, transparent 0%, black 100%)`;
      flashlightOverlayRef.current.style.maskImage = maskStr;
      flashlightOverlayRef.current.style.webkitMaskImage = maskStr;
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleGlobalMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
    };
  }, []);

  // Quick reset to restore baseline engine config
  const resetEngine = () => {
    setParticleDensity(1.2);
    setDispersionStrength(1.1);
    setRestingSpread(10.0);
    setGridOpacity(0.4);
  };

  const videoRefs = {
    algorithm: React.useRef<HTMLVideoElement | null>(null),
    ontology: React.useRef<HTMLVideoElement | null>(null),
    application: React.useRef<HTMLVideoElement | null>(null)
  };

  const seekTimeoutRef = React.useRef<any>(null);

  const prevActiveSectorRef = React.useRef<SectorId | null>(null);
  const [firstHoverSector, setFirstHoverSector] = React.useState<SectorId | null>(null);

  React.useEffect(() => {
    if (prevActiveSectorRef.current === null && activeSector !== null) {
      setFirstHoverSector(activeSector);
    } else if (activeSector === null) {
      setFirstHoverSector(null);
    } else {
      setFirstHoverSector(null);
    }
    prevActiveSectorRef.current = activeSector;
  }, [activeSector]);

  // Video playing and pause state synchronization
  React.useEffect(() => {
    // Clear any pending seek timeouts on active transitions
    if (seekTimeoutRef.current) {
      clearTimeout(seekTimeoutRef.current);
      seekTimeoutRef.current = null;
    }

    const playVideo = (id: 'algorithm' | 'ontology' | 'application') => {
      const vid = videoRefs[id].current;
      if (vid) {
        vid.play().catch(() => {});
      }
    };

    const pauseVideoOnly = (id: 'algorithm' | 'ontology' | 'application') => {
      const vid = videoRefs[id].current;
      if (vid) {
        vid.pause();
      }
    };

    const seekToRestingFrame = (id: 'algorithm' | 'ontology' | 'application') => {
      const vid = videoRefs[id].current;
      if (vid) {
        vid.currentTime = id === 'ontology' ? 0.01 : 3.0; // Seek to resting frame
      }
    };

    if (activeSector === 'algorithm') {
      playVideo('algorithm');
      pauseVideoOnly('ontology');
      pauseVideoOnly('application');
    } else if (activeSector === 'ontology') {
      pauseVideoOnly('algorithm');
      playVideo('ontology');
      pauseVideoOnly('application');
    } else if (activeSector === 'application') {
      pauseVideoOnly('algorithm');
      pauseVideoOnly('ontology');
      playVideo('application');
    } else {
      // In default resting state (activeSector === null), pause all videos and debounce seeks
      pauseVideoOnly('algorithm');
      pauseVideoOnly('ontology');
      pauseVideoOnly('application');

      seekTimeoutRef.current = setTimeout(() => {
        seekToRestingFrame('algorithm');
        seekToRestingFrame('ontology');
        seekToRestingFrame('application');
      }, 350);
    }

    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, [activeSector]);

  const getColStyle = (id: 'algorithm' | 'ontology' | 'application') => {
    const isActive = activeSector === id;
    const isAnyActive = activeSector !== null;

    const zIndex = isActive ? 5 : 1;
    const opacity = isActive ? 1.0 : (isAnyActive ? 0.0 : 1.0);

    const maskImage = isActive 
      ? 'none' 
      : (id === 'algorithm' 
          ? 'linear-gradient(to right, black 27.333%, transparent 39.333%)' 
          : (id === 'ontology' 
              ? 'linear-gradient(to right, transparent 27.333%, black 39.333%, black 60.666%, transparent 72.666%)' 
              : 'linear-gradient(to right, transparent 60.666%, black 72.666%)'));

    return {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex,
      opacity,
      maskImage,
      WebkitMaskImage: maskImage,
      overflow: 'hidden',
      transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), z-index 0.7s step-end',
    };
  };

  const getVideoStyle = (id: 'algorithm' | 'ontology' | 'application') => {
    const isActive = activeSector === id;
    const brightness = id === 'application' 
      ? (isActive ? 0.65 : 1.1) 
      : 0.65;
    const filter = `grayscale(0%) brightness(${brightness}) contrast(1.0)`;
    
    const objectPosition = id === 'application' 
      ? (isActive ? 'center' : '90% center') 
      : (id === 'algorithm' 
          ? (isActive ? 'center' : '10% center') 
          : 'center');

    return {
      width: '100%',
      height: '100%',
      objectFit: 'cover' as const,
      objectPosition,
      filter,
      transition: 'filter 0.7s ease, object-position 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
    };
  };

  const currentSectorData = selectedDetailedSector ? SECTORS_DATA[selectedDetailedSector] : null;

  // Symmetrical full-screen grid math to align precisely with center-anchored design
  const scaleFactor = dimensions.width < 1120 ? Math.max(0.5, dimensions.width / 1120) : 1.0;
  const cellSize = 80 * scaleFactor;
  const cardSize = 160 * scaleFactor;
  const cX = dimensions.width / 2;
  const cY = dimensions.height / 2;

  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-gray-100 flex flex-col overflow-hidden">
      
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute inset-0 radial-glow pointer-events-none z-0" />
      
      {/* Primary Header */}
      <header className="relative w-full border-b border-white/5 bg-[#030303]/40 backdrop-blur-md px-6 py-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-xs font-mono tracking-wider text-gray-400">QUANTUM LOGO SYSTEM</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Button to trigger floating engine controls modal */}
          <button 
            onClick={() => setIsControlModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 rounded-lg text-xs font-medium cursor-pointer transition-all duration-300"
            id="btn-open-controls"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>粒子系统设置</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Screen Workspace */}
      <main className="relative flex-1 w-full h-full min-h-[580px] overflow-hidden z-10">
        
        {/* Full-screen absolute workspace */}
        <div className="absolute inset-0 w-full h-full">
          
          {/* Base Background Video Columns Layer */}
          <div className="absolute inset-0 w-full h-full z-1 flex overflow-hidden">
            {/* Column 1: Super Algorithm */}
            <div style={getColStyle('algorithm')}>
              <video
                ref={videoRefs.algorithm}
                src="/asset/超级算法2.mp4"
                muted
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => { e.currentTarget.currentTime = 3.0; }}
                style={getVideoStyle('algorithm')}
                className={firstHoverSector === 'algorithm' ? 'animate-expand-algorithm' : ''}
              />
            </div>

            {/* Column 2: Super Ontology */}
            <div style={getColStyle('ontology')}>
              <video
                ref={videoRefs.ontology}
                src="/asset/超级本体.mp4"
                muted
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => { e.currentTarget.currentTime = 0.01; }}
                style={getVideoStyle('ontology')}
                className={firstHoverSector === 'ontology' ? 'animate-expand-ontology' : ''}
              />
            </div>

            {/* Column 3: Super Application */}
            <div style={getColStyle('application')}>
              <video
                ref={videoRefs.application}
                src="/asset/超级应用.mp4"
                muted
                loop
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => { e.currentTarget.currentTime = 3.0; }}
                style={getVideoStyle('application')}
                className={firstHoverSector === 'application' ? 'animate-expand-application' : ''}
              />
            </div>
          </div>

          {/* Grayscale and Spotlight Overlay for Default State */}
          <div 
            ref={flashlightOverlayRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backdropFilter: 'grayscale(100%)',
              WebkitBackdropFilter: 'grayscale(100%)',
              background: 'rgba(3, 3, 3, 0.8)',
              pointerEvents: 'none',
              zIndex: 9,
              opacity: activeSector ? 0 : 1,
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              maskImage: 'radial-gradient(circle 220px at -1000px -1000px, transparent 0%, black 100%)',
              WebkitMaskImage: 'radial-gradient(circle 220px at -1000px -1000px, transparent 0%, black 100%)',
            }}
          />

          {/* Central Logo Background Vignette Overlay */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at center, rgba(3, 3, 3, 0.92) 0%, rgba(3, 3, 3, 0.45) 40%, rgba(3, 3, 3, 0) 70%)',
              pointerEvents: 'none',
              zIndex: 10,
              opacity: activeSector ? 0.45 : 0.0,
              transition: 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          {/* 2. FULL CANVAS BACKGROUND GRID COVER: Overlays the entire screen workspace */}
          <div 
            style={{ 
              position: 'absolute',
              left: '0px',
              top: '0px',
              width: `${dimensions.width}px`,
              height: `${dimensions.height}px`,
              pointerEvents: 'auto'
            }}
            className="z-20"
          >
            {/* The transparent interactive particle core */}
            <ParticleCanvas 
              activeSector={activeSector}
              onSectorHover={(sector) => setActiveSector(sector)}
              onSectorClick={(sector) => setSelectedDetailedSector(sector)}
              particleDensity={particleDensity}
              dispersionStrength={dispersionStrength}
              restingSpread={restingSpread}
            />
          </div>

          {/* 3. Unified Subtitles display in the bottom-left corner of the screen */}
          {activeSector && (
            <div className="absolute bottom-16 left-12 z-30 pointer-events-none select-none max-w-lg">
              <div className="select-none pointer-events-none transition-all duration-300">
                <h1 className="text-3xl font-extrabold text-white tracking-wide transition-all duration-300">
                  {SECTORS_DATA[activeSector].name}
                </h1>
              </div>
            </div>
          )}

        </div>
        
      </main>

      {/* FLOAT POPUP MODAL: Interactive Particle Configuration controls */}
      {isControlModalOpen && (
        <div className="fixed inset-0 w-full h-full bg-black/80 backdrop-blur-md z-40 flex items-center justify-center p-4 transition-all duration-300">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl relative border-glow">
            
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/5">
              <span className="text-sm font-bold tracking-wider font-mono flex items-center gap-2 text-white">
                <Sliders className="w-4 h-4 text-emerald-400" /> 粒子控制面板 / ENGINE TUNER
              </span>
              <button 
                onClick={() => setIsControlModalOpen(false)}
                className="text-xs bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5 rounded px-2.5 py-1 cursor-pointer transition-colors"
                id="btn-close-controls"
              >
                关闭
              </button>
            </div>

            <div className="space-y-5">
              {/* Slider 1: Particle Density */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                  <span>粒子密度 (Density)</span>
                  <span className="text-white font-semibold">{Math.round(particleDensity * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={particleDensity}
                  onChange={(e) => setParticleDensity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <p className="text-[10px] text-gray-500 font-mono">设置在Canvas画布中的实体点粒子密度采信比例。</p>
              </div>

              {/* Slider 2: Dispersion Offset */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                  <span>弥散波能 (Dispersion Intensity)</span>
                  <span className="text-white font-semibold">{Math.round(dispersionStrength * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.4"
                  max="2.5"
                  step="0.1"
                  value={dispersionStrength}
                  onChange={(e) => setDispersionStrength(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <p className="text-[10px] text-gray-500 font-mono">设置粒子在静息呼吸及外部触碰触发时的分散尺度。</p>
              </div>

              {/* Slider 2.5: Resting Spread */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                  <span>静息描边分散度 (Resting Jitter)</span>
                  <span className="text-white font-semibold">{restingSpread.toFixed(1)}px</span>
                </div>
                <input 
                  type="range"
                  min="2.0"
                  max="40.0"
                  step="0.5"
                  value={restingSpread}
                  onChange={(e) => setRestingSpread(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <p className="text-[10px] text-gray-500 font-mono">控制粒子默认聚集在Logo描边边缘时的松散度和偏离抖动范围。</p>
              </div>

              {/* Slider 3: Grid Transparency */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                  <span>背景网格不透明度 (Grid Opacity)</span>
                  <span className="text-white font-semibold">{Math.round(gridOpacity * 100)}%</span>
                </div>
                <input 
                  type="range"
                  min="0.0"
                  max="0.8"
                  step="0.05"
                  value={gridOpacity}
                  onChange={(e) => setGridOpacity(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <p className="text-[10px] text-gray-500 font-mono">更改科幻格栅网格的反光不透明度比例。</p>
              </div>
            </div>

            {/* Modal Bottom Reset */}
            <div className="mt-6 pt-4 border-t border-white/5 flex gap-3">
              <button 
                onClick={resetEngine}
                className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium font-mono text-gray-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>还原引擎预设</span>
              </button>
              <button 
                onClick={() => setIsControlModalOpen(false)}
                className="flex-1 py-1.5 rounded-lg bg-white hover:bg-white/90 text-black text-xs font-medium transition-all cursor-pointer"
              >
                保 存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN DETAIL TERMINAL MODE (Activated when a grid sector is clicked/selected for landing details) */}
      {selectedDetailedSector && currentSectorData && (
        <div className="fixed inset-0 bg-black/95 z-55 flex flex-col p-6 overflow-y-auto animate-fade-in transition-all duration-300">
          
          {/* Detail Sub Header */}
          <div className="max-w-6xl w-full mx-auto flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <button 
              onClick={() => setSelectedDetailedSector(null)}
              className="flex items-center gap-2 text-xs font-medium bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg px-4 py-2 hover:text-white transition-all duration-200 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回粒子控制网格</span>
            </button>
            
            <div className="flex items-center gap-2 font-mono text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>SECURE CONTEXT / COGNITIVE TUNNEL</span>
            </div>
          </div>

          {/* Core Spec Sheet & Dynamic Visual Dashboard */}
          <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start my-auto">
            
            {/* Visual Media Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl h-[300px] md:h-[400px]">
                <img 
                  src={currentSectorData.imageUrl} 
                  alt={currentSectorData.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full border border-white/15 backdrop-blur-md flex items-center gap-1 text-[10px] text-white">
                  <Activity className="w-3 h-3 text-emerald-400" />
                  <span>实时具身追踪已就绪</span>
                </div>
                
                {/* Visual Label overlay */}
                <div className="absolute bottom-4 left-6 right-6">
                  <h3 className="text-sm font-mono text-white/50">{currentSectorData.id.toUpperCase()}_UNIT_ALPHA</h3>
                  <h2 className="text-xl font-bold text-white tracking-widest">{currentSectorData.name}</h2>
                </div>
              </div>

              {/* Embedded Interactive Code sandbox layout widget to represent simulated terminal log */}
              <div className="bg-[#0b0b0b] border border-white/5 rounded-xl p-4 font-mono text-xs text-gray-400">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> SYSTEM STACK LOGGER</span>
                  <span className="text-[9px] text-[#444]">SPEED: 1.2 GB/S</span>
                </div>
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <p className="text-gray-500">{"[08:16:33] INITIALIZING CLUSTERING AGENT..."}</p>
                  <p className="text-emerald-500">{"[08:16:34] KNOWLEDGE NEURON COMPILING SUCCESSFULLY"}</p>
                  <p className="text-gray-500">{"[08:16:36] PIPELINE ROUTING: [AETHER] -> [LOCAL_NODE_0]"}</p>
                  <p className="text-blue-400">{"[08:16:37] CORE_CALIBRATOR PARAMETERS: OPTIMIZED"}</p>
                </div>
              </div>
            </div>

            {/* Spec details descriptions */}
            <div className="lg:col-span-7 space-y-6">
              
              <div>
                <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase font-semibold">{currentSectorData.subtitle}</span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">{currentSectorData.title}</h1>
                <p className="text-sm text-gray-400 mt-3 leading-relaxed">{currentSectorData.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Specifics list */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-white tracking-wider font-mono">研发技术指标 Specs</h3>
                  <ul className="space-y-2 text-xs text-gray-400">
                    {currentSectorData.details.specs.map((spec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key capabilities */}
                <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-3">
                  <h3 className="text-xs font-bold text-white tracking-wider font-mono">核心赋能 Capabilities</h3>
                  <ul className="space-y-2 text-xs text-gray-400">
                    {currentSectorData.details.capabilities.map((cap, i) => (
                      <li key={i} className="flex items-start gap-2 text-glow">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70 mt-1.5 shrink-0" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Benchmarks (Bar Chart rendering using Tailwind CSS grids!) */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-5 space-y-4">
                <h3 className="text-xs font-bold text-white tracking-wider font-mono">性能跑分测试 Benchmarks</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {currentSectorData.details.benchmarks.map((bench, i) => (
                    <div key={i} className="bg-[#0c0c0c] border border-white/5 rounded-lg p-3.5 flex flex-col justify-between">
                      <span className="text-[10px] text-gray-500 font-mono uppercase">{bench.label}</span>
                      <span className="text-2xl font-black text-white text-glow tracking-tight mt-1">{bench.value}</span>
                      <div className="w-full bg-white/10 h-1 rounded overflow-hidden mt-2">
                        <div 
                          className="bg-white h-full" 
                          style={{ width: bench.value.includes('%') ? bench.value : '75%' }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Industry Use cases */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-white tracking-wider font-mono">落地解决方案 Industry Use-cases</h3>
                <div className="space-y-2">
                  {currentSectorData.details.useCases.map((useCase, i) => (
                    <div key={i} className="bg-[#0b0b0b] hover:bg-white/5 border border-white/5 hover:border-white/10 rounded-xl p-3 flex items-center justify-between transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded bg-white/10 text-white font-mono text-[10px] font-bold flex items-center justify-center">0{i+1}</span>
                        <span className="text-xs text-gray-300">{useCase}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Decorative Outer footer credits strictly minimal */}
      <footer className="relative w-full py-4 text-center text-[10px] text-gray-600 font-mono border-t border-white/5 z-20">
        AETHER QUANTUM CORE WORKSPACE © 2026. IMPLEMENTED FOR MULTI-DIMENSIONAL LOGO DISPERSION.
      </footer>

    </div>
  );
}
