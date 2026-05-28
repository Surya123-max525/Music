import React, { useEffect, useRef, useState } from 'react';
import { Sliders } from 'lucide-react';

interface VisualizerProps {
  isPlaying: boolean;
  theme: 'violet' | 'emerald' | 'crimson' | 'amber' | 'azure' | 'rose';
  volume: number;
}

type VisualizerMode = 'bars' | 'wave' | 'radial';

export const Visualizer: React.FC<VisualizerProps> = ({ isPlaying, theme, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('bars');
  const animationRef = useRef<number | null>(null);
  
  // Theme color maps for visualizer gradients
  const themeColors = {
    violet: { primary: '#a78bfa', secondary: '#4c1d95', accent: '#7c3aed' },
    emerald: { primary: '#34d399', secondary: '#064e3b', accent: '#059669' },
    crimson: { primary: '#fb7185', secondary: '#4c0519', accent: '#db2777' },
    amber: { primary: '#fbbf24', secondary: '#78350f', accent: '#d97706' },
    azure: { primary: '#60a5fa', secondary: '#1e3a8a', accent: '#2563eb' },
    rose: { primary: '#f472b6', secondary: '#4d0527', accent: '#db2777' },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize handler
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Keep track of bar heights for smooth interpolation
    const barCount = mode === 'radial' ? 60 : 40;
    const currentHeights = new Array(barCount).fill(5);
    const targetHeights = new Array(barCount).fill(5);
    let phase = 0;

    const render = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, width, height);

      const colors = themeColors[theme] || themeColors.violet;

      // Update target heights based on play state and volume
      phase += isPlaying ? 0.08 : 0.01;
      
      for (let i = 0; i < barCount; i++) {
        if (isPlaying) {
          // Generate rhythmic values using overlaying sine waves to simulate music beats
          const factor = Math.sin(phase + i * 0.15) * Math.cos(phase * 0.6 + i * 0.05);
          const rawHeight = Math.abs(factor) * (height * 0.65) * (volume / 100);
          // Add some random noise for spike detail
          const noise = Math.random() * 12 * (volume / 100);
          targetHeights[i] = Math.max(5, rawHeight + noise);
        } else {
          // Decay to a gentle floating idle state
          targetHeights[i] = 5 + Math.sin(phase + i * 0.5) * 4;
        }

        // Interpolate current heights for smooth animations (ease factor)
        currentHeights[i] += (targetHeights[i] - currentHeights[i]) * 0.2;
      }

      // Draw configurations based on selected visualizer mode
      if (mode === 'bars') {
        // Equalizer Bars Mode
        const barWidth = width / barCount - 2;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, colors.secondary);
        gradient.addColorStop(0.5, colors.accent);
        gradient.addColorStop(1, colors.primary);

        ctx.fillStyle = gradient;

        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + 2);
          const barHeight = currentHeights[i];
          const y = height - barHeight;

          // Draw rounded bar
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
          ctx.fill();
        }
      } else if (mode === 'wave') {
        // Smooth Waveform Mode
        ctx.beginPath();
        ctx.strokeStyle = colors.primary;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.primary;

        const sliceWidth = width / barCount;
        ctx.moveTo(0, height / 2);

        for (let i = 0; i < barCount; i++) {
          const x = i * sliceWidth;
          // Offset waveform vertically around center
          const offset = (currentHeights[i] - 5) * (i % 2 === 0 ? 1 : -1) * 0.5;
          const y = (height / 2) + offset;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            // Quadratic curve to make it smooth
            const prevX = (i - 1) * sliceWidth;
            const prevOffset = (currentHeights[i - 1] - 5) * ((i - 1) % 2 === 0 ? 1 : -1) * 0.5;
            const prevY = (height / 2) + prevOffset;
            ctx.quadraticCurveTo(prevX, prevY, x, y);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
      } else if (mode === 'radial') {
        // Radial Ring Visualizer Mode
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22;

        ctx.save();
        ctx.translate(centerX, centerY);

        const gradient = ctx.createRadialGradient(0, 0, baseRadius, 0, 0, baseRadius + height * 0.3);
        gradient.addColorStop(0, colors.accent);
        gradient.addColorStop(1, colors.primary);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.shadowBlur = 10;
        ctx.shadowColor = colors.accent;

        for (let i = 0; i < barCount; i++) {
          const angle = (i / barCount) * Math.PI * 2;
          const barHeight = currentHeights[i] * 0.6;
          
          const startX = Math.cos(angle) * baseRadius;
          const startY = Math.sin(angle) * baseRadius;
          const endX = Math.cos(angle) * (baseRadius + barHeight);
          const endY = Math.sin(angle) * (baseRadius + barHeight);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.restore();
        ctx.shadowBlur = 0;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, theme, mode, volume]);

  return (
    <div className="visualizer-wrapper glass-panel">
      <div className="visualizer-controls">
        <span className="visualizer-label"><Sliders size={14} /> Audio Visualizer</span>
        <div className="visualizer-modes">
          <button 
            className={`mode-btn ${mode === 'bars' ? 'active' : ''}`}
            onClick={() => setMode('bars')}
          >
            Bars
          </button>
          <button 
            className={`mode-btn ${mode === 'wave' ? 'active' : ''}`}
            onClick={() => setMode('wave')}
          >
            Wave
          </button>
          <button 
            className={`mode-btn ${mode === 'radial' ? 'active' : ''}`}
            onClick={() => setMode('radial')}
          >
            Radial
          </button>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="visualizer-canvas"></canvas>
    </div>
  );
};
export default Visualizer;
