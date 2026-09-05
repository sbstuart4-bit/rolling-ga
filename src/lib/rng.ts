export function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Isolated RNG per caller so load order never changes the values a seed produces. */
export function createRng(seed: number) {
  const rand = mulberry32(seed);

  function seededRandom() {
    return rand();
  }

  function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(seededRandom() * arr.length)];
  }

  function pickMany<T>(arr: readonly T[], n: number): T[] {
    const copy = [...arr];
    const out: T[] = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
      const idx = Math.floor(seededRandom() * copy.length);
      out.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return out;
  }

  function randInt(min: number, max: number): number {
    return Math.floor(seededRandom() * (max - min + 1)) + min;
  }

  function randFloat(min: number, max: number, decimals = 1): number {
    const v = seededRandom() * (max - min) + min;
    return Math.round(v * 10 ** decimals) / 10 ** decimals;
  }

  function randBool(probabilityTrue = 0.5): boolean {
    return seededRandom() < probabilityTrue;
  }

  return { seededRandom, pick, pickMany, randInt, randFloat, randBool };
}
