/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { SectorId } from '../types';

// Define standard modern browser Path2D representations of requested SVG geometry globally
const pathAlgorithm = new Path2D("M208.408 119.852L411.662 119.809L480.748 0H0L240.353 416.52L309.78 296.327L208.408 119.852Z");
const pathOntology = new Path2D("M461.88 119.766H600.35L669.436 0H531.051L461.88 119.766Z");
const pathApplication = new Path2D("M265.526 460.106L334.74 580L573.091 167.017H434.663L265.526 460.106Z");

interface Particle {
  x: number;       // Current screen x
  y: number;       // Current screen y
  vx: number;      // Velocity x
  vy: number;      // Velocity y
  z: number;       // Physical depth (Z-distance from glass)
  ox: number;      // Outline native coordinate X (0 - 670)
  oy: number;      // Outline native coordinate Y (0 - 580)
  fx: number;      // Fill native coordinate X (0 - 670)
  fy: number;      // Fill native coordinate Y (0 - 580)
  currentRatio: number; // Transition interpolation between outline (0.0) and fill (1.0)
  destX: number;   // Transformed screen target X
  destY: number;   // Transformed screen target Y
  baseAlpha: number;
  alpha: number;
  size: number;
  group: 'algorithm' | 'ontology' | 'application'; // Associated sector
  noiseSeed: number;
  breathOffset: number;
  breathSpeed: number;
  scatterAmp: number;
  easeSpeed: number;
  isFillOnly?: boolean;
  dispersionCategory?: 'core' | 'cloud' | 'aura';
}

interface ParticleCanvasProps {
  activeSector: SectorId | null;
  onSectorHover: (sector: SectorId | null) => void;
  onSectorClick: (sector: SectorId | null) => void;
  particleDensity?: number;    // Customizable setting
  dispersionStrength?: number; // Customizable setting
  restingSpread?: number;      // Customizable setting
}

