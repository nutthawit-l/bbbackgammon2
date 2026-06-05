import { POINTS_PER_QUADRANT } from '../core/constants';

// Responsive design stage (the Figma frame), logical px.
export const DESIGN_WIDTH = 393;
export const DESIGH_HEIGHT = 852;

// Board block (GameBoard) within the stage.
export const GAME_BOARD_WIDTH = 389;
export const GAME_BOARD_HEIGHT = 328;

// The board is the canvas; it is drawn from the origin and centered on screen
// by the Tailwind layout. The 393x852 phone-frame constants above are retained
// for the future chrome layout but no longer drive scaling or position.
export const GAME_BOARD_X = 0;
export const GAME_BOARD_Y = 0;

// Frame and playing surface.
export const FRAME_RADIUS = 5;
export const BORDER_PADDING = 10;
export const SURFACE_WIDTH = 350;
export const SURFACE_HEIGHT = 308;

// The Bar (central divider).
export const BAR_WIDTH = 18;

// Points (derived from surface and bar).
export const POINT_WIDTH =
  (SURFACE_WIDTH - BAR_WIDTH) / (POINTS_PER_QUADRANT * 2);
export const POINT_HEIGHT_RATIO = 0.37;
export const POINT_HEIGHT = SURFACE_HEIGHT * POINT_HEIGHT_RATIO;

// Bear-off side board.
export const SIDEBOARD_WIDTH = 29;
export const SIDEBOARD_PADDING_X = 4;
export const SIDEBOARD_PADDING_Y = 10;
export const SIDEBOARD_GAP = 10;
export const TRAY_HEIGHT = 134;
export const CUBE_SIZE = 20;

// Palette
export const COLORS = {
  tableTop: 0x3d6db5,
  tableBottom: 0x2d5a9f,
  frame: 0x5e3014,
  surface: 0xc8924a,
  bar: 0x7b4820,
  pointDark: 0x3d1a00,
  pointRust: 0x8b2200,
  trayInner: 0x351b0b,
  cubeSlotStroke: 0x7b4820,
} as const;
