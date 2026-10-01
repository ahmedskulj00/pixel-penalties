export type Rgb = [r: number, g: number, b: number];

export const hexToRgb = (hex: string): Rgb => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

/** Darken (amount < 0) or lighten (amount > 0) a colour by a fraction. */
export function shade(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = amount < 0 ? 1 + amount : 1;
  const add = amount > 0 ? 255 * amount : 0;
  return rgbToHex(r * f + add * (1 - r / 255), g * f + add * (1 - g / 255), b * f + add * (1 - b / 255));
}

/** Perceptual distance between two colours (weighted Euclidean "redmean"). */
export function colorDistance(a: string, b: string): number {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const rm = (r1 + r2) / 2;
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
}

/** Relative luminance (WCAG). */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Readable ink colour on top of a background colour. */
export const inkOn = (hex: string): string => (luminance(hex) > 0.4 ? '#1a1c2c' : '#ffffff');
