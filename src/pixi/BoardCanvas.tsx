import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { computeScale } from './layout';
import { drawBoard } from './drawBoard';
import { drawCheckers } from './drawCheckers';
import { GAME_BOARD_HEIGHT, GAME_BOARD_WIDTH } from '../theme/theme';

interface BoardCanvasProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onBoardWidth?: (width: number) => void;
}

export function BoardCanvas({ containerRef, onBoardWidth }: BoardCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onBoardWidthRef = useRef(onBoardWidth);
  onBoardWidthRef.current = onBoardWidth;

  useEffect(() => {
    const container = containerRef.current;
    const host = hostRef.current;
    if (!container || !host) return;

    let app: Application | null = null;
    let cancelled = false;

    const resize = () => {
      if (!app) return;
      const availW = container.clientWidth;
      const availH = container.clientHeight;
      if (availW === 0 || availH === 0) return;
      const scale = computeScale(availW, availH);
      const canvasW = Math.round(GAME_BOARD_WIDTH * scale);
      const canvasH = Math.round(GAME_BOARD_HEIGHT * scale);
      app.renderer.resize(canvasW, canvasH);
      app.stage.scale.set(scale);
      // Size the host to match the canvas exactly
      host.style.width = `${canvasW}px`;
      host.style.height = `${canvasH}px`;
      onBoardWidthRef.current?.(canvasW);
    };

    const observer = new ResizeObserver(resize);

    void (async () => {
      const instance = new Application();
      await instance.init({
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        width: GAME_BOARD_WIDTH,
        height: GAME_BOARD_HEIGHT,
      });

      if (cancelled) {
        instance.destroy(true);
        return;
      }

      app = instance;
      host.appendChild(app.canvas);
      drawBoard(app.stage);
      drawCheckers(app.stage);
      resize();
      observer.observe(container);
    })();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
    };
  }, [containerRef]);

  return <div ref={hostRef} className='relative mx-auto' />;
}
