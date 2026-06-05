import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { computeScale } from './layout';
import { drawBoard } from './drawBoard';
import { DESIGH_HEIGHT, DESIGN_WIDTH } from '../theme/theme';

export function BoardCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let app: Application | null = null;
    let cancelled = false;

    const resize = () => {
      if (!app) return;
      const scale = computeScale(window.innerWidth, window.innerHeight);
      app.renderer.resize(
        Math.round(DESIGN_WIDTH * scale),
        Math.round(DESIGH_HEIGHT * scale),
      );
      app.stage.scale.set(scale);
    };

    void (async () => {
      const instance = new Application();
      await instance.init({
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: window.devicePixelRatio || 1,
        width: DESIGN_WIDTH,
        height: DESIGH_HEIGHT,
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
      resize();
      window.addEventListener('resize', resize);
    })();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', resize);
      if (app) {
        app.destroy(true, { children: true });
        app = null;
      }
    };
  }, []);

  return <div ref={hostRef} className='board-host' />;
}
