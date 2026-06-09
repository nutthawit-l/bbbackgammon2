import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { computeScale } from './layout';
import { drawBoard } from './drawBoard';
import { drawCheckers } from './drawCheckers';
import { GAME_BOARD_HEIGHT, GAME_BOARD_WIDTH } from '../theme/theme';

export function BoardCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let app: Application | null = null;
    let cancelled = false;

    const resize = () => {
      if (!app) return;
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (width === 0 || height === 0) return;
      const scale = computeScale(width, height);
      app.renderer.resize(
        Math.round(GAME_BOARD_WIDTH * scale),
        Math.round(GAME_BOARD_HEIGHT * scale),
      );
      app.stage.scale.set(scale);
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

      // Guard against React StrictMode double-invoke: if the effect was
      // cleaned up while init() was awaiting, throw this instance away.
      if (cancelled) {
        instance.destroy(true);
        return;
      }

      app = instance;
      host.appendChild(app.canvas);
      drawBoard(app.stage);
      drawCheckers(app.stage);
      resize();
      observer.observe(host);
    })();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
    };
  }, []);

  return (
    <div
      ref={hostRef}
      // className='flex flex-1 min-h-0 w-full items-center justify-center'
      className='relative w-full max-w-full max-h-full'
      style={{
        aspectRatio: `${GAME_BOARD_WIDTH} / ${GAME_BOARD_HEIGHT}`,
      }}
    />
  );
}
