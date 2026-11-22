/**
 * Deterministic Shodo Brush Gesture Recognizer (inspired by Okami-Shodo-Enso-Canvas)
 * Classifies freehand strokes into Eternal Darkness runes without floating-point ML.
 */
export class ShodoRuneBrush {
  constructor() {
    this.points = [];
  }

  beginStroke(x, y) {
    this.points = Array.of({ x: x | 0, y: y | 0 });
  }

  addPoint(x, y) {
    const last = this.points.at(-1);
    if (!last) return;
    const dx = (x | 0) - last.x;
    const dy = (y | 0) - last.y;
    if (dx * dx + dy * dy >= 9) {
      this.points.push({ x: x | 0, y: y | 0 });
    }
  }

  classifyAndClear() {
    const pts = this.points;
    this.points = [];
    if (pts.length < 4) return null;

    let minX = 9999, maxX = -9999, minY = 9999, maxY = -9999;
    let pathLen = 0;
    let turns = 0;

    for (let i = 0; i < pts.length; i++) {
      const p = pts.at(i);
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
      if (i > 0) {
        const prev = pts.at(i - 1);
        pathLen += Math.hypot(p.x - prev.x, p.y - prev.y) | 0;
      }
      if (i >= 2) {
        const p0 = pts.at(i - 2), p1 = pts.at(i - 1);
        const dot = (p1.x - p0.x) * (p.x - p1.x) + (p1.y - p0.y) * (p.y - p1.y);
        if (dot < 0) turns++;
      }
    }

    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    const start = pts.at(0), end = pts.at(-1);
    const closeDist = Math.hypot(end.x - start.x, end.y - start.y) | 0;
    const diag = Math.hypot(w, h) | 0;

    if (diag < 18) return null;

    // 1. Closed Enso Loop -> PARGON (Amplifier) or ULYAOTH (Diamond)
    if (closeDist < (diag >> 1) && pathLen > diag * 2) {
      return turns >= 3 ? 'ULYAOTH' : 'PARGON';
    }
    // 2. Vertical Slash -> ANTORBOK (Project)
    if (h > w * 2 && turns <= 1) return 'ANTORBOK';
    // 3. Horizontal Slash -> BANKOROK (Protect)
    if (w > h * 2 && turns <= 1) return 'BANKOROK';
    // 4. Sharp Chevron V -> CHATTURGHA (Matter)
    if (turns === 1 || turns === 2) return end.y < maxY - (h >> 2) ? 'CHATTURGHA' : 'TIER';
    // 5. Multi-turn Jagged / Cross -> XELLOTATH or MANTOROK
    return turns >= 4 ? 'XELLOTATH' : 'MANTOROK';
  }
}
