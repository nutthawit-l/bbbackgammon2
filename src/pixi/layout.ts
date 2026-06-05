import {
  DESIGN_WIDTH,
  DESIGH_HEIGHT,
  MIN_SCALE,
  POINT_HEIGHT,
  COLORS,
  POINT_WIDTH,
  GAME_BOARD_X,
  GAME_BOARD_Y,
  GAME_BOARD_WIDTH,
  GAME_BOARD_HEIGHT,
  BORDER_PADDING,
  SURFACE_WIDTH,
  SURFACE_HEIGHT,
  BAR_WIDTH,
  SIDEBOARD_GAP,
  SIDEBOARD_WIDTH,
  SIDEBOARD_PADDING_X,
  SIDEBOARD_PADDING_Y,
  TRAY_HEIGHT,
  CUBE_SIZE,
} from '../theme/theme';
import { POINTS_PER_QUADRANT } from '../core/constants';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PointShape {
  // Draw-order index (0..23). NOT the backgammon point number; real
  // point numbering arrives with game state in a later step.
  index: number;
  polygon: number[]; // [x1, y1, x2, y2, x3, y3]
  color: number;
}

export interface BoardLayout {
  board: Rect; // full GameBoard background (rounded frame)
  surface: Rect;
  bar: Rect;
  topTray: Rect;
  bottomTray: Rect;
  cubeSlot: Rect;
  points: PointShape[];
}

function buildPoints(surface: Rect, bar: Rect): PointShape[] {
  const points: PointShape[] = [];
  const halves = [
    { startX: surface.x, isLeft: true },
    { startX: bar.x + bar.width, isLeft: false },
  ];
  const rows = [
    { isTop: true, baseY: surface.y, tipY: surface.y + POINT_HEIGHT },
    {
      isTop: false,
      baseY: surface.y + surface.height,
      tipY: surface.y + surface.height - POINT_HEIGHT,
    },
  ];

  let index = 0;
  for (const row of rows) {
    for (const half of halves) {
      for (let j = 0; j < POINTS_PER_QUADRANT; j++) {
        const x = half.startX + j * POINT_WIDTH;
        const distanceFromOuter = half.isLeft ? j : POINTS_PER_QUADRANT - 1 - j;
        const isRust = row.isTop
          ? distanceFromOuter % 2 === 0
          : distanceFromOuter % 2 === 1;
        points.push({
          index,
          color: isRust ? COLORS.pointRust : COLORS.pointDark,
          polygon: [
            x,
            row.baseY,
            x + POINT_WIDTH,
            row.baseY,
            x + POINT_WIDTH / 2,
            row.tipY,
          ],
        });
        index += 1;
      }
    }
  }
  return points;
}

export function getBoardLayout(): BoardLayout {
  const board: Rect = {
    x: GAME_BOARD_X,
    y: GAME_BOARD_Y,
    width: GAME_BOARD_WIDTH,
    height: GAME_BOARD_HEIGHT,
  };

  const surface: Rect = {
    x: board.x + BORDER_PADDING,
    y: board.y + BORDER_PADDING,
    width: SURFACE_WIDTH,
    height: SURFACE_HEIGHT,
  };

  const bar: Rect = {
    x: surface.x + (SURFACE_WIDTH - BAR_WIDTH) / 2,
    y: surface.y,
    width: BAR_WIDTH,
    height: SURFACE_HEIGHT,
  };

  const sideboardX = board.x + board.width - SIDEBOARD_WIDTH;
  const trayX = sideboardX + SIDEBOARD_PADDING_X;
  const trayWidth = SIDEBOARD_WIDTH - SIDEBOARD_PADDING_X * 2;

  const topTray: Rect = {
    x: trayX,
    y: board.y + SIDEBOARD_PADDING_Y,
    width: trayWidth,
    height: TRAY_HEIGHT,
  };

  const cubeSlot: Rect = {
    x: sideboardX + (SIDEBOARD_WIDTH - CUBE_SIZE) / 2,
    y: topTray.y + TRAY_HEIGHT + SIDEBOARD_GAP,
    width: CUBE_SIZE,
    height: CUBE_SIZE,
  };

  const bottomTray: Rect = {
    x: trayX,
    y: cubeSlot.y + CUBE_SIZE + SIDEBOARD_GAP,
    width: trayWidth,
    height: TRAY_HEIGHT,
  };

  return {
    board,
    surface,
    bar,
    topTray,
    bottomTray,
    cubeSlot,
    points: buildPoints(surface, bar),
  };
}

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
