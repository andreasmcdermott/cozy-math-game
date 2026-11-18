// All illustrated stages use the source paintings' 3:2 coordinate system.
// Page layout and native UI never change the relationship of actors to the floor.
export const STAGE_WIDTH = 1536;
export const STAGE_HEIGHT = 1024;
export function cottageBounds(x, y, availableWidth, availableHeight = Infinity, maxWidth = 760) {
  const heightLimit = Math.max(240, Math.min((availableHeight - 36) / (.14 + 2 / 3), (availableHeight - 76) * 1.5));
  const width = Math.min(maxWidth, availableWidth - 28, heightLimit);
  const roof = Math.max(58, width * .14 + 18);
  const scene = { x: x + (availableWidth - width) / 2, y: y + roof, w: width, h: width * STAGE_HEIGHT / STAGE_WIDTH, scale: width / STAGE_WIDTH };
  return { scene, x: scene.x - 14, y, w: width + 28, h: roof + scene.h + 18, roof };
}
export function stagePoint(scene, x, y) {
  return { x: scene.x + x * scene.scale, y: scene.y + y * scene.scale };
}
export function groundedRect(center, floor, height, crop) {
  const width = height * crop[2] / crop[3];
  return { x: center - width / 2, y: floor - height, w: width, h: height };
}
