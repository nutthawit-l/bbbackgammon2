import { Container, Graphics } from 'pixi.js';
import { getBoardLayout } from './layout';
import { COLORS, FRAME_RADIUS } from '../theme/theme';

export function drawBoard(stage: Container): void {
  const layout = getBoardLayout();
  const g = new Graphics();

  // Board frame: one rounded background covering frame + side board.
  g.roundRect(
    layout.board.x,
    layout.board.y,
    layout.board.width,
    layout.board.height,
    FRAME_RADIUS,
  ).fill(COLORS.frame);

  // Playing surface.
  g.rect(
    layout.surface.x,
    layout.surface.y,
    layout.surface.width,
    layout.surface.height,
  ).fill(COLORS.surface);

  // Points.
  for (const point of layout.points) {
    g.poly(point.polygon).fill(point.color);
  }

  // The Bar (central divider).
  g.rect(layout.bar.x, layout.bar.y, layout.bar.width, layout.bar.height).fill(
    COLORS.bar,
  );

  // Bear-off trays (recessed).
  for (const tray of [layout.topTray, layout.bottomTray]) {
    g.rect(tray.x, tray.y, tray.width, tray.height).fill(COLORS.trayInner);
  }

  // Doubling-cube slot placeholder.
  g.rect(
    layout.cubeSlot.x,
    layout.cubeSlot.y,
    layout.cubeSlot.width,
    layout.cubeSlot.height,
  )
    .fill(COLORS.trayInner)
    .stroke({ width: 1, color: COLORS.cubeSlotStroke });

  stage.addChild(g);
}
