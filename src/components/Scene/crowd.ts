import type { Kit } from '@/types';
import { createRng } from '@/utils/random';

/** Paths per colour for the two halves of the crowd. */
export interface CrowdArt {
  left: [string, string][];
  right: [string, string][];
}

const SKIN: readonly string[] = ['#f3cfb3', '#e8b992', '#c98c5c', '#8f5b3b', '#5e3b27'];

const NEUTRAL: readonly string[] = ['#e9e4d4', '#8a8fa8', '#4a4f73', '#c7c2b0'];

const crowdCache = new Map<string, CrowdArt>();

/** Pixel crowd: your fans on the left, theirs on the right. Deterministic and cached. */
export function crowdArt(leftKit: Kit, rightKit: Kit): CrowdArt {
  const key = `${leftKit.shirt}${leftKit.trim}${rightKit.shirt}${rightKit.trim}`;
  const cached = crowdCache.get(key);
  if (cached) return cached;
  const rng = createRng(20260924);
  const build = (kit: Kit, fromX: number, toX: number): [string, string][] => {
    const paths = new Map<string, string>();
    const add = (c: string, x: number, y: number, w: number, h: number) => paths.set(c, `${paths.get(c) ?? ''}M${x} ${y}h${w}v${h}h-${w}z`);
    for (let row = 0; row < 6; row++) {
      const y = 3 + row * 7;
      for (let x = fromX + (row % 2) * 2; x < toX - 2; x += 4) {
        if (rng.chance(0.07)) continue;
        const r = rng.next();
        const body = r < 0.62 ? kit.shirt : r < 0.84 ? kit.trim : NEUTRAL[rng.int(NEUTRAL.length)];
        add(SKIN[rng.int(SKIN.length)], x + 1, y, 2, 2);
        add(body, x, y + 2, 4, 3);
        if (rng.chance(0.06)) add(kit.shirt, x + (rng.chance(0.5) ? -1 : 4), y - 2, 1, 4);
      }
    }
    return [...paths.entries()];
  };
  const art = { left: build(leftKit, 0, 160), right: build(rightKit, 160, 322) };
  crowdCache.set(key, art);
  return art;
}
