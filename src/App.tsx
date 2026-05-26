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
  ChevronDown,
  Sliders, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import ParticleCanvas from './components/ParticleCanvas';
import { SECTORS_DATA } from './data';
import { SectorId } from './types';

export default function App() {
  const [activeSector, setActiveSector] = useState<SectorId | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<'algorithm' | 'ontology' | 'application' | null>(null);
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

  // Outside click handler to close dropdown when clicking off the header/menu
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Mobile: click outside canvas deactivates active state
      const isMobile = window.innerWidth < 1200;
      if (isMobile) {
        if (target.closest('canvas')) return;
        if (activeSector !== null) {
          setActiveSector(null);
        }
        return;
      }

      // If no dropdown is open, nothing to do
      if (!activeDropdown) return;

      // Check if click is inside the active dropdown's panel
      const activePanel = document.querySelector(`.dropdown-panel-${activeDropdown}`);
      if (activePanel && activePanel.contains(target)) {
        return;
      }

      // Check if click is on the header button corresponding to the active dropdown
      const activeHeaderButton = document.querySelector(`.header-btn-${activeDropdown}`);
      if (activeHeaderButton && activeHeaderButton.contains(target)) {
        return;
      }

      // If clicked the canvas, let ParticleCanvas handle it
      if (target.closest('canvas')) {
        return;
      }

      // For any other click (e.g. empty space in header, logo in header, outside space), close the dropdown
      setActiveDropdown(null);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [activeDropdown, activeSector]);

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

    const isMobile = dimensions.width < 1200;

    const zIndex = isActive ? 5 : 1;
    const opacity = isMobile ? (isActive ? 1.0 : 0.0) : (isActive ? 1.0 : (isAnyActive ? 0.0 : 1.0));

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



  // Symmetrical full-screen grid math to align precisely with center-anchored design
  const scaleFactor = dimensions.width < 1120 ? Math.max(0.5, dimensions.width / 1120) : 1.0;
  const boundaryPadding = dimensions.width >= 1440 ? 240 : 48;
  const cellSize = 80 * scaleFactor;
  const cardSize = 160 * scaleFactor;
  const cX = dimensions.width / 2;
  const cY = dimensions.height / 2;

  return (
    <div className="relative min-h-screen w-full bg-[#030303] text-gray-100 flex flex-col overflow-hidden">
      
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute inset-0 radial-glow pointer-events-none z-0" />
      
      {/* Primary Header */}
      <header 
        className="absolute top-0 left-0 w-full h-14 min-h-[56px] z-30 transition-all duration-300"
      >
        {/* Header background blur layer (only blurs the 56px area) to avoid nested backdrop-filter browser rendering bug */}
        <div className="absolute inset-0 bg-transparent backdrop-blur-xl border-b border-white/10 pointer-events-none -z-10" />
        <nav className="mx-auto flex h-full max-w-[2560px] items-center justify-between px-4 sm:px-6 md:px-8 xl:px-12 min-[1440px]:px-[240px]">
          {/* Left branding - official logo made white via CSS filter */}
          <div className="flex items-center" onMouseEnter={() => { if (activeDropdown) setActiveDropdown(null); }}>
            <a 
              href="https://www-dev.tars-ai.com/zh/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative z-10 flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050b5] focus-visible:ring-offset-2"
            >
              <img 
                alt="TARS Logo" 
                className="h-6 w-auto max-w-[120px] transition-all duration-300 filter brightness-0 invert" 
                src="/asset/tarslogo.svg"
              />
            </a>
          </div>

          {/* Center Navigation Links with hover mega menus */}
          <div className="hidden min-[1200px]:flex items-center justify-center flex-1 mx-8">
            <div className="flex max-w-full flex-nowrap items-center justify-center gap-4">
              
              {/* Menu Item 1: 超级算法 */}
              <div 
                className="relative group py-4"
                onMouseEnter={() => { if (activeDropdown) setActiveDropdown('algorithm'); }}
              >
                <button 
                  type="button" 
                  className={`header-btn-algorithm inline-flex shrink-0 items-center rounded-[2px] px-3 py-1 text-[14px] font-bold leading-5 whitespace-nowrap transition-colors touch-manipulation focus-visible:outline-none cursor-pointer ${
                    activeDropdown === 'algorithm' ? 'text-[#0050b5]' : 'text-white hover:text-[#0050b5]'
                  }`}
                  onClick={() => setActiveDropdown(activeDropdown === 'algorithm' ? null : 'algorithm')}
                >
                  <span>超级算法</span>
                </button>
                {/* Mega Menu Panel - Frosted Glassmorphism */}
                <div className={`dropdown-panel-algorithm fixed inset-x-0 top-14 left-0 right-0 w-full bg-transparent backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-200 z-50 ${activeDropdown === 'algorithm' ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'}`}>
                  <div className="mx-auto max-w-[2560px] px-4 pb-10 pt-6 sm:px-6 md:px-8 xl:px-12 min-[1440px]:px-[240px]">
                    {/* Grid of links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
                      <a 
                        href="https://www-dev.tars-ai.com/zh/technology/awe/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">AWE 3.5 AI世界引擎</div>
                        <div className="text-[12px] text-gray-400 mt-1">自研多模态人工智能模型，为具身智能机器人赋予强大脑力。</div>
                      </a>
                      <a 
                        href="https://www-dev.tars-ai.com/zh/products/wiyh/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">WIYH 数据集</div>
                        <div className="text-[12px] text-gray-400 mt-1">包含大量关节轨迹与触觉数据的离线数据集，打通训练闭环。</div>
                      </a>
                      <a 
                        href="https://www-dev.tars-ai.com/zh/products/sense-hub/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">SenseHub</div>
                        <div className="text-[12px] text-gray-400 mt-1">高精度视触觉多模态传感器系统，赋予细腻物理接触理解。</div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Item 2: 超级本体 */}
              <div 
                className="relative group py-4"
                onMouseEnter={() => { if (activeDropdown) setActiveDropdown('ontology'); }}
              >
                <button 
                  type="button" 
                  className={`header-btn-ontology inline-flex shrink-0 items-center rounded-[2px] px-3 py-1 text-[14px] font-bold leading-5 whitespace-nowrap transition-colors touch-manipulation focus-visible:outline-none cursor-pointer ${
                    activeDropdown === 'ontology' ? 'text-[#0050b5]' : 'text-white hover:text-[#0050b5]'
                  }`}
                  onClick={() => setActiveDropdown(activeDropdown === 'ontology' ? null : 'ontology')}
                >
                  <span>超级本体</span>
                </button>
                {/* Mega Menu Panel - Frosted Glassmorphism */}
                <div className={`dropdown-panel-ontology fixed inset-x-0 top-14 left-0 right-0 w-full bg-transparent backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-200 z-50 ${activeDropdown === 'ontology' ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'}`}>
                  <div className="mx-auto max-w-[2560px] px-4 pb-10 pt-6 sm:px-6 md:px-8 xl:px-12 min-[1440px]:px-[240px]">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full text-left">
                      <a 
                        href="https://www-dev.tars-ai.com/zh/products/a-series/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">A系列机器人</div>
                        <div className="text-[12px] text-gray-400 mt-1">全尺寸双足人形机器人，高自由度与卓越运动平衡。</div>
                      </a>
                      <a 
                        href="https://www-dev.tars-ai.com/zh/products/t-series/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">T系列机器人</div>
                        <div className="text-[12px] text-gray-400 mt-1">轮足式具身智能机器人，多地形快速移动与高效执行。</div>
                      </a>
                      <a 
                        href="https://www-dev.tars-ai.com/zh/products/tars-dex/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">Tars DexHand</div>
                        <div className="text-[12px] text-gray-400 mt-1">仿生高自由度灵巧手，支持高精度触觉与精细手内操作。</div>
                      </a>
                      <a 
                        href="https://www-dev.tars-ai.com/zh/products/joints/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">Tars Drive 灵巧关节</div>
                        <div className="text-[12px] text-gray-400 mt-1">机器人专用高性能动力关节，大扭矩与高响应速度。</div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Item 3: 超级应用 */}
              <div 
                className="relative group py-4"
                onMouseEnter={() => { if (activeDropdown) setActiveDropdown('application'); }}
              >
                <button 
                  type="button" 
                  className={`header-btn-application inline-flex shrink-0 items-center rounded-[2px] px-3 py-1 text-[14px] font-bold leading-5 whitespace-nowrap transition-colors touch-manipulation focus-visible:outline-none cursor-pointer ${
                    activeDropdown === 'application' ? 'text-[#0050b5]' : 'text-white hover:text-[#0050b5]'
                  }`}
                  onClick={() => setActiveDropdown(activeDropdown === 'application' ? null : 'application')}
                >
                  <span>超级应用</span>
                </button>
                {/* Mega Menu Panel - Frosted Glassmorphism */}
                <div className={`dropdown-panel-application fixed inset-x-0 top-14 left-0 right-0 w-full bg-transparent backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-200 z-50 ${activeDropdown === 'application' ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto'}`}>
                  <div className="mx-auto max-w-[2560px] px-4 pb-10 pt-6 sm:px-6 md:px-8 xl:px-12 min-[1440px]:px-[240px]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
                      <a 
                        href="https://www-dev.tars-ai.com/zh/products/awr/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">AWR</div>
                        <div className="text-[12px] text-gray-400 mt-1">具身智能机器人应用系统，支持多行业定制化场景部署。</div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Item 4: 关于我们 */}
              <div 
                className="relative group py-4"
                onMouseEnter={() => { if (activeDropdown) setActiveDropdown(null); }}
              >
                <button type="button" className="inline-flex shrink-0 items-center rounded-[2px] px-3 py-1 text-[14px] font-bold leading-5 whitespace-nowrap transition-colors touch-manipulation focus-visible:outline-none text-white hover:text-[#0050b5] cursor-pointer">
                  <span>关于我们</span>
                </button>
                {/* Mega Menu Panel - Frosted Glassmorphism */}
                <div className="fixed inset-x-0 top-14 left-0 right-0 w-full bg-transparent backdrop-blur-xl border-b border-white/10 shadow-2xl transition-all duration-200 opacity-0 pointer-events-none -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto z-50">
                  <div className="mx-auto max-w-[2560px] px-4 pb-10 pt-6 sm:px-6 md:px-8 xl:px-12 min-[1440px]:px-[240px]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
                      <a 
                        href="https://www-dev.tars-ai.com/zh/about/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">公司介绍</div>
                        <div className="text-[12px] text-gray-400 mt-1">了解 TARS 的核心使命、发展历程与团队风采。</div>
                      </a>
                      <a 
                        href="https://www-dev.tars-ai.com/zh/contact/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">联系我们</div>
                        <div className="text-[12px] text-gray-400 mt-1">商业洽谈与技术合作通道，期待您的联络。</div>
                      </a>
                      <a 
                        href="https://tarsrobot.jobs.feishu.cn/index" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group/item block p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/5 transition-all duration-200"
                      >
                        <div className="font-bold text-[14px] text-white group-hover/item:text-[#0050b5] transition-colors">加入我们</div>
                        <div className="text-[12px] text-gray-400 mt-1">诚邀科技与创新英才，共绘具身智能的美好蓝图。</div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Item 5: 新闻中心 */}
              <a 
                href="https://www-dev.tars-ai.com/zh/news/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex shrink-0 items-center rounded-[2px] px-3 py-1 text-[14px] font-bold leading-5 whitespace-nowrap transition-colors touch-manipulation focus-visible:outline-none text-white hover:text-[#0050b5] cursor-pointer"
                onMouseEnter={() => { if (activeDropdown) setActiveDropdown(null); }}
              >
                新闻中心
              </a>

            </div>
          </div>

          {/* Right Spacer of equal width to left logo to maintain perfect visual center */}
          <div className="hidden min-[1200px]:block w-[120px]" onMouseEnter={() => { if (activeDropdown) setActiveDropdown(null); }}></div>
        </nav>
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
              background: 'rgba(3, 3, 3, 0.9)',
              pointerEvents: 'none',
              zIndex: 9,
              opacity: (dimensions.width < 1200) ? 0 : (activeSector ? 0 : 1),
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
              onSectorHover={(sector) => {
                if (typeof window === 'undefined' || window.innerWidth >= 1200) {
                  setActiveSector(sector);
                }
              }}
              onSectorClick={(sector, clickedOnShape) => {
                const isMobile = typeof window !== 'undefined' && window.innerWidth < 1200;
                if (isMobile) {
                  if (clickedOnShape && sector !== null) {
                    setActiveSector(activeSector === sector ? null : sector);
                  } else {
                    setActiveSector(null);
                  }
                } else {
                  if (sector !== null) {
                    setActiveDropdown(activeDropdown === sector ? null : sector);
                  }
                }
              }}
              particleDensity={particleDensity}
              dispersionStrength={dispersionStrength}
              restingSpread={restingSpread}
            />
          </div>

          {/* 3. Unified Subtitles / Guiding Line layout */}
          {activeSector && (
            <>
              {/* Desktop view (>= 1200px) */}
              <div className="hidden min-[1200px]:block">
                {activeSector === 'algorithm' && (
                  <div 
                    style={{
                      position: 'absolute',
                      left: `${boundaryPadding}px`,
                      top: `calc(50% - ${20 * scaleFactor}px)`,
                      width: `calc(50vw - ${boundaryPadding}px - ${130 * scaleFactor}px)`,
                      transform: 'translateY(-50%)',
                    }}
                    className="z-30 transition-all duration-300 select-none pointer-events-none"
                  >
                    <div className="text-left">
                      <h1 className="text-3xl font-semibold text-white tracking-wide mb-2">
                        超级算法
                      </h1>
                      <div className="h-[1px] bg-white/40 w-full" />
                    </div>
                  </div>
                )}

                {activeSector === 'ontology' && (
                  <div 
                    style={{
                      position: 'absolute',
                      right: `${boundaryPadding}px`,
                      top: `calc(50% - ${140 * scaleFactor}px)`,
                      width: `calc(50vw - ${boundaryPadding}px - ${135 * scaleFactor}px)`,
                      transform: 'translateY(-50%)',
                    }}
                    className="z-30 transition-all duration-300 select-none pointer-events-none"
                  >
                    <div className="text-right flex flex-col items-end">
                      <h1 className="text-3xl font-semibold text-white tracking-wide mb-2">
                        超级本体
                      </h1>
                      <div className="h-[1px] bg-white/40 w-full" />
                    </div>
                  </div>
                )}

                {activeSector === 'application' && (
                  <div 
                    style={{
                      position: 'absolute',
                      right: `${boundaryPadding}px`,
                      top: `calc(50% + ${80 * scaleFactor}px)`,
                      width: `calc(50vw - ${boundaryPadding}px - ${110 * scaleFactor}px)`,
                      transform: 'translateY(-50%)',
                    }}
                    className="z-30 transition-all duration-300 select-none pointer-events-none"
                  >
                    <div className="text-right flex flex-col items-end">
                      <h1 className="text-3xl font-semibold text-white tracking-wide mb-2">
                        超级应用
                      </h1>
                      <div className="h-[1px] bg-white/40 w-full" />
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile view (< 1200px) */}
              <div className="block min-[1200px]:hidden absolute bottom-16 left-0 right-0 z-30 pointer-events-none select-none px-6">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold text-white tracking-wide">
                    {SECTORS_DATA[activeSector].name}
                  </h1>
                </div>
              </div>
            </>
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



      {/* Decorative Outer footer credits strictly minimal */}
      <footer className="relative w-full py-4 text-center text-[10px] text-gray-600 font-mono border-t border-white/5 z-20">
        AETHER QUANTUM CORE WORKSPACE © 2026. IMPLEMENTED FOR MULTI-DIMENSIONAL LOGO DISPERSION.
      </footer>

    </div>
  );
}