export default function ParticleCanvas({
  activeSector,
  onSectorHover,
  onSectorClick,
  particleDensity = 1.2,
  dispersionStrength = 1.1,
  restingSpread = 10.0,
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenOutlineCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenFillCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number | null>(null);
  const mouseRef = useRef<{ x: number; y: number; px: number; py: number }>({ x: -1000, y: -1000, px: -1000, py: -1000 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const scaleRef = useRef<number>(1.0);
  const animationTimeRef = useRef<number>(0);
  const lastHoveredSectorRef = useRef<SectorId | null>(null);

  // SVG Original specifications size
  const logoWidth = 670;
  const logoHeight = 580;

  // Initialize particles from outline and fill templates of coordinates
  useEffect(() => {
    // 1. Setup path outlines template canvas
    const offscreenOutline = document.createElement('canvas');
    offscreenOutline.width = logoWidth;
    offscreenOutline.height = logoHeight;
    const oCtx = offscreenOutline.getContext('2d', { willReadFrequently: true });
    
    // 2. Setup path fill template canvas
    const offscreenFill = document.createElement('canvas');
    offscreenFill.width = logoWidth;
    offscreenFill.height = logoHeight;
    const fCtx = offscreenFill.getContext('2d', { willReadFrequently: true });

    if (!oCtx || !fCtx) return;

    // Clear everything
    oCtx.clearRect(0, 0, logoWidth, logoHeight);
    fCtx.clearRect(0, 0, logoWidth, logoHeight);

    // Render outline on template canvas 1
    // Thinner line yields precise outlines, thicker fills look nicely dense
    oCtx.lineWidth = 1.5; 
    oCtx.strokeStyle = 'rgb(255, 0, 0)'; // Red -> Algorithm
    oCtx.stroke(pathAlgorithm);

    oCtx.strokeStyle = 'rgb(0, 255, 0)'; // Green -> Ontology
    oCtx.stroke(pathOntology);

    oCtx.strokeStyle = 'rgb(0, 0, 255)'; // Blue -> Application
    oCtx.stroke(pathApplication);

    // Render fill shapes on template canvas 2
    fCtx.fillStyle = 'rgb(255, 0, 0)';
    fCtx.fill(pathAlgorithm);

    fCtx.fillStyle = 'rgb(0, 255, 0)';
    fCtx.fill(pathOntology);

    fCtx.fillStyle = 'rgb(0, 0, 255)';
    fCtx.fill(pathApplication);

    offscreenOutlineCanvasRef.current = offscreenOutline;
    offscreenFillCanvasRef.current = offscreenFill;

    // Gather available pixel databases
    const outlineImgData = oCtx.getImageData(0, 0, logoWidth, logoHeight);
    const fillImgData = fCtx.getImageData(0, 0, logoWidth, logoHeight);

    const matchFillPoints: Record<'algorithm' | 'ontology' | 'application', {x: number, y: number}[]> = {
      algorithm: [],
      ontology: [],
      application: []
    };

    // Scan fill coordinates every 2 pixels to keep pools highly precise, dense and compact
    const fData = fillImgData.data;
    for (let y = 0; y < logoHeight; y += 2) {
      for (let x = 0; x < logoWidth; x += 2) {
        const index = (y * logoWidth + x) * 4;
        const r = fData[index];
        const g = fData[index + 1];
        const b = fData[index + 2];
        const a = fData[index + 3];

        if (a > 100) {
          if (r > g && r > b) {
            matchFillPoints.algorithm.push({ x, y });
          } else if (g > r && g > b) {
            matchFillPoints.ontology.push({ x, y });
          } else if (b > r && b > g) {
            matchFillPoints.application.push({ x, y });
          }
        }
      }
    }

    const generatedParticles: Particle[] = [];
    const oData = outlineImgData.data;

    // Scan outline data every step size based on density
    const step = 1;

    for (let y = 0; y < logoHeight; y += step) {
      for (let x = 0; x < logoWidth; x += step) {
        const index = (y * logoWidth + x) * 4;
        const r = oData[index];
        const g = oData[index + 1];
        const b = oData[index + 2];
        const a = oData[index + 3];

        if (a > 100) {
          let group: 'algorithm' | 'ontology' | 'application' | null = null;
          if (r > g && r > b) group = 'algorithm';
          else if (g > r && g > b) group = 'ontology';
          else if (b > r && b > g) group = 'application';

          if (group) {
            // Assign a corresponding random target shape interior coordinate
            const pool = matchFillPoints[group];
            let fx = x;
            let fy = y;
            if (pool && pool.length > 0) {
              const randPoint = pool[Math.floor(Math.random() * pool.length)];
              fx = randPoint.x;
              fy = randPoint.y;
            }

            const numOutlineParticles = 1; // Set to 1 to reduce calculations and boost performance
            for (let i = 0; i < numOutlineParticles; i++) {
              // Stratified spread spectrum: many particles are tightly anchored to the outline,
              // while some fly out super-far to form a beautiful dramatic halo/aura of cosmic stardust
              const randSpread = Math.random();
              let dispersionCategory: 'core' | 'cloud' | 'aura';
              let individualSpread = 0;
              let pScatterAmp = 0;
              let pSize = 0;
              let pBaseAlpha = 0;

              if (randSpread < 0.25) {
                // Core: tightly bound to the outline to form the sharp main shape
                dispersionCategory = 'core';
                individualSpread = restingSpread * 0.20; // tight center line with a bit of natural body
                pScatterAmp = 0.15 + Math.random() * 0.15; // very little movement to keep the core sharp
                pBaseAlpha = 0.32 + Math.random() * 0.28; // bright core (increased)
                
                const randVal = Math.random();
                pSize = 0.24 + randVal * 0.24; // medium sized core particles
                if (randVal > 0.85) {
                  pSize = 0.48 + Math.random() * 0.22; // accent core particles
                }
              } else if (randSpread < 0.75) {
                // Cloud: moderately dispersed mist around the core
                dispersionCategory = 'cloud';
                individualSpread = restingSpread * 1.5; // wider moderate spread
                pScatterAmp = 0.7 + Math.random() * 0.6; // active breathing sparkle
                pBaseAlpha = 0.20 + Math.random() * 0.20; // clearly visible mist (increased)
                
                const randVal = Math.random();
                pSize = 0.18 + randVal * 0.22; // slightly larger particles for high visibility
              } else {
                // Aura: highly dispersed outer cosmic dust
                dispersionCategory = 'aura';
                individualSpread = restingSpread * 3.8; // wider outer spread
                pScatterAmp = 1.4 + Math.random() * 1.1; // floating freely
                pBaseAlpha = 0.12 + Math.random() * 0.12; // clearly visible outer stardust (increased)
                
                const randVal = Math.random();
                pSize = 0.10 + randVal * 0.16; // clearly visible fine particles
              }

              const jitterX = (Math.random() - 0.5) * individualSpread;
              const jitterY = (Math.random() - 0.5) * individualSpread;

              generatedParticles.push({
                x: (dimensions.width / 2) + ((x + jitterX) - logoWidth / 2) * scaleRef.current,
                y: (dimensions.height / 2) + ((y + jitterY) - logoHeight / 2) * scaleRef.current,
                vx: 0,
                vy: 0,
                z: (Math.random() - 0.5) * 12, // subtle organic initial depth variations
                ox: x + jitterX,
                oy: y + jitterY,
                fx: fx + (Math.random() - 0.5) * 2.0,
                fy: fy + (Math.random() - 0.5) * 2.0,
                currentRatio: 0.0, // default starts at outline (0)
                destX: 0,
                destY: 0,
                baseAlpha: pBaseAlpha,
                alpha: 0,
                size: pSize,
                group,
                noiseSeed: Math.random() * 200,
                breathOffset: Math.random() * Math.PI * 2,
                breathSpeed: 0.7 + Math.random() * 0.8,
                scatterAmp: pScatterAmp,
                easeSpeed: 0.11 + Math.random() * 0.14,
                isFillOnly: false,
                dispersionCategory,
              });
            }
          }
        }
      }
    }

    // Populate sparse background fill particles inside the logo shape interior
    // so the shapes are continuously readable yet faint and dark when not hovered/illuminated
    const fillGroups: ('algorithm' | 'ontology' | 'application')[] = ['algorithm', 'ontology', 'application'];
    fillGroups.forEach((group) => {
      const pool = matchFillPoints[group];
      if (!pool || pool.length === 0) return;
      
      // Control sparse density of background fill-points using particleDensity
      // We will randomly sample coordinates from the pool database to completely avoid regular lines or checkerboard grids
      const fillRatio = 0.45 * particleDensity; // Increased to 0.45 to support denser hover state
      const targetCount = Math.floor(pool.length * fillRatio);
      
      for (let k = 0; k < targetCount; k++) {
        // Randomly pick points from the pool database
        const pt = pool[Math.floor(Math.random() * pool.length)];
        
        // Add a generous organic spatial jitter to break any remaining scan patterns and create cloud clusters
        const jitterX = (Math.random() - 0.5) * 18.0;
        const jitterY = (Math.random() - 0.5) * 18.0;

        const randVal = Math.random();
        let pSize = 0.16 + randVal * 0.28; // smaller size spectrum (radius 0.16 to 0.44)
        if (randVal > 0.88) {
          pSize = 0.45 + Math.random() * 0.35; // fine accents
        } else if (randVal < 0.20) {
          pSize = 0.08 + Math.random() * 0.08; // ultra-fine
        }

        generatedParticles.push({
          x: (dimensions.width / 2) + ((pt.x + jitterX) - logoWidth / 2) * scaleRef.current,
          y: (dimensions.height / 2) + ((pt.y + jitterY) - logoHeight / 2) * scaleRef.current,
          vx: 0,
          vy: 0,
          z: (Math.random() - 0.5) * 18, // more depth dispersion to match frosted effect
          // Match both outline and fill targets so they remain continuous and static inside the shape
          ox: pt.x + jitterX,
          oy: pt.y + jitterY,
          fx: pt.x + jitterX,
          fy: pt.y + jitterY,
          currentRatio: 0.0, 
          destX: 0,
          destY: 0,
          baseAlpha: 0.02 + Math.random() * 0.03, // Extremely faint resting state opacity to keep outline clean
          alpha: 0,
          size: pSize,
          group,
          noiseSeed: Math.random() * 200,
          breathOffset: Math.random() * Math.PI * 2,
          breathSpeed: 0.5 + Math.random() * 0.6,
          scatterAmp: 0.4 + Math.random() * 0.4,
          easeSpeed: 0.09 + Math.random() * 0.11,
          isFillOnly: true,
        });
      }
    });

    particlesRef.current = generatedParticles;
  }, [dimensions.width, dimensions.height, particleDensity, restingSpread]);

  // Handle automatic workspace container resizing
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && canvasRef.current.parentElement) {
        const rect = canvasRef.current.parentElement.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: Math.max(560, rect.height),
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Sync scaled positions dynamically
  useEffect(() => {
    // Elegant responsive scale perfectly matched with the App page's grid cell layout to never overlap cards
    const scaleFactor = dimensions.width < 1120 ? Math.max(0.5, dimensions.width / 1120) : 1.0;
    const s = 0.88 * scaleFactor; // Larger and more prominent center presentation
    scaleRef.current = s;
  }, [dimensions]);

  // Main Render Animation & Multi-hover Mapping Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      animationTimeRef.current += 0.005;
      const t = animationTimeRef.current;

      // Clear the canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const activeGroup = activeSector;
      const scale = scaleRef.current;
      const logoScreenX = (dimensions.width / 2) - (logoWidth / 2) * scale;
      const logoScreenY = (dimensions.height / 2) - (logoHeight / 2) * scale - 10;

      // Detect hovered sector based on mouse position relative to path geometries
      let hoveredSector: SectorId | null = null;
      if (mouseRef.current.x >= -500 && mouseRef.current.y >= -500) {
        const localX = (mouseRef.current.x - logoScreenX) / scale;
        const localY = (mouseRef.current.y - logoScreenY) / scale;

        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0); // reset context transform to identity
        if (ctx.isPointInPath(pathAlgorithm, localX, localY)) {
          hoveredSector = 'algorithm';
        } else if (ctx.isPointInPath(pathOntology, localX, localY)) {
          hoveredSector = 'ontology';
        } else if (ctx.isPointInPath(pathApplication, localX, localY)) {
          hoveredSector = 'application';
        }
        ctx.restore();
      }

      if (hoveredSector !== lastHoveredSectorRef.current) {
        lastHoveredSectorRef.current = hoveredSector;
        onSectorHover(hoveredSector);
      }

      if (canvas) {
        canvas.style.cursor = hoveredSector ? 'pointer' : 'default';
      }

      // 1. First Pass: Update all physics, positions, sizes and alpha logic
      particlesRef.current.forEach((p) => {
        const isThisGroupActive = activeGroup === p.group;

        // Draw transition targets interpolation outline (0) -> fill (1) with independent organic casing speed
        const ratioTarget = isThisGroupActive ? 1.0 : 0.0;
        p.currentRatio += (ratioTarget - p.currentRatio) * (isThisGroupActive ? 0.42 : 0.26);

        // Model physical depth Z for Depth Of Field (Frosted glass effect)
        // Defocus from 80 down to 24 units ensures inactive sectors remain beautifully legible
        const targetZ = isThisGroupActive 
          ? 0 
          : (activeGroup !== null ? 24 : Math.sin(t * 1.5 + p.noiseSeed * 0.1) * 12);
        
        p.z += (targetZ - p.z) * 0.08;

        // Calculate dynamic logical targets
        const txNative = p.ox * (1 - p.currentRatio) + p.fx * p.currentRatio;
        const tyNative = p.oy * (1 - p.currentRatio) + p.fy * p.currentRatio;

        let tx = logoScreenX + txNative * scale;
        let ty = logoScreenY + tyNative * scale;

        // Add fluid physics noise (stronger on dispersion, gentle in idle outline)
        const noiseFreq = 3.0;
        // Reduced active noise amplitude to let active particles pack much tighter inside the shape
        const noiseAmp = isThisGroupActive ? 10 * dispersionStrength : 1.5;
        const nX = Math.sin(t * 1.5 + p.noiseSeed) * noiseAmp;
        const nY = Math.cos(t * 1.2 + p.noiseSeed * 1.3) * noiseAmp;

        tx += nX;
        ty += nY;

        // Smooth target coordinates including mouse repulsion offset without bounce
        let targetX = tx;
        let targetY = ty;

        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelRadius = isThisGroupActive ? 120 : 60;

        if (dist < repelRadius && dist > 1) {
          const pushForce = ((repelRadius - dist) / repelRadius) * 25; // max push offset
          targetX -= (dx / dist) * pushForce;
          targetY -= (dy / dist) * pushForce;
        }

        // Smoothly ease target position over time with independent, randomized decay speeds (destroys rigid 1-to-1 sync)
        const easeRate = isThisGroupActive ? 0.45 : 0.28;
        p.x += (targetX - p.x) * easeRate;
        p.y += (targetY - p.y) * easeRate;

        // Zero out velocities to prevent residual bouncy oscillation drift
        p.vx = 0;
        p.vy = 0;

        // Update linear alpha transition step
        p.alpha += (p.baseAlpha - p.alpha) * 0.1;
      });

      // 3. Third Pass: Draw particles.
      // If a group is active, we split the drawing into two passes:
      // First, draw the inactive particles behind a beautiful soft frosted glass filter.
      // Then, draw the active section on top in crisp, high-contrast sharp detail.
      if (activeGroup !== null) {
        // Pass 3a: Draw Inactive sections using high-performance simulated bokeh blur
        // This achieves a beautiful matte frosted glass look with zero CPU/GPU filter lags
        ctx.save();
        
        particlesRef.current.forEach((p) => {
          const isThisGroupActive = activeGroup === p.group;
          if (isThisGroupActive) return;

          // Performance Optimization: Skip drawing background fill particles entirely for inactive groups
          if (p.isFillOnly) return;

          const sizeRelation = p.size / 0.5;
          const sizeBrightnessMult = Math.min(1.8, Math.max(0.45, sizeRelation * 0.95));
          const sizeBlurMult = Math.max(0.1, 1.8 - sizeRelation * 0.7);

          // Beautiful matte frosted rest state with less artificial deep blur to preserve readability
          const physicalDepthBlur = Math.abs(p.z) * 0.08 + 1.2; 
          const totalBlurRadius = (physicalDepthBlur + 0.6) * sizeBlurMult;

          // Individualized organic drift: each particle undergoes slow, randomized hover wave motions
          // using its own distinct frequencies, speeds and phases to ensure no coordinated global movement
          const driftX = Math.sin(t * p.breathSpeed + p.breathOffset) * p.scatterAmp * 2.6 * (1.0 - p.currentRatio);
          const driftY = Math.cos(t * (p.breathSpeed * 1.1) + p.breathOffset * 1.45) * p.scatterAmp * 2.6 * (1.0 - p.currentRatio);
          
          // Micro-vibrations for natural cosmic stardust sparkle
          const jitterX = Math.sin(t * 4.2 + p.noiseSeed) * p.scatterAmp * 0.8 * (1.0 - p.currentRatio);
          const jitterY = Math.cos(t * 3.6 + p.noiseSeed * 1.25) * p.scatterAmp * 0.8 * (1.0 - p.currentRatio);

          const drawX = p.x + driftX + jitterX;
          const drawY = p.y + driftY + jitterY;

          let finalDrawSize = p.size * 0.95 + totalBlurRadius * 0.25;
          // Subtle individual size breathing fluctuation (feels sparkled, not global)
          finalDrawSize *= (1.0 + Math.sin(t * 2.5 + p.noiseSeed) * 0.12 * (1.0 - p.currentRatio));

          // Make the inactive parts of the logo significantly dimmer in hover state
          let finalDrawAlpha = (p.alpha * sizeBrightnessMult * 0.15) / (1.0 + totalBlurRadius * 0.3); 

          if (finalDrawAlpha > 0.005) {
            // Draw soft glow/bloom halo (subtle and tight)
            ctx.fillStyle = `rgba(255, 255, 255, ${finalDrawAlpha * 0.12})`;
            ctx.beginPath();
            ctx.arc(drawX, drawY, finalDrawSize * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Draw crisp particle core
            ctx.fillStyle = `rgba(255, 255, 255, ${finalDrawAlpha * 0.95})`;
            ctx.beginPath();
            ctx.arc(drawX, drawY, finalDrawSize, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        ctx.restore();

        // Pass 3b: Draw Active section directly on top - crisp, brilliant, and sharp
        particlesRef.current.forEach((p) => {
          const isThisGroupActive = activeGroup === p.group;
          if (!isThisGroupActive) return;

          const sizeRelation = p.size / 0.5;
          const sizeBrightnessMult = Math.min(1.8, Math.max(0.45, sizeRelation * 0.95));
          const sizeBlurMult = Math.max(0.1, 1.8 - sizeRelation * 0.7);

          const physicalDepthBlur = Math.abs(p.z) * 0.08;
          const totalBlurRadius = (physicalDepthBlur + 1.2) * sizeBlurMult;

          let finalDrawSize = p.size * 0.95;
          let finalDrawAlpha = p.alpha * sizeBrightnessMult;

          if (totalBlurRadius > 0.4) {
            finalDrawSize = p.size * 0.95 + totalBlurRadius * 0.22;
            finalDrawAlpha = finalDrawAlpha / (1.0 + totalBlurRadius * 1.6);
          }

          // Active hover size and alpha boost
          finalDrawSize = p.size * 2.5; // Larger size on hover to fill the shape densely and brightly
          finalDrawSize *= (1.06 + Math.sin(t * 12 + p.noiseSeed) * 0.12);
          // Boosted active alpha multiplier (from 4.2 to 6.5) to make active hovered sections extremely bright and dense
          finalDrawAlpha = Math.min(1.0, finalDrawAlpha * 6.5);

          // Mouse searchlight ambient particle illumination (Only for active hovered sector)
          if (mouseRef.current.x >= 0 && mouseRef.current.y >= 0) {
            const mdx = mouseRef.current.x - p.x;
            const mdy = mouseRef.current.y - p.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 240) {
              finalDrawAlpha += (1.0 - mdist / 240) * 0.32;
            }
          }

          if (finalDrawAlpha > 0.005) {
            // Draw soft glow/bloom halo (slightly wider and brighter)
            ctx.fillStyle = `rgba(255, 255, 255, ${finalDrawAlpha * 0.28})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, finalDrawSize * 2.2, 0, Math.PI * 2);
            ctx.fill();

            // Draw crisp particle core (fully bright white)
            ctx.fillStyle = `rgba(255, 255, 255, ${finalDrawAlpha * 1.0})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, finalDrawSize, 0, Math.PI * 2);
            ctx.fill();
          }
        });

      } else {
        // Pass 3c: Resting state - draw all particles normally with standard optical focus variance
        // Pass 3c: Resting state - draw all particles normally with standard optical focus variance
        particlesRef.current.forEach((p) => {
          // Performance Optimization: Only draw 15% of the fill particles in resting state
          if (p.isFillOnly && (p.noiseSeed % 100 > 15)) {
            return;
          }

          const sizeRelation = p.size / 0.5;
          const sizeBrightnessMult = Math.min(1.8, Math.max(0.45, sizeRelation * 0.95));
          const sizeBlurMult = Math.max(0.1, 1.8 - sizeRelation * 0.7);

          const physicalDepthBlur = Math.abs(p.z) * 0.08;
          const totalBlurRadius = (physicalDepthBlur + 1.2) * sizeBlurMult;

          // Individualized organic drift: each particle undergoes slow, randomized hover wave motions
          // using its own distinct frequencies, speeds and phases to ensure no coordinated global movement
          const driftX = Math.sin(t * (p.breathSpeed * 1.2) + p.breathOffset) * p.scatterAmp * 7.5;
          const driftY = Math.cos(t * (p.breathSpeed * 1.3) + p.breathOffset * 1.45) * p.scatterAmp * 7.5;
          
          // Micro-vibrations for natural cosmic stardust sparkle
          const jitterX = Math.sin(t * 5.5 + p.noiseSeed) * p.scatterAmp * 2.5;
          const jitterY = Math.cos(t * 4.8 + p.noiseSeed * 1.25) * p.scatterAmp * 2.5;

          const drawX = p.x + driftX + jitterX;
          const drawY = p.y + driftY + jitterY;

          // Metallic sweep scanning wave (diagonal sweep) for outline particles
          const scanTime = t * 35.0;
          const scanPos = (scanTime * 95) % (logoWidth + logoHeight + 400);
          const distToScan = Math.abs((p.ox + p.oy) - scanPos);
          let scanGlow = 0;
          if (!p.isFillOnly && p.dispersionCategory === 'core' && distToScan < 90) {
            scanGlow = Math.pow(Math.cos((distToScan / 90) * Math.PI / 2), 4.0) * 1.8;
          }

          let finalDrawSize = p.size * 0.95;
          // Subtle individual size breathing fluctuation (feels sparkled, not global)
          finalDrawSize *= (1.0 + Math.sin(t * 2.5 + p.noiseSeed) * 0.12);

          let finalDrawAlpha = p.alpha * sizeBrightnessMult * 1.45; // Dimmer baseline outline to make scan lines pop out

          if (totalBlurRadius > 0.4) {
            finalDrawSize = finalDrawSize + totalBlurRadius * 0.22;
            finalDrawAlpha = finalDrawAlpha / (1.0 + totalBlurRadius * 0.30);
          }

          // Mouse searchlight ambient particle illumination (Resting mode only)
          if (mouseRef.current.x >= 0 && mouseRef.current.y >= 0) {
            const mdx = mouseRef.current.x - drawX;
            const mdy = mouseRef.current.y - drawY;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 240) {
              finalDrawAlpha += (1.0 - mdist / 240) * 0.35;
            }
          }

          if (scanGlow > 0.01) {
            finalDrawSize *= (1.0 + scanGlow * 0.08);
            finalDrawAlpha = Math.min(1.0, finalDrawAlpha + scanGlow * 0.7);
          }

          if (finalDrawAlpha > 0.005) {
            // Draw soft glow/bloom halo (subtle and tight)
            ctx.fillStyle = `rgba(255, 255, 255, ${finalDrawAlpha * 0.12})`;
            ctx.beginPath();
            ctx.arc(drawX, drawY, finalDrawSize * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Draw crisp particle core
            ctx.fillStyle = `rgba(255, 255, 255, ${finalDrawAlpha * 0.95})`;
            ctx.beginPath();
            ctx.arc(drawX, drawY, finalDrawSize, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // Render glowing searchlight spotlight under cursor ONLY in resting state to prevent bleeding in hover mode
      if (activeGroup === null && mouseRef.current.x >= 0 && mouseRef.current.y >= 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const glowRad = ctx.createRadialGradient(
          mouseRef.current.x,
          mouseRef.current.y,
          0,
          mouseRef.current.x,
          mouseRef.current.y,
          240
        );
        glowRad.addColorStop(0, 'rgba(255, 255, 255, 0.12)'); // Soft subtle spotlight starting core
        glowRad.addColorStop(1, 'rgba(255, 255, 255, 0)');      // Smoothly fading into darkness. Just one clean, subtle gradient stop.
        ctx.fillStyle = glowRad;
        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
        ctx.restore();
      }

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [dimensions, activeSector, dispersionStrength]);

  // Track cursor globally across the entire viewport for unlimited searchlight range
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      // Compensate for CSS transform scale factor to map coordinates to internal resolution
      const x = ((e.clientX - rect.left) / rect.width) * dimensions.width;
      const y = ((e.clientY - rect.top) / rect.height) * dimensions.height;

      mouseRef.current.px = mouseRef.current.x;
      mouseRef.current.py = mouseRef.current.y;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
    };

    const handleGlobalMouseLeave = (e: MouseEvent) => {
      // Clear flashlight coordinates if mouse goes completely out of the webpage body
      if (!e.relatedTarget || e.relatedTarget === document.documentElement) {
        mouseRef.current.x = -1000;
        mouseRef.current.y = -1000;
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleGlobalMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
    };
  }, [dimensions]);

  const handleCanvasClick = () => {
    if (lastHoveredSectorRef.current) {
      onSectorClick(lastHoveredSectorRef.current);
    } else {
      onSectorClick(null);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full z-10 select-none overflow-hidden" id="canvas-container">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full touch-none block"
        onClick={handleCanvasClick}
        id="interactive-logo-canvas"
      />
    </div>
  );
}
