import { CircleOfPower, RUNE_CODEX } from '../physics/circle_of_power.js';

const RUNE_KEYS = Object.keys(RUNE_CODEX);
export const OP_INSCRIBE = 1;
export const OP_BRUSH = 2;

export class ReplayLedger {
  constructor(pointCount = 5) {
    this.pointCount = pointCount;
    this.events = [];
  }

  recordInscribe(tick, slotIdx, runeKey) {
    const runeIdx = RUNE_KEYS.indexOf(runeKey);
    if (runeIdx >= 0) {
      this.events.push(Array.of(tick | 0, OP_INSCRIBE, slotIdx | 0, runeIdx, 0));
    }
  }

  recordBrush(tick, uQ16, vQ16, forceQ16) {
    this.events.push(Array.of(tick | 0, OP_BRUSH, uQ16 | 0, vQ16 | 0, forceQ16 | 0));
  }

  serialize() {
    const lines = Array.of('V1,' + this.pointCount);
    for (const ev of this.events) {
      lines.push(ev.join(','));
    }
    return lines.join('\n');
  }

  static verifyReplay(serializedLog, totalTicks) {
    const lines = serializedLog.trim().split('\n');
    const headerParts = lines.at(0).split(',');
    const circle = new CircleOfPower(Number(headerParts.at(1)));

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines.at(i)) continue;
      parsed.push(lines.at(i).split(',').map(Number));
    }

    let cursor = 0;
    for (let t = 0; t <= totalTicks; t++) {
      while (cursor < parsed.length && parsed.at(cursor).at(0) === t) {
        const ev = parsed.at(cursor++);
        const op = ev.at(1);
        const a = ev.at(2);
        const b = ev.at(3);
        const c = ev.at(4);
        if (op === OP_INSCRIBE) {
          circle.inscribeRune(a, RUNE_KEYS.at(b));
        } else if (op === OP_BRUSH) {
          circle.patch.applyBrushImpulse(a, b, c);
        }
      }
      circle.step();
    }

    return {
      circle,
      digestHex: ReplayLedger.computeStateDigest(circle)
    };
  }

  static computeStateDigest(circle) {
    let hash = 0x811c9dc5;
    const mix32 = (v) => {
      hash ^= v & 0xff;
      hash = Math.imul(hash, 0x01000193);
      hash ^= (v >> 8) & 0xff;
      hash = Math.imul(hash, 0x01000193);
      hash ^= (v >> 16) & 0xff;
      hash = Math.imul(hash, 0x01000193);
      hash ^= (v >> 24) & 0xff;
      hash = Math.imul(hash, 0x01000193);
    };

    mix32(circle.sheaf.sanityQ16);
    mix32(circle.sheaf.dirichletEnergyQ16);
    for (const stalk of circle.sheaf.stalks) {
      for (let c = 0; c < 4; c++) mix32(stalk.at(c));
    }
    for (let i = 0; i < 16; i++) mix32(circle.patch.heights.at(i));

    return (hash >>> 0).toString(16).padStart(8, '0');
  }
}
