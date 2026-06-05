import { DESIGN_WIDTH, DESIGH_HEIGHT, MIN_SCALE } from '../theme/theme';

export function computeScale(
  viewportWidth: number,
  viewportHeight: number,
): number {
  const fit = Math.min(
    viewportWidth / DESIGN_WIDTH,
    viewportHeight / DESIGH_HEIGHT,
  );
  return Math.max(fit, MIN_SCALE);
}
