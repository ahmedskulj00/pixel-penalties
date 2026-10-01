/** An event's time on the performance.now() clock (now, for synthetic events or old clocks). */
export function eventTime(e?: { timeStamp?: number } | null): number {
  const now = performance.now();
  const t = e?.timeStamp;
  return typeof t === 'number' && t > 0 && t <= now + 1 ? t : now;
}

/** After acting on a press, drop the click that follows it, so it can't land on whatever replaced the button. */
export function swallowNextClick(): void {
  const stop = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };
  window.addEventListener('click', stop, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 700);
}
