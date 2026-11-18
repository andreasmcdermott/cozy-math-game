import { sanitizeSave } from './game.js';

export const BACKUP_FORMAT = 'paws-potions-save';
export const MAX_BACKUP_BYTES = 1024 * 1024;

export function serializeBackup(save, savedAt = new Date().toISOString()) {
  return JSON.stringify({ format: BACKUP_FORMAT, formatVersion: 1, savedAt, game: sanitizeSave(save) }, null, 2);
}

export function parseBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error('Choose a game save smaller than 1 MB.');
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error('This file is not a readable game save.'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('This file is not a Paws & Potions save.');
  let game = parsed;
  if ('format' in parsed) {
    if (parsed.format !== BACKUP_FORMAT || parsed.formatVersion !== 1) throw new Error('This save format is not supported by this version of the game.');
    game = parsed.game;
  }
  if (!game || typeof game !== 'object' || ![1, 2, 3, 4].includes(game.version)) throw new Error('This save version is not supported by this version of the game.');
  for (const key of ['coins', 'completed']) {
    if (!Number.isSafeInteger(game[key]) || game[key] < 0 || game[key] > 1_000_000) throw new Error('The progress amounts in this file are invalid.');
  }
  if (!Array.isArray(game.owned) || !game.owned.includes('clover')) throw new Error('This file is missing the familiar collection.');
  return sanitizeSave(game);
}
