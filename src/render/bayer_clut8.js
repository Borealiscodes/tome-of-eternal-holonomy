import { Q16_ONE, Q16_TAU, q16Clamp, q16Cos, q16Sin, q16Mul, q16Div } from '../core/q16.js';
import { ALIGN } from '../core/sheaf_cosmology.js';

export const FB_WIDTH = 480;
export const FB_HEIGHT = 272;

const BAYER_4X4 = Uint8Array.of(0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5);

export function buildCosmologyCLUT8() {
  const lut = new Uint32Array(256);
  const ramps = Array.of(
    Array.of(245, 30, 52),   // 0: Chattur'gha (Crimson)
    Array.of(38, 155, 255),  // 1: Ulyaoth (Eldritch Cyan-Cobalt)
    Array.of(42, 238, 138),  // 2: Xel'lotath (Necrotic Emerald)
    Array.of(188, 72, 255)   // 3: Mantorok (Void Amethyst)
  );
  for (let bank = 0; bank < 4; bank++) {
    const r0 = ramps.at(bank).at(0), g0 = ramps.at(bank).at(1), b0 = ramps.at(bank).at(2);
    for (let i = 0; i < 64; i++) {
      const c = (i * i) >> 6;
      const rim = i > 46 ? (i - 46) * 11 : 0;
      const r = Math.min(255, ((r0 * c) >> 6) + rim);
      const g = Math.min(255, ((g0 * c) >> 6) + rim);
      const b = Math.min(255, ((b0 * c) >> 6) + rim);
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
    this.yawQ16 = 51472; // ~45 deg isometric diamond
  }

  /** Project normalized Q16.16 (u, v, height) onto 480x272 screen space */
  project3D(uQ16, vQ16, hQ16) {
    const x = uQ16 - 32768;
    const y = vQ16 - 32768;
    const cosA = q16Cos(this.yawQ16);
    const sinA = q16Sin(this.yawQ16);
    const rx = q16Mul(x, cosA) - q16Mul(y, sinA);
    const ry = q16Mul(x, sinA) + q16Mul(y, cosA);

    const sx = (FB_WIDTH >> 1) + ((rx * 250) >> 16);
    const sy = (FB_HEIGHT >> 1) + ((ry * 145) >> 16) - ((hQ16 * 52) >> 16);
    return { sx, sy };
  }

  /** Render silky-smooth 3D triangulated Bezier surface with Phong rim-lighting & Bayer dithering */
  renderTidalSurface(patch, dominantAlign = ALIGN.MANTOROK, yawDelta = 0) {
    this.yawQ16 = (this.yawQ16 + yawDelta) % Q16_TAU;
    const bank = (dominantAlign & 3) << 6;
    this.indices.fill(bank + 2);

    const N = 14;
    const pts = new Array((N + 1) * (N + 1));
    const heights = new Int32Array((N + 1) * (N + 1));

    for (let j = 0; j <= N; j++) {
      const v = q16Div(j << 16, N << 16);
      for (let i = 0; i <= N; i++) {
        const u = q16Div(i << 16, N << 16);
        const h = patch.evaluate(u, v);
        heights[j * (N + 1) + i] = h;
        pts[j * (N + 1) + i] = this.project3D(u, v, h);
      }
    }

    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const idx = j * (N + 1) + i;
        const p00 = pts[idx], p10 = pts[idx + 1];
        const p01 = pts[idx + N + 1], p11 = pts[idx + N + 2];

        const h00 = heights[idx], h10 = heights[idx + 1], h01 = heights[idx + N + 1];
        // Surface normal slope -> Phong specular rim shade
        const nx = (h00 - h10) >> 10;
        const ny = (h00 - h01) >> 10;
        const shade = q16Clamp(24 + nx + ny + (h00 >> 11), 6, 56);

        this.fillDitheredTri(p00, p10, p11, bank, shade);
        this.fillDitheredTri(p00, p11, p01, bank, shade - 2);

        // Crisp translucent wireframe facet edges (non-dual-holonomy-psp style)
        const wire = bank + q16Clamp(shade + 12, 18, 62);
        this.drawLine(p00.sx, p00.sy, p10.sx, p10.sy, wire);
        this.drawLine(p00.sx, p00.sy, p01.sx, p01.sy, wire);
        this.drawLine(p00.sx, p00.sy, p11.sx, p11.sy, wire - 5);
      }
    }
  }

  fillDitheredTri(a, b, c, bank, shade) {
    const minX = q16Clamp(Math.min(a.sx, b.sx, c.sx), 0, FB_WIDTH - 1);
    const maxX = q16Clamp(Math.max(a.sx, b.sx, c.sx), 0, FB_WIDTH - 1);
    const minY = q16Clamp(Math.min(a.sy, b.sy, c.sy), 0, FB_HEIGHT - 1);
    const maxY = q16Clamp(Math.max(a.sy, b.sy, c.sy), 0, FB_HEIGHT - 1);

    const area = (b.sx - a.sx) * (c.sy - a.sy) - (b.sy - a.sy) * (c.sx - a.sx);
    if (area === 0) return;

    for (let y = minY; y <= maxY; y++) {
      const row = y * FB_WIDTH;
      const bRow = (y & 3) << 2;
      for (let x = minX; x <= maxX; x++) {
        const w0 = (b.sx - a.sx) * (y - a.sy) - (b.sy - a.sy) * (x - a.sx);
        const w1 = (c.sx - b.sx) * (y - b.sy) - (c.sy - b.sy) * (x - b.sx);
        const w2 = (a.sx - c.sx) * (y - c.sy) - (a.sy - c.sy) * (x - c.sx);
        if ((area > 0 && w0 >= 0 && w1 >= 0 && w2 >= 0) || (area < 0 && w0 <= 0 && w1 <= 0 && w2 <= 0)) {
          const dither = BAYER_4X4[bRow + (x & 3)] >> 2;
          this.indices[row + x] = bank + q16Clamp(shade + dither, 4, 60);
        }
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

  drawCircleOutline(cx, cy, r, colorIdx, segs = 24) {
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
    const r = 7;
    this.drawCircleOutline(cx, cy, r + 3, c - 8, 16);
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
      this.drawLine(cx - 5, cy - r, cx - 2, cy, c);
      this.drawLine(cx - 2, cy, cx - 5, cy + r, c);
      this.drawLine(cx + 5, cy - r, cx + 2, cy, c);
      this.drawLine(cx + 2, cy, cx + 5, cy + r, c);
    } else if (runeId === 'MANTOROK') {
      this.drawLine(cx - r, cy - r, cx + r, cy + r, c);
      this.drawLine(cx + r, cy - r, cx - r, cy + r, c);
      this.drawCircleOutline(cx, cy, 4, c, 8);
    } else if (runeId === 'PARGON') {
      this.drawLine(cx - r, cy, cx + r, cy, c);
      this.drawLine(cx, cy - r, cx, cy + r, c);
      this.drawLine(cx - 5, cy - 5, cx + 5, cy + 5, c);
      this.drawLine(cx + 5, cy - 5, cx - 5, cy + 5, c);
    } else {
      this.drawLine(cx, cy - r, cx + r, cy + 5, c);
      this.drawLine(cx + r, cy + 5, cx - r, cy + 5, c);
      this.drawLine(cx - r, cy + 5, cx, cy - r, c);
    }
  }

  resolveRGBA32() {
    for (let i = 0; i < this.indices.length; i++) this.rgba32[i] = this.clut[this.indices[i]];
    return this.rgba32;
  }
}
