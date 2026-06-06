import { Container, Graphics, Text } from 'pixi.js';
import { DEMO_DISTRIBUTION, getCheckerLayout } from './checkers';
import type { CheckerColor } from './checkers';
import {
  CHECKER_INNER_RING_RADIUS,
  CHECKER_INNER_RING_STROKE,
  CHECKER_OUTER_STROKE,
  CHECKER_RADIUS,
  COLORS,
  TRAY_BAR_STROKE,
} from '../theme/theme';

const FILL: Record<CheckerColor, number> = {
  white: COLORS.checkerWhite,
  red: COLORS.checkerRed,
};
const OUTER: Record<CheckerColor, number> = {
  white: COLORS.checkerWhiteStroke,
  red: COLORS.checkerRedStroke,
};
const RING: Record<CheckerColor, number> = {
  white: COLORS.checkerWhiteRing,
  red: COLORS.checkerRedRing,
};
const BADGE_TEXT: Record<CheckerColor, number> = {
  white: 0x000000,
  red: 0xffffff,
};

export function drawCheckers(stage: Container): void {
  const layout = getCheckerLayout(DEMO_DISTRIBUTION);
  const g = new Graphics();

  // Bear-off bars (drawn first so discs sit above if anything overlaps).
  for (const bar of layout.trayBars) {
    g.rect(bar.x, bar.y, bar.width, bar.height)
      .fill(FILL[bar.color])
      .stroke({ width: TRAY_BAR_STROKE, color: OUTER[bar.color] });
  }

  // Discs: outer filled circle + concentric inner ring.
  for (const disc of layout.discs) {
    g.circle(disc.x, disc.y, CHECKER_RADIUS)
      .fill(FILL[disc.color])
      .stroke({ width: CHECKER_OUTER_STROKE, color: OUTER[disc.color] });
    g.circle(disc.x, disc.y, CHECKER_INNER_RING_RADIUS).stroke({
      width: CHECKER_INNER_RING_STROKE,
      color: RING[disc.color],
    });
  }

  stage.addChild(g);

  // Count badges on the innermost disc of compressed stacks.
  for (const badge of layout.badges) {
    const text = new Text({
      text: String(badge.count),
      style: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        fontWeight: '800',
        fill: BADGE_TEXT[badge.color],
      },
    });
    text.anchor.set(0.5);
    text.position.set(badge.x, badge.y);
    stage.addChild(text);
  }
}
