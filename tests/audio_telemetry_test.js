import assert from 'node:assert/strict';
import { Q16_ONE, Q16_HALF } from '../src/core/q16.js';
import { ALIGN } from '../src/core/sheaf_cosmology.js';
import { KarplusStrongVoice } from '../src/audio/karplus_strong.js';
import { CosmologySoundscape } from '../src/audio/formant_whisper.js';

// 1. Verify Sanity detuning bends Karplus-Strong delay-line period
const saneVoice = new KarplusStrongVoice(22050, 0x1234);
const insaneVoice = new KarplusStrongVoice(22050, 0x1234);
saneVoice.pluck(110, Q16_ONE, 0);
insaneVoice.pluck(110, Q16_HALF >> 1, 65536);

assert.ok(insaneVoice.length < saneVoice.length, 'Low sanity detunes waveguide upward into dissonance');

// 2. Verify full soundscape renders deterministic non-zero Int16 PCM audio
const soundscape = new CosmologySoundscape(22050);
soundscape.triggerRuneIncantation(ALIGN.XELLOTATH, Q16_HALF, 32768);
const pcm = soundscape.renderBlock(512, Q16_HALF);

let energy = 0;
for (let i = 0; i < pcm.length; i++) energy += Math.abs(pcm[i]);
assert.ok(energy > 0, 'Soundscape generates non-silent PCM samples');

console.log('✓ Phase 3 Karplus-Strong & Formant Whisper telemetry verified:', {
  sanePeriod: saneVoice.length,
  insanePeriod: insaneVoice.length,
  pcmEnergy: energy
});
