import { Q16_ONE, q16Clamp, GaloisLFSR16 } from '../core/q16.js';
import { ALIGN } from '../core/sheaf_cosmology.js';
import { KarplusStrongVoice } from './karplus_strong.js';

// Base frequencies (Hz) per alignment for acoustic telemetry
const ALIGNMENT_PITCH_HZ = {
  [ALIGN.CHATTURGHA]: 82,  // Low E2 (visceral matter)
  [ALIGN.ULYAOTH]: 146,    // D3 (hollow astral)
  [ALIGN.XELLOTATH]: 233,  // Bb3 (unsettling tritone against E2)
  [ALIGN.MANTOROK]: 55     // A1 (deep binding sub-drone)
};

export class CosmologySoundscape {
  constructor(sampleRate = 22050) {
    this.sampleRate = sampleRate;
    this.voices = [
      new KarplusStrongVoice(sampleRate, 0xace1),
      new KarplusStrongVoice(sampleRate, 0xbeef),
      new KarplusStrongVoice(sampleRate, 0xdead),
      new KarplusStrongVoice(sampleRate, 0xcafe)
    ];
    this.whisperLfsr = new GaloisLFSR16(0x6661);
    this.whisperEnv = 0;
    this.whisperState1 = 0;
    this.whisperState2 = 0;
    this.voiceCursor = 0;
  }

  /** Trigger audio telemetry when a rune is inscribed on a Circle of Power node */
  triggerRuneIncantation(alignment, sanityQ16 = Q16_ONE, dirichletEnergyQ16 = 0) {
    const baseHz = ALIGNMENT_PITCH_HZ[alignment] ?? 110;
    const voice = this.voices[this.voiceCursor];
    this.voiceCursor = (this.voiceCursor + 1) % this.voices.length;

    voice.pluck(baseHz, sanityQ16, dirichletEnergyQ16);
    // Excite whispered formant envelope (~0.35s burst)
    this.whisperEnv = (this.sampleRate * 0.35) | 0;
  }

  /** Render a block of mono Int16 PCM samples */
  renderBlock(frameCount, sanityQ16 = Q16_ONE) {
    const out = new Int16Array(frameCount);
    const sanityLoss = Q16_ONE - q16Clamp(sanityQ16, 0, Q16_ONE);

    for (let i = 0; i < frameCount; i++) {
      let mix = 0;
      for (let v = 0; v < this.voices.length; v++) {
        mix += this.voices[v].nextSample();
      }

      // 2-pole integer bandpass resonator on LFSR noise for eerie whispered formants
      if (this.whisperEnv > 0 || sanityLoss > 16384) {
        const noise = this.whisperLfsr.nextQ16Signed() >> 4;
        // Shift resonant center with sanity loss for creeping pitch glide
        const shift = sanityLoss > 32768 ? 2 : 3;
        this.whisperState1 += (noise - this.whisperState1 - (this.whisperState2 >> 1)) >> shift;
        this.whisperState2 += this.whisperState1 >> shift;

        const whisperGain = this.whisperEnv > 0 ? 2 : (sanityLoss >> 14);
        mix += (this.whisperState2 * whisperGain) >> 2;
        if (this.whisperEnv > 0) this.whisperEnv--;
      }

      out[i] = q16Clamp(mix >> 1, -32768, 32767);
    }
    return out;
  }
}
