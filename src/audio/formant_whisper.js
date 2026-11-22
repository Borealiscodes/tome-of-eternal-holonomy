import { Q16_ONE, Q16_TAU, q16Clamp, q16Sin, GaloisLFSR16 } from '../core/q16.js';
import { ALIGN } from '../core/sheaf_cosmology.js';
import { KarplusStrongVoice } from './karplus_strong.js';

const ALIGNMENT_PITCH_HZ = {
  [ALIGN.CHATTURGHA]: 73,  // D2 (visceral rumble)
  [ALIGN.ULYAOTH]: 138,    // C#3 (eerie major-7th / astral)
  [ALIGN.XELLOTATH]: 207,  // G#3 (piercing tritone against D2)
  [ALIGN.MANTOROK]: 49     // G1 (abyssal corpse-god sub-drone)
};

export class CosmologySoundscape {
  constructor(sampleRate = 22050) {
    this.sampleRate = sampleRate;
    this.voices = Array.of(
      new KarplusStrongVoice(sampleRate, 0xace1),
      new KarplusStrongVoice(sampleRate, 0xbeef),
      new KarplusStrongVoice(sampleRate, 0xdead),
      new KarplusStrongVoice(sampleRate, 0xcafe)
    );
    this.whisperLfsr = new GaloisLFSR16(0x6661);
    this.whisperEnv = 0;
    this.whisperState1 = 0;
    this.whisperState2 = 0;
    this.voiceCursor = 0;

    // Continuous eldritch ritual drone accumulators (Q16.16 phase)
    this.dronePhase1 = 0;
    this.dronePhase2 = 0;

    // 4096-sample integer cathedral echo buffer (~185ms haunted reverb)
    this.reverbBuf = new Int32Array(4096);
    this.reverbIdx = 0;
  }

  triggerRuneIncantation(alignment, sanityQ16 = Q16_ONE, dirichletEnergyQ16 = 0) {
    const baseHz = ALIGNMENT_PITCH_HZ[alignment] ?? 98;
    const voice = this.voices[this.voiceCursor];
    this.voiceCursor = (this.voiceCursor + 1) % this.voices.length;

    // Longer decay (dampingShift = 10) so notes ring like bowed glass/cello
    voice.dampingShift = 10;
    voice.pluck(baseHz, sanityQ16, dirichletEnergyQ16);
    this.whisperEnv = (this.sampleRate * 0.55) | 0;
  }

  renderBlock(frameCount, sanityQ16 = Q16_ONE) {
    const out = new Int16Array(frameCount);
    const sanityLoss = Q16_ONE - q16Clamp(sanityQ16, 0, Q16_ONE);

    // Base ritual drone: 44 Hz + creeping tritone 62 Hz (shifts upward with sanity loss)
    const step1 = ((44 * Q16_TAU) / this.sampleRate) | 0;
    const step2 = (((58 + (sanityLoss >> 12)) * Q16_TAU) / this.sampleRate) | 0;

    for (let i = 0; i < frameCount; i++) {
      // 1. Continuous abyssal drone
      this.dronePhase1 = (this.dronePhase1 + step1) % Q16_TAU;
      this.dronePhase2 = (this.dronePhase2 + step2) % Q16_TAU;
      const sub1 = q16Sin(this.dronePhase1) >> 4;
      const sub2 = q16Sin(this.dronePhase2) >> 5;
      let mix = sub1 + sub2;

      // 2. Bowed/plucked Karplus-Strong waveguide voices
      for (let v = 0; v < this.voices.length; v++) {
        mix += this.voices[v].nextSample() >> 1;
      }

      // 3. Haunted wind & vocal-formant LFSR whispers
      const noise = this.whisperLfsr.nextQ16Signed() >> 4;
      const shift = sanityLoss > 24000 ? 2 : 3;
      this.whisperState1 += (noise - this.whisperState1 - (this.whisperState2 >> 1)) >> shift;
      this.whisperState2 += this.whisperState1 >> shift;

      const whisperGain = this.whisperEnv > 0 ? 4 : (1 + (sanityLoss >> 14));
      mix += (this.whisperState2 * whisperGain) >> 2;
      if (this.whisperEnv > 0) this.whisperEnv--;

      // 4. Cathedral feedback delay line for eerie spatial decay
      const echo = this.reverbBuf[this.reverbIdx];
      const wet = mix + (echo >> 1) + (echo >> 2);
      this.reverbBuf[this.reverbIdx] = q16Clamp(wet, -32768, 32767);
      this.reverbIdx = (this.reverbIdx + 1) & 4095;

      out[i] = q16Clamp(wet >> 1, -32768, 32767);
    }
    return out;
  }
}
