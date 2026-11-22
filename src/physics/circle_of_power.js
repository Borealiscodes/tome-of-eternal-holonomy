import { Q16_ONE, Q16_HALF, Q16_TAU, q16Mul, q16Cos, q16Sin, q16Div } from '../core/q16.js';
import { ALIGN, CosmologySheaf } from '../core/sheaf_cosmology.js';
import { BezierTidalPatch } from './bezier_patch.js';

export const RUNE_CODEX = {
  CHATTURGHA: { id: 'CHATTURGHA', type: 'ALIGNMENT', align: ALIGN.CHATTURGHA, label: "Chattur'gha" },
  ULYAOTH:    { id: 'ULYAOTH',    type: 'ALIGNMENT', align: ALIGN.ULYAOTH,    label: 'Ulyaoth' },
  XELLOTATH:  { id: 'XELLOTATH',  type: 'ALIGNMENT', align: ALIGN.XELLOTATH,  label: "Xel'lotath" },
  MANTOROK:   { id: 'MANTOROK',   type: 'ALIGNMENT', align: ALIGN.MANTOROK,   label: 'Mantorok' },

  ANTORBOK:   { id: 'ANTORBOK',   type: 'VERB', powerQ16: 65536,  label: 'Antorbok (Project)' },
  BANKOROK:   { id: 'BANKOROK',   type: 'VERB', powerQ16: 78643,  label: 'Bankorok (Protect)' },
  TIER:       { id: 'TIER',       type: 'VERB', powerQ16: 98304,  label: 'Tier (Summon)' },
  NAROKATH:   { id: 'NAROKATH',   type: 'VERB', powerQ16: 85197,  label: 'Narokath (Absorb)' },

  REDGORMOR:  { id: 'REDGORMOR',  type: 'NOUN', powerQ16: 65536,  label: 'Redgormor (Area)' },
  MAGORMOR:   { id: 'MAGORMOR',   type: 'NOUN', powerQ16: 72090,  label: 'Magormor (Item)' },
  ARETAK:     { id: 'ARETAK',     type: 'NOUN', powerQ16: 91750,  label: 'Aretak (Creature)' },

  PARGON:     { id: 'PARGON',     type: 'AMPLIFIER', multiplierQ16: 98304, label: 'Pargon (Power 1.5x)' }
};

const VALID_POINT_COUNTS = new Set([3, 5, 7, 9]);

export class CircleOfPower {
  constructor(pointCount = 3) {
    if (!VALID_POINT_COUNTS.has(pointCount)) {
      throw new Error('Circle of Power must have 3, 5, 7, or 9 points.');
    }
    this.pointCount = pointCount;
    this.sheaf = new CosmologySheaf(pointCount);
    this.patch = new BezierTidalPatch();
    this.slots = new Array(pointCount).fill(null);
    this.nodeCoords = this._computePolygonCoords(pointCount);
    this.edgeFluxQ16 = new Int32Array(pointCount);

    for (let i = 0; i < pointCount; i++) {
      this.sheaf.addEdge(i, (i + 1) % pointCount, Q16_ONE);
    }
  }

  _computePolygonCoords(n) {
    const coords = [];
    const radius = 22937; // ~0.35 in Q16.16
    for (let i = 0; i < n; i++) {
      const angle = q16Div(i * Q16_TAU, n << 16) - (Q16_TAU >> 2);
      const u = Q16_HALF + q16Mul(radius, q16Cos(angle));
      const v = Q16_HALF + q16Mul(radius, q16Sin(angle));
      coords.push({ u, v });
    }
    return coords;
  }

  inscribeRune(slotIdx, runeKey) {
    const rune = RUNE_CODEX[runeKey];
    if (!rune || slotIdx < 0 || slotIdx >= this.pointCount) return false;

    this.slots[slotIdx] = rune;

    if (rune.type === 'ALIGNMENT') {
      this.sheaf.setNodeAlignment(slotIdx, rune.align, Q16_ONE);
    } else if (rune.type === 'AMPLIFIER') {
      for (const edge of this.sheaf.edges) {
        if (edge.u === slotIdx || edge.v === slotIdx) {
          edge.weightQ16 = q16Mul(edge.weightQ16, rune.multiplierQ16);
        }
      }
    }
    return true;
  }

  step() {
    this.patch.step();

    for (let i = 0; i < this.pointCount; i++) {
      const a = this.nodeCoords[i];
      const b = this.nodeCoords[(i + 1) % this.pointCount];
      const midU = (a.u + b.u) >> 1;
      const midV = (a.v + b.v) >> 1;

      const grad = this.patch.gradient(midU, midV);
      const dirU = b.u - a.u;
      const dirV = b.v - a.v;

      const flow = Math.abs(q16Mul(grad.dSdu, dirU) + q16Mul(grad.dSdv, dirV));
      this.edgeFluxQ16[i] += flow >> 2;
    }

    return this.sheaf.step();
  }

  evaluateSpell() {
    let alignmentRune = null;
    let verbRune = null;
    let nounRune = null;
    let pargonCount = 0;

    for (const slot of this.slots) {
      if (!slot) continue;
      if (slot.type === 'ALIGNMENT') alignmentRune = slot;
      if (slot.type === 'VERB') verbRune = slot;
      if (slot.type === 'NOUN') nounRune = slot;
      if (slot.type === 'AMPLIFIER') pargonCount++;
    }

    const valid = Boolean(alignmentRune && verbRune && nounRune);
    let potencyQ16 = valid ? (verbRune.powerQ16 + nounRune.powerQ16) >> 1 : 0;

    for (let p = 0; p < pargonCount; p++) {
      potencyQ16 = q16Mul(potencyQ16, RUNE_CODEX.PARGON.multiplierQ16);
    }

    return {
      valid,
      alignment: alignmentRune ? alignmentRune.id : 'NONE',
      incantation: this.slots.filter(Boolean).map(r => r.id).join(' -> '),
      pargonCount,
      potencyQ16,
      dirichletEnergyQ16: this.sheaf.dirichletEnergyQ16,
      sanityQ16: this.sheaf.sanityQ16
    };
  }
}
