import { Q16_ONE, Q16_HALF, q16Mul, q16Clamp, q16Sin } from '../core/q16.js';

export class BezierTidalPatch {
  constructor() {
    this.heights = new Int32Array(16);
    this.velocities = new Int32Array(16);
    this.stiffnessQ16 = 2400;
    this.dampingQ16 = 61800;
    this.phase = 0;
  }

  applyBrushImpulse(uQ16, vQ16, forceQ16) {
    const gx = q16Clamp((uQ16 * 3) >> 16, 0, 3);
    const gy = q16Clamp((vQ16 * 3) >> 16, 0, 3);

    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) {
        const dist = Math.abs(x - gx) + Math.abs(y - gy);
        const falloff = dist === 0 ? Q16_ONE : dist === 1 ? Q16_HALF : 16384;
        const idx = (y << 2) + x;
        this.velocities[idx] += q16Mul(forceQ16, falloff);
      }
    }
  }

  step() {
    this.phase = (this.phase + 2800) | 0;
    for (let i = 0; i < 16; i++) {
      const wave = q16Sin(this.phase + (i * 29000)) >> 5;
      const h = this.heights[i];
      const accel = -q16Mul(h, this.stiffnessQ16) + wave;
      this.velocities[i] = q16Mul(this.velocities[i] + accel, this.dampingQ16);
      this.heights[i] = q16Clamp(h + this.velocities[i], -Q16_ONE * 2, Q16_ONE * 2);
    }
  }

  static evalCubic1D(p0, p1, p2, p3, tQ16) {
    const invT = Q16_ONE - tQ16;
    const q0 = q16Mul(p0, invT) + q16Mul(p1, tQ16);
    const q1 = q16Mul(p1, invT) + q16Mul(p2, tQ16);
    const q2 = q16Mul(p2, invT) + q16Mul(p3, tQ16);

    const r0 = q16Mul(q0, invT) + q16Mul(q1, tQ16);
    const r1 = q16Mul(q1, invT) + q16Mul(q2, tQ16);

    return q16Mul(r0, invT) + q16Mul(r1, tQ16);
  }

  evaluate(uQ16, vQ16) {
    const h = this.heights;
    const col0 = BezierTidalPatch.evalCubic1D(h.at(0),  h.at(1),  h.at(2),  h.at(3),  uQ16);
    const col1 = BezierTidalPatch.evalCubic1D(h.at(4),  h.at(5),  h.at(6),  h.at(7),  uQ16);
    const col2 = BezierTidalPatch.evalCubic1D(h.at(8),  h.at(9),  h.at(10), h.at(11), uQ16);
    const col3 = BezierTidalPatch.evalCubic1D(h.at(12), h.at(13), h.at(14), h.at(15), uQ16);

    return BezierTidalPatch.evalCubic1D(col0, col1, col2, col3, vQ16);
  }

  gradient(uQ16, vQ16) {
    const eps = 1024;
    const uPlus = q16Clamp(uQ16 + eps, 0, Q16_ONE);
    const uMinus = q16Clamp(uQ16 - eps, 0, Q16_ONE);
    const vPlus = q16Clamp(vQ16 + eps, 0, Q16_ONE);
    const vMinus = q16Clamp(vQ16 - eps, 0, Q16_ONE);

    const dSdu = (this.evaluate(uPlus, vQ16) - this.evaluate(uMinus, vQ16)) << 5;
    const dSdv = (this.evaluate(uQ16, vPlus) - this.evaluate(uQ16, vMinus)) << 5;
    return { dSdu, dSdv };
  }
}
