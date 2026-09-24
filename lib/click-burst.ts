/**
 * Detects a burst of clicks: `count` clicks where each click lands within
 * `windowMs` of the first one. Used for the hidden admin entry on the logo.
 */
export type ClickBurst = {
  /** Records a click at `now` (ms). Returns true when the burst completes. */
  click: (now: number) => boolean;
  reset: () => void;
};

export function createClickBurst(count: number, windowMs: number): ClickBurst {
  let clicks: number[] = [];

  return {
    click(now) {
      clicks = clicks.filter((t) => now - t <= windowMs);
      clicks.push(now);
      if (clicks.length >= count) {
        clicks = [];
        return true;
      }
      return false;
    },
    reset() {
      clicks = [];
    },
  };
}

export const ADMIN_CLICK_COUNT = 8;
export const ADMIN_CLICK_WINDOW_MS = 3000;
