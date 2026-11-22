import { Q16_ONE, q16Clamp } from '../core/q16.js';
import { ALIGN } from '../core/sheaf_cosmology.js';

export const FB_WIDTH = 480;
export const FB_HEIGHT = 272;

// Classic 4x4 Bayer Ordered Dithering Matrix (0..15)
const BAYER_4X4 = new Uint8Array([
   0,  8,  2, 10,
  12,  4, 14,  6,
   3, 11,  1,  9,
  15,  7, 13,  5
]);

/**
 * Generates a 256-color (CLUT8) RGBA32 lookup table:
 *   0..63:    Chattur'gha (Crimson / Flesh)
 *   64..127:  Ulyaoth (Cobalt / Astral)
 *   128..191: Xel'lotath (Emerald / Mind)
 *   192..255: Mantorok (Obsidian Violet / Void)
 */
export function buildCosmologyCLUT8() {
  const lut = new Uint32Array(256);
  const ramps = [,   // Chattur'gha,  // Ulyaoth,  // Xel'lotath
    [168, 64, 240]   // Mantorok
  ];

  for (let bank = 0; bank < 4; bank++) {
    const [baseR, baseG, baseB] = ramps[bank];
    for (let i = 0; i < 64; i++) {
      const r = Math.min(255, ((baseR * i) >> 6) + (i > 54 ? (i - 54) * 14 : 0));
      const g = Math.min(255, ((baseG * i) >> 6) + (i > 54 ? (i - 54) * 14 : 0));
      const b = Math.min(255, ((baseB * i) >> 6) + (i > 54 ? (i - 54) * 14 : 0));
      // Little-endian ABGR for Uint32Array ImageData
      lut[(bank << 6) + i] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
  }
  return lut;
}

export class RetroFramebuffer {
  constructor() {
    this.indices = new Uint8Array(FB_WIDTH * FB_HEIGHT);
    this.clut = buildCosmologyCLUT8();
    this.rgba32 = new Uint32Array(FB_WIDTH * FB_HEIGHT);
  }

  /** Render the 4x4 Bezier tidal surface using 4x4 Bayer ordered dithering */
  renderTidalSurface(patch, dominantAlign = ALIGN.MANTOROK) {
    const bankOffset = (dominantAlign & 3) << 6;
    // Sample coarse 30x17 grid and bilinearly interpolate for 60fps mobile speed
    const stepX = 16;
    const stepY = 16;
    const cols = (FB_WIDTH / stepX) + 1;
    const rows = (FB_HEIGHT / stepY) + 1;
    const grid = new Int32Array(cols * rows);

    for (let gy = 0; gy < rows; gy++) {
      const vQ16 = Math.min(Q16_ONE, ((gy * stepY) << 16) / FB_HEIGHT | 0);
      for (let gx = 0; gx < cols; gx++) {
        const uQ16 = Math.min(Q16_ONE, ((gx * stepX) << 16) / FB_WIDTH | 0);
        grid[gy * cols + gx] = patch.evaluate(uQ16, vQ16);
      }
    }

    for (let y = 0; y < FB_HEIGHT; y++) {
      const gy = y >> 4;
      const fy = y & 15;
      const rowOff = y * FB_WIDTH;
      const bayerRow = (y & 3) << 2;

      for (let x = 0; x < FB_WIDTH; x++) {
        const gx = x >> 4;
        const fx = x & 15;

        const h00 = grid[gy * cols + gx];
        const h10 = grid[gy * cols + gx + 1];
        const h01 = grid[(gy + 1) * cols + gx];
        const h11 = grid[(gy + 1) * cols + gx + 1];

        const top = h00 + (((h10 - h00) * fx) >> 4);
        const bot = h01 + (((h11 - h01) * fx) >> 4);
        const h = top + (((bot - top) * fy) >> 4);

        // Map height [-65536..65536] -> shade [4..58] + 4x4 Bayer dither threshold
        const baseShade = q16Clamp(((h + Q16_ONE) >> 11), 2, 56);
        const threshold = BAYER_4X4[bayerRow + (x & 3)] >> 2;
        this.indices[rowOff + x] = bankOffset + q16Clamp(baseShade + threshold, 1, 63);
      }
    }
  }

  /** Draw Bresenham integer line onto CLUT8 buffer */
  drawLine(x0, y0, x1, y1, colorIdx) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      if (x0 >= 0 && x0 < FB_WIDTH && y0 >= 0 && y0 < FB_HEIGHT) {
        this.indices[y0 * FB_WIDTH + x0] = colorIdx;
      }
      if (x0 === x1 && y0 === y1) break;
      const e2 = err << 1;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  /** Draw filled integer circle for Circle of Power rune vertices */
  drawCircle(cx, cy, r, colorIdx) {
    cx |= 0; cy |= 0; r |= 0;
    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= FB_HEIGHT) continue;
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const x = cx + dx;
          if (x >= 0 && x < FB_WIDTH) {
            this.indices[y * FB_WIDTH + x] = colorIdx;
          }
        }
      }
    }
  }

  /** Resolve 8-bit CLUT8 indices into 32-bit RGBA pixels */
  resolveRGBA32() {
    for (let i = 0; i < this.indices.length; i++) {
      this.rgba32[i] = this.clut[this.indices[i]];
    }
    return this.rgba32;
  }
}
