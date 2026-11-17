export const CUP = 60;
export const CAPACITY = 12 * CUP;
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const glyphs = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙', '5/6': '⅚' };

export function formatCups(ticks) {
  if (!Number.isSafeInteger(ticks) || ticks < 0) throw new Error('Quantities must be nonnegative integer ticks');
  const whole = Math.floor(ticks / CUP);
  const remainder = ticks % CUP;
  if (!remainder) return String(whole);
  const divisor = gcd(remainder, CUP);
  const fraction = `${remainder / divisor}/${CUP / divisor}`;
  return `${whole ? `${whole} ` : ''}${glyphs[fraction] || fraction}`;
}
export const cupLabel = ticks => `${formatCups(ticks)} ${ticks > 0 && ticks <= CUP ? 'cup' : 'cups'}`;
export function parseCups(input, maxCups = 12) {
  if (typeof input !== 'string' || input.length > 50) return null;
  let value = input.trim().replace(/([0-9])([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚])/g, '$1 $2');
  for (const [fraction, glyph] of Object.entries(glyphs)) value = value.replaceAll(glyph, fraction);
  value = value.replace(/\s*\/\s*/g, '/');
  let numerator, denominator;
  const mixed = value.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  const fraction = value.match(/^(\d+)\/(\d+)$/);
  const decimal = value.match(/^(\d+)(?:\.(\d{1,6}))?$/);
  if (mixed) { denominator = BigInt(mixed[3]); numerator = BigInt(mixed[1]) * denominator + BigInt(mixed[2]); }
  else if (fraction) { numerator = BigInt(fraction[1]); denominator = BigInt(fraction[2]); }
  else if (decimal) { denominator = 10n ** BigInt(decimal[2]?.length || 0); numerator = BigInt(decimal[1]) * denominator + BigInt(decimal[2] || '0'); }
  else return null;
  if (!denominator || numerator * 60n % denominator !== 0n) return null;
  const ticks = numerator * 60n / denominator;
  return ticks <= BigInt(maxCups * CUP) ? Number(ticks) : null;
}

export function commonDenominator(a, b) {
  const da = CUP / gcd(a, CUP), db = CUP / gcd(b, CUP);
  const denominator = da * db / gcd(da, db);
  return { denominator, a: a * denominator / CUP, b: b * denominator / CUP };
}
