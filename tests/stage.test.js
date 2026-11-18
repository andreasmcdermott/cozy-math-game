import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGE_WIDTH, STAGE_HEIGHT, cottageBounds, stagePoint, groundedRect } from '../src/stage.js';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} should equal ${b}`);

test('the entire painting fits a cottage opening with one scale at every layout width', () => {
  for (const width of [296, 342, 376, 428, 638, 720, 788, 1400]) for (const availableHeight of [300, 500, 900]) for (const maximumWidth of [760, 1000]) {
    const house = cottageBounds(24, 170, width, availableHeight, maximumWidth), scene = house.scene;
    close(scene.w / scene.h, 3 / 2);
    close(scene.w / STAGE_WIDTH, scene.h / STAGE_HEIGHT);
    assert.ok(scene.w <= maximumWidth);
    assert.ok(house.h <= availableHeight + 1e-9);
    assert.ok(scene.x >= 24 && scene.x + scene.w <= 24 + width);
    const farCorner = stagePoint(scene, STAGE_WIDTH, STAGE_HEIGHT);
    close(farCorner.x, scene.x + scene.w);
    close(farCorner.y, scene.y + scene.h);
    assert.ok(scene.y > house.y && scene.y + scene.h < house.y + house.h);
  }
});

test('visible feet and cauldron keep their floor positions as a stage scales or moves', () => {
  const kitten = groundedRect(660, 940, 400, [83, 44, 346, 381]);
  const rabbit = groundedRect(380, 940, 430, [92, 12, 267, 395]);
  for (const width of [296, 428, 638, 1400]) for (const top of [170, 300, 600]) {
    const { scene } = cottageBounds(40, top, width);
    for (const [rect, center, floor] of [[kitten, 660, 940], [rabbit, 380, 940]]) {
      const feet = stagePoint(scene, rect.x + rect.w / 2, rect.y + rect.h);
      close((feet.x - scene.x) / scene.w, center / STAGE_WIDTH);
      close((feet.y - scene.y) / scene.h, floor / STAGE_HEIGHT);
    }
    // Cauldron feet are at 91.5% of its drawing box, on their original scene floor.
    const potTop = 930 - 432 * .915;
    const feet = stagePoint(scene, 1180, potTop + 432 * .915);
    close((feet.y - scene.y) / scene.h, 930 / STAGE_HEIGHT);
  }
});
