import { Q16_ONE, q16Clamp, q16Cos, q16Sin, Q16_TAU, q16Div } from '../core/q16.js';
import { ALIGN } from '../core/sheaf_cosmology.js';

export const FB_WIDTH = 480;
export const FB_HEIGHT = 272;

const BAYER_4X4 = Uint8Array.of(
   0,  8,  2, 10,
  12,  4, 14,  6,
   3, 11,  1,  9,
  15,  7, 13,  5
);

export function buildCosmologyCLUT8() {
  const lut = new Uint32Array(256);
  const ramps = Array.of(
    Array.of(235,  22,  38), // 0: Chattur'gha (Deep Crimson)
    Array.of( 28, 115, 245), // 1: Ulyaoth (Eldritch Cobalt)
    Array.of( 26, 220, 110), // 2: Xel'lotath (Necrotic Emerald)
    Array.of(165,  52, 235)  // 3: Mantorok (Void Violet)
  );

  for (let bank = 0; bank < 4; bank++) {
    const ramp = ramps.at(bank);
    const baseR = ramp.at(0);
    const baseG = ramp.at(1);
    const baseB = ramp.at(2);
    for (let i = 0; i < 64; i++) {
      // Deep obsidian shadows at low indices, glowing incandescence at high indices
      const curve = (i * i) >> 6;
      const r = Math.min(255, ((baseR * curve) >> 6) + (i > 52 ? (i - 52) * 18 : 0));
      const g = Math.min(255, ((baseG * curve) >> 6) + (i > 52 ? (i - 52) * 18 : 0));
      const b = Math.min(255, ((baseB * curve) >> 6) + (i > 52 ? (i - 52) * 18 : 0));
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

  /** Render warped Bezier manifold with radial vignette & high-contrast Bayer dithering */
  renderTidalSurface(patch, dominantAlign = ALIGN.MANTOROK, dirichletEnergyQ16 = 0) {
    const bankOffset = (dominantAlign & 3) << 6;
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

    const cx = FB_WIDTH >> 1;
    const cy = FB_HEIGHT >> 1;

    for (let y = 0; y < FB_HEIGHT; y++) {
      const gy = y >> 4;
      const fy = y & 15;
      const rowOff = y * FB_WIDTH;
      const bayerRow = (y & 3) << 2;
      const dy = y - cy;
      const dy2 = (dy * dy) >> 4;

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

        // Radial vignette so the outer void falls into deep abyssal shadow
        const dx = x - cx;
        const distSq = ((dx * dx) >> 5) + dy2;
        const vignette = q16Clamp(26 - (distSq >> 6), 2, 26);

        // Amplify wave displacement + Dirichlet topological contour ridges
        const waveBoost = (h >> 9) + ((dirichletEnergyQ16 >> 13) & 7);
        const contour = Math.abs((h >> 10) & 7) === 0 ? 6 : 0;
        const baseShade = q16Clamp(vignette + waveBoost + contour, 1, 52);

        const threshold = BAYER_4X4[bayerRow + (x & 3)];
        this.indices[rowOff + x] = bankOffset + q16Clamp(baseShade + (threshold >> 1), 1, 63);
      }
    }

    // Draw warped manifold lattice lines deformed by Bezier height
    const latticeColor = bankOffset + 24;
    for (let gy = 2; gy < rows - 2; gy += 2) {
      for (let gx = 2; gx < cols - 3; gx += 2) {
        const h0 = grid[gy * cols + gx] >> 11;
        const h1 = grid[gy * cols + (gx + 2)] >> 11;
        this.drawLine(gx * stepX, gy * stepY + h0, (gx + 2) * stepX, gy * stepY + h1, latticeColor);
      }
    }
  }

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

  drawCircleOutline(cx, cy, r, colorIdx, segments = 32) {
    let prevX = cx + r;
    let prevY = cy;
    for (let i = 1; i <= segments; i++) {
      const angle = q16Div(i * Q16_TAU, segments << 16);
      const nx = cx + ((r * q16Cos(angle)) >> 16);
      const ny = cy + ((r * q16Sin(angle)) >> 16);
      this.drawLine(prevX, prevY, nx, ny, colorIdx);
      prevX = nx;
      prevY = ny;
    }
  }

  drawFilledCircle(cx, cy, r, colorIdx) {
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

  /** Draw distinct Eternal Darkness geometric sigil inside each rune node */
  drawRuneGlyph(cx, cy, runeId, colorIdx) {
    const r = 8;
    // Outer medallic seal
    this.drawCircleOutline(cx, cy, r + 3, colorIdx - 10, 16);

    switch (runeId) {
      case 'CHATTURGHA': // Jagged crimson claw / downward Fang triad
        this.drawLine(cx - r, cy - 4, cx, cy + r, colorIdx);
        this.drawLine(cx + r, cy - 4, cx, cy + r, colorIdx);
        this.drawLine(cx, cy - r, cx, cy + r, colorIdx);
        this.drawLine(cx - 5, cy - 2, cx + 5, cy - 2, colorIdx);
        break;
      case 'ULYAOTH': // Astral diamond & central all-seeing eye
        this.drawLine(cx, cy - r, cx + r, cy, colorIdx);
        this.drawLine(cx + r, cy, cx, cy + r, colorIdx);
        this.drawLine(cx, cy + r, cx - r, cy, colorIdx);
        this.drawLine(cx - r, cy, cx, cy - r, colorIdx);
        this.drawCircleOutline(cx, cy, 3, colorIdx, 10);
        break;
      case 'XELLOTATH': // Twin split mind-crescents & asymmetric fork
        this.drawLine(cx - 6, cy - r, cx - 2, cy, colorIdx);
        this.drawLine(cx - 2, cy, cx - 6, cy + r, colorIdx);
        this.drawLine(cx + 6, cy - r, cx + 2, cy, colorIdx);
        this.drawLine(cx + 2, cy, cx + 6, cy + r, colorIdx);
        this.drawLine(cx - 2, cy, cx + 2, cy, colorIdx);
        break;
      case 'MANTOROK': // Binding chaos cross & locked void square
        this.drawLine(cx - r, cy - r, cx + r, cy + r, colorIdx);
        this.drawLine(cx + r, cy - r, cx - r, cy + r, colorIdx);
        this.drawLine(cx - 4, cy - 4, cx + 4, cy - 4, colorIdx);
        this.drawLine(cx + 4, cy - 4, cx + 4, cy + 4, colorIdx);
        this.drawLine(cx + 4, cy + 4, cx - 4, cy + 4, colorIdx);
        this.drawLine(cx - 4, cy + 4, cx - 4, cy - 4, colorIdx);
        break;
      case 'PARGON': // 8-ray radiant power star
        this.drawLine(cx - r, cy, cx + r, cy, colorIdx);
        this.drawLine(cx, cy - r, cx, cy + r, colorIdx);
        this.drawLine(cx - 6, cy - 6, cx + 6, cy + 6, colorIdx);
        this.drawLine(cx + 6, cy - 6, cx - 6, cy + 6, colorIdx);
        break;
      case 'ANTORBOK': // Outward projection arrow
        this.drawLine(cx, cy + r, cx, cy - r, colorIdx);
        this.drawLine(cx - 5, cy - 2, cx, cy - r, colorIdx);
        this.drawLine(cx + 5, cy - 2, cx, cy - r, colorIdx);
        break;
      case 'BANKOROK': // Protective ward shield
        this.drawLine(cx - 6, cy - 6, cx + 6, cy - 6, colorIdx);
        this.drawLine(cx - 6, cy - 6, cx - 6, cy + 2, colorIdx);
        this.drawLine(cx + 6, cy - 6, cx + 6, cy + 2, colorIdx);
        this.drawLine(cx - 6, cy + 2, cx, cy + r, colorIdx);
        this.drawLine(cx + 6, cy + 2, cx, cy + r, colorIdx);
        break;
      case 'TIER': // Summoning gateway portal
        this.drawLine(cx - 5, cy + r, cx - 5, cy - 5, colorIdx);
        this.drawLine(cx - 5, cy - 5, cx + 5, cy - 5, colorIdx);
        this.drawLine(cx + 5, cy - 5, cx + 5, cy + r, colorIdx);
        this.drawLine(cx, cy - 2, cx, cy + 5, colorIdx);
        break;
      case 'NAROKATH': // Inward absorption spiral/hourglass
        this.drawLine(cx - 6, cy - 6, cx + 6, cy + 6, colorIdx);
        this.drawLine(cx + 6, cy - 6, cx - 6, cy + 6, colorIdx);
        this.drawLine(cx - 6, cy - 6, cx + 6, cy - 6, colorIdx);
        this.drawLine(cx - 6, cy + 6, cx + 6, cy + 6, colorIdx);
        break;
      default: // Nouns (Redgormor, Magormor, Aretak): Inscribed triangle + core
        this.drawLine(cx, cy - r, cx + r, cy + 6, colorIdx);
        this.drawLine(cx + r, cy + 6, cx - r, cy + 6, colorIdx);
        this.drawLine(cx - r, cy + 6, cx, cy - r, colorIdx);
        break;
    }
  }

  resolveRGBA32() {
    for (let i = 0; i < this.indices.length; i++) {
      this.rgba32[i] = this.clut[this.indices[i]];
    }
    return this.rgba32;
  }
}
