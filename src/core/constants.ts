export const QUADRANTS = 4;
export const POINTS_PER_QUADRANT = 6;
export const TOTAL_POINTS = QUADRANTS * POINTS_PER_QUADRANT;

export const CHECKERS_PER_PLAYER = 15;
export const DIE_SIDES = 6;
export const DICE_PER_ROLL = 2;

export const PLAYER_COLORS = {
  WHITE: 'white',
  RED: 'red',
} as const;

export type PlayerColor = (typeof PLAYER_COLORS)[keyof typeof PLAYER_COLORS];
