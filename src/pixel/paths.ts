/** Pixel art ready for SVG: one path per colour. */
export interface PixelArt {
  w: number;
  h: number;
  paths: [string, string][];
}

/** Run-length encode a grid into [[value, pathData], …]. Works for slots and colour strings. */
export function toPaths<T extends string | number>(data: ArrayLike<T>, w: number, h: number): [T, string][] {
  const map = new Map<T, string>();
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const v = data[y * w + x];
      if (!v) {
        x++;
        continue;
      }
      let n = 1;
      while (x + n < w && data[y * w + x + n] === v) n++;
      map.set(v, (map.get(v) ?? '') + `M${x} ${y}h${n}v1h-${n}z`);
      x += n;
    }
  }
  return [...map.entries()];
}
