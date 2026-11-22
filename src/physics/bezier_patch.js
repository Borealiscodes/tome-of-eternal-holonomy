import { Q16_ONE, Q16_HALF, q16Mul, q16Clamp } from '../core/q16.js';

/**
 * 4x4 Q16.16 De Casteljau Bicubic Bezier Patch & Damped Integer Spring Grid
 * Drives both tactile spell-drawing currents and 3D cosmic manifold distortion.
 */
export class BezierTidalPatch {
  constructor() {
    // 16 control point heights and velocities in Q16.16
    this.heights = new Int32Array(16);
    this.velocities = new Int32Array(16);

    // Damped spring constants in Q16.16
    this.stiffnessQ16 = 3276; // ~0.05
    this.dampingQ16 = 60293;  // ~0.92
  }

  /** Inject a tactile brush impulse at normalized Q16.16 coordinates (u, v) in [0, 65536] */
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

  /** Advance integer spring physics by 1 tick */
  step() {
    for (let i = 0; i < 16; i++) {
      const h = this.heights[i];
      const accel = -q16Mul(h, this.stiffnessQ16);
      this.velocities[i] = q16Mul(this.velocities[i] + accel, this.dampingQ16);
      this.heights[i] = q16Clamp(h + this.velocities[i], -Q16_ONE * 2, Q16_ONE * 2);
    }
  }

  /** 1D 4-point De Casteljau interpolation in Q16.16 */
  static evalCubic1D(p0, p1, p2, p3, tQ16) {
    const invT = Q16_ONE - tQ16;
    const q0 = q16Mul(p0, invT) + q16Mul(p1, tQ16);
    const q1 = q16Mul(p1, invT) + q16Mul(p2, tQ16);
    const q2 = q16Mul(p2, invT) + q16Mul(p3, tQ16);

    const r0 = q16Mul(q0, invT) + q16Mul(q1, tQ16);
    const r1 = q16Mul(q1, invT) + q16Mul(q2, tQ16);

    return q16Mul(r0, invT) + q16Mul(r1, tQ16);
  }

  /** Evaluate surface height S(u, v) in Q16.16 */
  evaluate(uQ16, vQ16) {
    const col0 = BezierTidalPatch.evalCubic1D(this.heights[0], this.heights[1], this.heights[2], this.heights[3], uQ16);
    const col1 = BezierTidalPatch.evalCubic1D(this.heights[4], this.heights[5], this.heights[6], this.heights[7], uQ16);
    const col2 = BezierTidalPatch.evalCubic1D(this.heights[8], this.heights[9], this.heights[10], this.heights[11], uQ16);
    const col3 = BezierTidalPatch.evalCubic1D(this.heights[12], this.heights[13], this.heights[14], this.heights[15], uQ16);

    return BezierTidalPatch.evalCubic1D(col0, col1, col2, col3, vQ16);
  }

  /** Compute finite-difference gradient slope ∇S_Q16 = [dS/du, dS/dv] for astral flow */
  gradient(uQ16, vQ16) {
    const eps = 1024; // ~0.0156
    const uPlus = q16Clamp(uQ16 + eps, 0, Q16_ONE);
    const uMinus = q16Clamp(uQ16 - eps, 0, Q16_ONE);
    const vPlus = q16Clamp(vQ16 + eps, 0, Q16_ONE);
    const vMinus = q16Clamp(vQ16 - eps, 0, Q16_ONE);

    const dSdu = (this.evaluate(uPlus, vQ16) - this.evaluate(uMinus, vQ16)) << 5;
    const dSdv = (this.evaluate(uQ16, vPlus) - this.evaluate(uQ16, vMinus)) << 5;
    return { dSdu, dSdv };
  }
}
