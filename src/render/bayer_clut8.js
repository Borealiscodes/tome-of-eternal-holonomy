import { Q16_ONE, q16Clamp, q16Cos, q16Sin, Q16_TAU, q16Div } from '../core/q16.js';
import { ALIGN } from '../core/sheaf_cosmology.js';

export const FB_WIDTH = 480;
export const FB_HEIGHT = 272;

const BAYER_4X4 = Uint8Array.of(0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);

export function buildCosmologyCLUT8() {
  const lut = new Uint32Array(256);
  const ramps = Array.of(
    Array.of(235, 24, 42),
    Array.of(30, 120, 248),
    Array.of(28, 224, 112),
    Array.of(170, 58, 240)
  );
  for (let bank = 0; bank < 4; bank++) {
    const r0 = ramps.at(bank).at(0), g0 = ramps.at(bank).at(1), b0 = ramps.at(bank).at(2);
    for (let i = 0; i < 64; i++) {
      const c = (i * i) >> 6;
      const hi = i > 50 ? (i - 50) * 16 : 0;
      const r = Math.min(255, ((r0 * c) >> 6) + hi);
      const g = Math.min(255, ((g0 * c) >> 6) + hi);
      const b = Math.min(255, ((b0 * c) >> 6) + hi);
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

  renderTidalSurface(patch, dominantAlign = ALIGN.MANTOROK, dirichletEnergyQ16 = 0) {
    const bankOffset = (dominantAlign & 3) << 6;
    const cols = 31, rows = 18;
    const grid = new Int32Array(cols * rows);
    for (let gy = 0; gy < rows; gy++) {
      const vQ16 = Math.min(Q16_ONE, ((gy << 20) / FB_HEIGHT) | 0);
      for (let gx = 0; gx < cols; gx++) {
        const uQ16 = Math.min(Q16_ONE, ((gx << 20) / FB_WIDTH) | 0);
        grid[gy * cols + gx] = patch.evaluate(uQ16, vQ16);
      }
    }
    const cx = FB_WIDTH >> 1, cy = FB_HEIGHT >> 1;
    for (let y = 0; y < FB_HEIGHT; y++) {
      const gy = y >> 4, fy = y & 15, rowOff = y * FB_WIDTH, bRow = (y & 3) << 2;
      const dy = y - cy, dy2 = (dy * dy) >> 4;
      for (let x = 0; x < FB_WIDTH; x++) {
        const gx = x >> 4, fx = x & 15;
        const h00 = grid[gy * cols + gx], h10 = grid[gy * cols + gx + 1];
        const h01 = grid[(gy + 1) * cols + gx], h11 = grid[(gy + 1) * cols + gx + 1];
        const top = h00 + (((h10 - h00) * fx) >> 4);
        const bot = h01 + (((h11 - h01) * fx) >> 4);
        const h = top + (((bot - top) * fy) >> 4);
        const dx = x - cx;
        const vig = q16Clamp(28 - ((((dx * dx) >> 5) + dy2) >> 6), 3, 28);
        const shade = q16Clamp(vig + (h >> 8) + ((dirichletEnergyQ16 >> 13) & 7), 2, 52);
        const dither = BAYER_4X4[bRow + (x & 3)] >> 1;
        this.indices[rowOff + x] = bankOffset + q16Clamp(shade + dither, 1, 63);
      }
    }
    const lat = bankOffset + 26;
    for (let gy = 1; gy < rows - 1; gy += 2) {
      for (let gx = 1; gx < cols - 2; gx += 2) {
        const h0 = grid[gy * cols + gx] >> 10;
        const h1 = grid[gy * cols + gx + 2] >> 10;
        this.drawLine(gx << 4, (gy << 4) + h0, (gx + 2) << 4, (gy << 4) + h1, lat);
      }
    }
  }

  drawLine(x0, y0, x1, y1, colorIdx) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      if (x0 >= 0 && x0 < FB_WIDTH && y0 >= 0 && y0 < FB_HEIGHT) this.indices[y0 * FB_WIDTH + x0] = colorIdx;
      if (x0 === x1 && y0 === y1) break;
      const e2 = err << 1;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  drawCircleOutline(cx, cy, r, colorIdx, segs = 32) {
    let px = cx + r, py = cy;
    for (let i = 1; i <= segs; i++) {
      const a = q16Div(i * Q16_TAU, segs << 16);
      const nx = cx + ((r * q16Cos(a)) >> 16), ny = cy + ((r * q16Sin(a)) >> 16);
      this.drawLine(px, py, nx, ny, colorIdx);
      px = nx; py = ny;
    }
  }

  drawFilledCircle(cx, cy, r, colorIdx) {
    for (let dy = -r; dy <= r; dy++) {
      const y = cy + dy;
      if (y < 0 || y >= FB_HEIGHT) continue;
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r * r) {
          const x = cx + dx;
          if (x >= 0 && x < FB_WIDTH) this.indices[y * FB_WIDTH + x] = colorIdx;
        }
      }
    }
  }

  drawRuneGlyph(cx, cy, runeId, c) {
    const r = 8;
    this.drawCircleOutline(cx, cy, r + 3, c - 10, 16);
    if (runeId === 'CHATTURGHA') {
      this.drawLine(cx - r, cy - 4, cx, cy + r, c);
      this.drawLine(cx + r, cy - 4, cx, cy + r, c);
      this.drawLine(cx, cy - r, cx, cy + r, c);
    } else if (runeId === 'ULYAOTH') {
      this.drawLine(cx, cy - r, cx + r, cy, c);
      this.drawLine(cx + r, cy, cx, cy + r, c);
      this.drawLine(cx, cy + r, cx - r, cy, c);
      this.drawLine(cx - r, cy, cx, cy - r, c);
      this.drawCircleOutline(cx, cy, 3, c, 10);
    } else if (runeId === 'XELLOTATH') {
      this.drawLine(cx - 6, cy - r, cx - 2, cy, c);
      this.drawLine(cx - 2, cy, cx - 6, cy + r, c);
      this.drawLine(cx + 6, cy - r, cx + 2, cy, c);
      this.drawLine(cx + 2, cy, cx + 6, cy + r, c);
    } else if (runeId === 'MANTOROK') {
      this.drawLine(cx - r, cy - r, cx + r, cy + r, c);
      this.drawLine(cx + r, cy - r, cx - r, cy + r, c);
      this.drawCircleOutline(cx, cy, 5, c, 8);
    } else if (runeId === 'PARGON') {
      this.drawLine(cx - r, cy, cx + r, cy, c);
      this.drawLine(cx, cy - r, cx, cy + r, c);
      this.drawLine(cx - 6, cy - 6, cx + 6, cy + 6, c);
      this.drawLine(cx + 6, cy - 6, cx - 6, cy + 6, c);
    } else {
      this.drawLine(cx, cy - r, cx + r, cy + 6, c);
      this.drawLine(cx + r, cy + 6, cx - r, cy + 6, c);
      this.drawLine(cx - r, cy + 6, cx, cy - r, c);
    }
  }

  resolveRGBA32() {
    for (let i = 0; i < this.indices.length; i++) this.rgba32[i] = this.clut[this.indices[i]];
    return this.rgba32;
  }
}
