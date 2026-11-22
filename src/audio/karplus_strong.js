import { Q16_ONE, q16Mul, q16Clamp, GaloisLFSR16 } from '../core/q16.js';

/**
 * Ledger 2 Read-Only Observer: Integer Karplus-Strong Waveguide Synthesizer
 * Couples delay-line pitch directly to Dirichlet Frustration Energy (ℰ) and Sanity.
 */
export class KarplusStrongVoice {
  constructor(sampleRate = 22050, seed = 0x1337) {
    this.sampleRate = sampleRate;
    this.lfsr = new GaloisLFSR16(seed);
    this.buffer = new Int32Array(1024); // Supports down to ~21.5 Hz sub-drones
    this.length = 128;
    this.index = 0;
    this.dampingShift = 8; // Feedback decay: sample - (sample >> 8)
    this.active = false;
  }

  /**
   * Pluck the string at baseHz, warped by Dirichlet tension and Sanity loss.
   * High frustration bends harmonious intervals into microtonal tritones.
   */
  pluck(baseHz, sanityQ16 = Q16_ONE, dirichletEnergyQ16 = 0) {
    const sanityLoss = Q16_ONE - q16Clamp(sanityQ16, 0, Q16_ONE);
    // Detune factor: up to +41% (tritone ratio ≈ sqrt(2) ≈ 1.414) at zero sanity
    const tritoneShiftQ16 = q16Mul(sanityLoss, 27146) + (dirichletEnergyQ16 >> 4);
    const detunedHz = Math.max(24, baseHz + ((baseHz * tritoneShiftQ16) >> 16));

    this.length = q16Clamp((this.sampleRate / detunedHz) | 0, 16, this.buffer.length - 1);
    this.index = 0;

    // Excite waveguide delay line with 16-bit Galois LFSR noise burst
    for (let i = 0; i < this.length; i++) {
      this.buffer[i] = this.lfsr.nextQ16Signed() >> 1;
    }
    this.active = true;
  }

  /** Generate 1 signed 16-bit PCM integer sample [-32768, 32767] */
  nextSample() {
    if (!this.active) return 0;

    const nextIdx = (this.index + 1) % this.length;
    // Classic Karplus-Strong two-point integer average: (y[n] + y[n+1]) >> 1
    const avg = (this.buffer[this.index] + this.buffer[nextIdx]) >> 1;
    // Slight integer energy loss so drones decay organically
    const damped = avg - (avg >> this.dampingShift);

    this.buffer[this.index] = damped;
    this.index = nextIdx;

    return q16Clamp(damped, -32768, 32767);
  }
}
