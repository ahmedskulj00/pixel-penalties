/** Short vibrations on phones, for goals, saves and misses. */
let haptics = true;

export function configureHaptics(on: boolean): void {
  haptics = on;
}

export function buzz(pattern: VibratePattern): void {
  if (!haptics) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}
