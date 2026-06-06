import {
  CHECKER_RADIUS,
  POINT_HEIGHT,
  TRAY_BAR_HEIGHT,
  TRAY_BAR_WIDTH,
} from '../theme/theme';
import { getBoardLayout } from './layout';

export type CheckerColor = 'white' | 'red';

export interface CheckerDistribution {
  points: { index: number; color: CheckerColor; count: number }[];
  bar: { color: CheckerColor; count: number }[];
  bearOff: { color: CheckerColor; count: number }[];
}

export interface Disc {
  x: number;
  y: number;
  color: CheckerColor;
}

export interface Badge {
  x: number;
  y: number;
  count: number;
  color: CheckerColor;
}

export interface TrayBar {
  x: number;
  y: number;
  width: number;
  height: number;
  color: CheckerColor;
}

export interface CheckerLayout {
  discs: Disc[];
  badges: Badge[];
  trayBars: TrayBar[];
}

// Static demo: 15 white + 15 red, covering every area and stack case.
export const DEMO_DISTRIBUTION: CheckerDistribution = {
  points: [
    { index: 0, color: 'white', count: 5 },
    { index: 14, color: 'white', count: 3 },
    { index: 9, color: 'white', count: 1 },
    { index: 19, color: 'red', count: 7 },
    { index: 7, color: 'red', count: 2 },
  ],
  bar: [
    { color: 'red', count: 1 },
    { color: 'white', count: 1 },
  ],
  bearOff: [
    { color: 'red', count: 5 },
    { color: 'white', count: 5 },
  ],
};

const DIAMETER = CHECKER_RADIUS * 2;
const POINT_CAPACITY = Math.floor(POINT_HEIGHT / DIAMETER);

export function getCheckerLayout(
  distribution: CheckerDistribution,
): CheckerLayout {
  const layout = getBoardLayout();
  const discs: Disc[] = [];
  const badges: Badge[] = [];
  const trayBars: TrayBar[] = [];

  // Points: stack from the base toward the tip; compress + badge when tall.
  for (const stack of distribution.points) {
    const point = layout.points[stack.index];
    const centerX = point.polygon[4];
    const baseY = point.polygon[1];
    const tipY = point.polygon[5];
    const dir = tipY > baseY ? 1 : -1; // top row stacks down, bottom row up
    const spacing =
      stack.count <= POINT_CAPACITY
        ? DIAMETER
        : (POINT_HEIGHT - DIAMETER) / (stack.count - 1);

    let lastY = baseY;
    for (let i = 0; i < stack.count; i++) {
      lastY = baseY + dir * (CHECKER_RADIUS + i * spacing);
      discs.push({ x: centerX, y: lastY, color: stack.color });
    }
    if (stack.count > POINT_CAPACITY) {
      badges.push({
        x: centerX,
        y: lastY,
        count: stack.count,
        color: stack.color,
      });
    }
  }

  // The Bar: discs centered on the bar; red stacks up, white stacks down.
  const barCenterX = layout.bar.x + layout.bar.width / 2;
  const barCenterY = layout.bar.y + layout.bar.height / 2;
  for (const stack of distribution.bar) {
    const dir = stack.color === 'red' ? -1 : 1;
    for (let i = 0; i < stack.count; i++) {
      discs.push({
        x: barCenterX,
        y: barCenterY + dir * (CHECKER_RADIUS + i * DIAMETER),
        color: stack.color,
      });
    }
  }

  // Bear-off trays: horizontal bars filling toward the center cube.
  const barX = layout.topTray.x + (layout.topTray.width - TRAY_BAR_WIDTH);
  for (const stack of distribution.bearOff) {
    const tray = stack.color === 'red' ? layout.topTray : layout.bottomTray;
    for (let i = 0; i < stack.count; i++) {
      const y =
        stack.color === 'red'
          ? tray.y + tray.height - (i + 1) * TRAY_BAR_HEIGHT
          : tray.y + i * TRAY_BAR_HEIGHT;
      trayBars.push({
        x: barX,
        y,
        width: TRAY_BAR_WIDTH,
        height: TRAY_BAR_HEIGHT,
        color: stack.color,
      });
    }
  }

  return { discs, badges, trayBars };
}
