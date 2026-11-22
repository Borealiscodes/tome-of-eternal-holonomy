/**
 * Q16.16 Fixed-Point Arithmetic & Deterministic Primitives
 * Zero floating-point operations permitted in Ledger 1.
 */

export const Q16_SHIFT = 16;
export const Q16_ONE = 1 << Q16_SHIFT;          // 65536 (1.0)
export const Q16_HALF = 1 << (Q16_SHIFT - 1);   // 32768 (0.5)
export const Q16_PI = 205887;                   // floor(pi * 65536)
export const Q16_TAU = 411775;                  // floor(2 * pi * 65536)
export const Q16_HALF_PI = 102944;              // floor(pi/2 * 65536)

/** Multiply two Q16.16 signed 32-bit integers using BigInt to prevent 32-bit overflow */
export function q16Mul(a, b) {
  return Number((BigInt(a | 0) * BigInt(b | 0)) >> 16n) | 0;
}

/** Divide two Q16.16 signed 32-bit integers safely */
export function q16Div(a, b) {
  if ((b | 0) === 0) return a >= 0 ? 0x7fffffff : -0x80000000;
  return Number((BigInt(a | 0) << 16n) / BigInt(b | 0)) | 0;
}

/** Clamp Q16.16 integer between [min, max] */
export function q16Clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

/** Integer square root returning Q16.16 result from Q16.16 input */
export function q16Sqrt(x) {
  if (x <= 0) return 0;
  let val = BigInt(x) << 16n;
  let root = val;
  let bit = 1n << 46n;
  while (bit > val) bit >>= 2n;
  let res = 0n;
  while (bit !== 0n) {
    if (val >= res + bit) {
      val -= res + bit;
      res = (res >> 1n) + bit;
    } else {
      res >>= 1n;
    }
    bit >>= 2n;
  }
  return Number(res) | 0;
}

/**
 * Bhaskara I Integer Sine Approximation (Q16.16 radians -> Q16.16 [-65536, 65536])
 * sin(x) ≈ 16x(π - x) / (5π² - 4x(π - x)) for x in [0, π]
 */
export function q16Sin(theta) {
  let x = (theta | 0) % Q16_TAU;
  if (x < 0) x += Q16_TAU;

  let sign = 1;
  if (x > Q16_PI) {
    x -= Q16_PI;
    sign = -1;
  }

  // Compute in BigInt to avoid intermediate overflow on π²
  const bx = BigInt(x);
  const bPi = BigInt(Q16_PI);
  const xPiMinusX = (bx * (bPi - bx)) >> 16n;           // Q16.16
  const fivePiSq = (5n * bPi * bPi) >> 16n;            // Q16.16
  const num = 16n * xPiMinusX;
  const den = fivePiSq - 4n * xPiMinusX;

  if (den === 0n) return 0;
  const res = Number((num << 16n) / den) | 0;
  return sign < 0 ? -res : res;
}

export function q16Cos(theta) {
  return q16Sin((theta | 0) + Q16_HALF_PI);
}

/** 16-bit Galois Linear-Feedback Shift Register (Deterministic PRNG & Audio Noise) */
export class GaloisLFSR16 {
  constructor(seed = 0xace1) {
    this.state = (seed & 0xffff) || 0xace1;
  }

  nextBit() {
    const lsb = this.state & 1;
    this.state >>= 1;
    if (lsb) this.state ^= 0xb400;
    return lsb;
  }

  nextQ16Signed() {
    this.nextBit();
    // Map [1..65535] -> [-65536..65536]
    return (((this.state - 32768) << 1) | 0);
  }
}
