import { Q16_ONE, q16Clamp, GaloisLFSR16 } from '../core/q16.js';
import { FB_WIDTH, FB_HEIGHT } from './bayer_clut8.js';

const HALLUCINATION_MESSAGES = [
  'SANITY CRITICAL: REALITY MANIFOLD FRACTURING',
  'WARNING: MEMORY CARD CORRUPTED — DELETING TOME...',
  'XEL\'LOTATH WHISPERS: THE FLESH IS AN ILLUSION',
  'CONTROLLER PORT 1 UNPLUGGED',
  'PARGON... PARGON... MANTOROK BINDS THE VOID'
];

export class SanityHallucinator {
  constructor() {
    this.lfsr = new GaloisLFSR16(0x9999);
    this.tick = 0;
  }

  /**
   * Apply read-only Ledger 2 visual distortions to the CLUT8 framebuffer
   * without mutating any Ledger 1 physics or sheaf state.
   */
  apply(fb, sanityQ16, dirichletEnergyQ16) {
    this.tick++;
    const sanityLoss = Q16_ONE - q16Clamp(sanityQ16, 0, Q16_ONE);
    if (sanityLoss < 8192 && dirichletEnergyQ16 < 16384) return null;

    // 1. Crimson wall-bleed: smear bright Chattur'gha pixels downward
    const bleedCols = (sanityLoss >> 11) + (dirichletEnergyQ16 >> 12);
    for (let b = 0; b < bleedCols; b++) {
      const x = Math.abs(this.lfsr.nextQ16Signed()) % FB_WIDTH;
      const startY = Math.abs(this.lfsr.nextQ16Signed()) % (FB_HEIGHT - 24);
      const len = 8 + (Math.abs(this.lfsr.nextQ16Signed()) & 31);
      for (let dy = 0; dy < len && startY + dy < FB_HEIGHT; dy++) {
        // Bank 0 (0..63) is Chattur'gha crimson
        fb.indices[(startY + dy) * FB_WIDTH + x] = 48 - (dy >> 1);
      }
    }

    // 2. Horizontal scanline tear when sanity drops below 50%
    if (sanityLoss > 32768) {
      const tearY = (this.tick * 7) % (FB_HEIGHT - 12);
      const shift = ((this.lfsr.nextQ16Signed() >> 12) | 0);
      for (let y = tearY; y < tearY + 8; y++) {
        const row = y * FB_WIDTH;
        for (let x = 0; x < FB_WIDTH - 16; x++) {
          const srcX = q16Clamp(x + shift, 0, FB_WIDTH - 1);
          fb.indices[row + x] = fb.indices[row + srcX];
        }
      }
    }

    // 3. Return phantom fourth-wall UI warning when sanity < 35%
    if (sanityLoss > 42598 && ((this.tick >> 5) & 1) === 0) {
      const idx = (this.tick >> 6) % HALLUCINATION_MESSAGES.length;
      return HALLUCINATION_MESSAGES[idx];
    }
    return null;
  }
}
