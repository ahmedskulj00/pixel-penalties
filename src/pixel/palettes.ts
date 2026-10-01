/** Colours for the sprites: skin, hair and kits for players, and the trophy and ball palettes. */
import type { Kit, NationId, TrophyTier } from '@/types';
import { colorDistance, inkOn, shade } from '@/utils/color';
import { hashString } from '@/utils/hash';
import { pickWeighted } from '@/utils/random';

/** A colour per sprite slot; 0 marks a slot the art does not use. */
export type Palette = readonly (string | 0)[];

export interface PlayerLook {
  /** Skin and its shadow. */
  skin: readonly [string, string];
  hair: string;
}

const SKINS: readonly (readonly [string, string])[] = [
  ['#f3cfb3', '#d9a988'],
  ['#e8b992', '#c98f68'],
  ['#c98c5c', '#a66c40'],
  ['#8f5b3b', '#70432a'],
  ['#5e3b27', '#442a1b'],
];

const SKIN_WEIGHTS: readonly number[] = [3, 3, 2, 1.3, 1];

const HAIR: readonly string[] = ['#2a1c14', '#4b3021', '#7a4a26', '#c9a24f', '#a3522a', '#151515', '#8a8a8a'];

const KEEPER_SHIRTS: readonly string[] = ['#39d353', '#ffd23f', '#ff7a2f', '#9b6bff', '#19c3d6', '#ff5fa2', '#27293d'];

export const OUTLINE = '#1a1c2c';

/** Deterministic look for a player, so number 9 of Spain always looks the same. */
export function playerLook(nationId: NationId, number: number): PlayerLook {
  const h = hashString(`${nationId}:${number}`);
  const skin = SKINS[pickWeighted(h, SKIN_WEIGHTS)];
  const hair = HAIR[(h >>> 8) % HAIR.length];
  return { skin, hair };
}

/** Goalkeeper shirt that stands out against both teams' outfield kits. */
export function keeperShirt(ownKit: Kit, opponentKit: Kit): string {
  let best = KEEPER_SHIRTS[0];
  let bestScore = -1;
  for (const c of KEEPER_SHIRTS) {
    const score = Math.min(
      colorDistance(c, ownKit.shirt),
      colorDistance(c, opponentKit.shirt),
      colorDistance(c, ownKit.trim) * 1.3,
      colorDistance(c, '#3c9a4f') * 1.6,
    );
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

/**
 * Palette indexed by sprite slot (see SLOT in sprites/grid.ts).
 * role: 'kicker' uses the team kit; 'keeper' uses a contrasting goalkeeper kit.
 */
export function playerPalette(kit: Kit, look: PlayerLook, { keeper = null }: { keeper?: string | null } = {}): Palette {
  const shirt = keeper ?? kit.shirt;
  const trim = keeper ? shade(keeper, -0.45) : kit.trim;
  const shorts = keeper ? shade(keeper, -0.55) : kit.shorts;
  const socks = keeper ?? kit.socks;
  return [
    'none',
    OUTLINE,
    look.skin[0],
    look.skin[1],
    look.hair,
    shirt,
    shade(shirt, -0.2),
    trim,
    shorts,
    shade(shorts, -0.2),
    socks,
    '#23232e',
    keeper ? '#f4f4f4' : look.skin[0],
    '#1a1c2c',
    '#ffffff',
    keeper ? shirt : (kit.alt ?? shirt),
    trim === shirt ? inkOn(shirt) : trim,
    '#1a1c2c',
  ];
}

export const TROPHY_PALETTES: Record<TrophyTier | 'locked', Palette> = {
  gold: ['none', OUTLINE, 0, 0, 0, '#f5c542', '#c9961a', 0, '#5b3a1e', 0, 0, 0, 0, 0, '#fff4c2'],
  silver: ['none', OUTLINE, 0, 0, 0, '#dfe4ec', '#9aa3b2', 0, '#2d3250', 0, 0, 0, 0, 0, '#ffffff'],
  bronze: ['none', OUTLINE, 0, 0, 0, '#d9955a', '#9a5b2c', 0, '#3b2a1e', 0, 0, 0, 0, 0, '#ffe3c7'],
  locked: ['none', '#00000033', 0, 0, 0, '#00000022', '#00000033', 0, '#00000033', 0, 0, 0, 0, 0, '#00000011'],
};

export const BALL_PALETTE: Palette = ['none', OUTLINE, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, '#ffffff', 0, 0, '#262833'];
