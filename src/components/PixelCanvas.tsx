// =============================================================================
// PixelCanvas.tsx — Wrapper React pour le UIManager canvas de Noura
// Superpose un canvas transparent par-dessus le contenu React
// pour afficher : damage numbers, effets visuels (slash, petal, ice, etc.)
// =============================================================================

import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import UIManager from '../ui/UIManager';

export interface PixelCanvasHandle {
  showDamage: (value: number, type: 'player' | 'enemy' | 'crit' | 'heal' | 'miss', x?: number, y?: number) => void;
  addEffect: (type: 'slash' | 'petal' | 'ice' | 'lightning' | 'heal' | 'explosion', x?: number, y?: number) => void;
  addLog: (text: string, type?: 'dmg' | 'heal' | 'loot' | 'spell' | 'sys') => void;
  playSound: (name: string) => void;
}

interface PixelCanvasProps {
  width?: number;
  height?: number;
  active?: boolean;
}

const PixelCanvas = forwardRef<PixelCanvasHandle, PixelCanvasProps>(
  ({ width = 680, height = 420, active = true }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>(0);
    const initRef = useRef(false);

    // Initialiser le UIManager une seule fois
    useEffect(() => {
      if (!canvasRef.current || initRef.current) return;
      UIManager.init(canvasRef.current, {});
      UIManager.showScreen('game'); // Mode overlay : pas de title screen
      initRef.current = true;
    }, []);

    // Boucle d'animation
    useEffect(() => {
      if (!active) return;
      const loop = () => {
        UIManager.update();
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(rafRef.current);
    }, [active]);

    // Exposer l'API au parent via ref
    const showDamage = useCallback((value: number, type: 'player' | 'enemy' | 'crit' | 'heal' | 'miss', x?: number, y?: number) => {
      const cx = x ?? (type === 'player' ? 120 : 520);
      const cy = y ?? 180;
      UIManager.showDamage(value, type, cx, cy);
    }, []);

    const addEffect = useCallback((type: 'slash' | 'petal' | 'ice' | 'lightning' | 'heal' | 'explosion', x?: number, y?: number) => {
      UIManager.addEffect(type, x ?? 400, y ?? 200);
    }, []);

    const addLog = useCallback((text: string, type: 'dmg' | 'heal' | 'loot' | 'spell' | 'sys' = 'sys') => {
      UIManager.addLog(text, type);
    }, []);

    const playSound = useCallback((name: string) => {
      UIManager.playSound(name);
    }, []);

    useImperativeHandle(ref, () => ({
      showDamage,
      addEffect,
      addLog,
      playSound,
    }));

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{ imageRendering: 'pixelated' }}
      />
    );
  }
);

PixelCanvas.displayName = 'PixelCanvas';
export default PixelCanvas;