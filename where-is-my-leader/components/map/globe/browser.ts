export function sleep(ms: number) {
  return new Promise<void>(resolve => window.setTimeout(resolve, ms));
}

export function haptic(ms = 10) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms);
}
