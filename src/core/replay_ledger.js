import { CircleOfPower, RUNE_CODEX } from '../physics/circle_of_power.js';

const RUNE_KEYS = Object.keys(RUNE_CODEX);
export const OP_INSCRIBE = 1;
export const OP_BRUSH = 2;

/**
 * Deterministic < 4 KB Input Ledger & Bit-Exact State Verifier
 * Guarantees Ledger 1 cosmology state is 100% reproducible regardless of Ledger 2 glitches.
 */
export class ReplayLedger {
  constructor(pointCount = 5) {
    this.pointCount = pointCount;
    this.events = []; // [tick, op, a, b, c]
  }

  recordInscribe(tick, slotIdx, runeKey) {
    const runeIdx = RUNE_KEYS.indexOf(runeKey);
    if (runeIdx >= 0) {
      this.events.push([tick | 0, OP_INSCRIBE, slotIdx | 0, runeIdx, 0]);
    }
  }

  recordBrush(tick, uQ16, vQ16, forceQ16) {
    this.events.push([tick | 0, OP_BRUSH, uQ16 | 0, vQ16 | 0, forceQ16 | 0]);
  }

  /** Serialize into compact < 4 KB JSON/CSV payload */
  serialize() {
    const lines = [`V1,${this.pointCount}`];
    for (const ev of this.events) {
      lines.push(ev.join(','));
    }
    return lines.join('\n');
  }

  /** Deterministically replay log from tick 0..totalTicks and return FNV-1a state digest */
  static verifyReplay(serializedLog, totalTicks) {
    const lines = serializedLog.trim().split('\n');
    const [, countStr] = lines[0].split(',');
    const circle = new CircleOfPower(Number(countStr));

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      parsed.push(lines[i].split(',').map(Number));
    }

    let cursor = 0;
    for (let t = 0; t <= totalTicks; t++) {
      while (cursor < parsed.length && parsed[cursor][0] === t) {
        const [, op, a, b, c] = parsed[cursor++];
        if (op === OP_INSCRIBE) {
          circle.inscribeRune(a, RUNE_KEYS[b]);
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

  /** Bit-exact 32-bit FNV-1a digest over all Ledger 1 Q16.16 state arrays */
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
      for (let c = 0; c < 4; c++) mix32(stalk[c]);
    }
    for (let i = 0; i < 16; i++) mix32(circle.patch.heights[i]);

    return (hash >>> 0).toString(16).padStart(8, '0');
  }
}
