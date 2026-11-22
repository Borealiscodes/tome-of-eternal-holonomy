import { Q16_ONE, q16Mul, q16Clamp } from './q16.js';

// 4D Stalk Channels: [Chattur'gha, Ulyaoth, Xel'lotath, Mantorok]
export const ALIGN = {
  CHATTURGHA: 0, // Matter / Flesh (Red)    -> Dominates Xel'lotath
  ULYAOTH: 1,    // Magick / Plane (Blue)   -> Dominates Chattur'gha
  XELLOTATH: 2,  // Sanity / Mind (Green)   -> Dominates Ulyaoth
  MANTOROK: 3    // Corpse-God / Binding    -> Tikhonov Regularizer
};

// Mantorok A7.2 Tikhonov Regularization Constant (98 / 65536 ≈ 0.0015)
export const MANTOROK_LAMBDA_Q16 = 98;

/**
 * Computes coboundary frustration between two connected rune nodes u and v.
 * Dominance triangle:
 *   Chattur'gha > Xel'lotath > Ulyaoth > Chattur'gha
 * Mantorok damps cross-alignment conflict via Z2 twisted binding.
 */
export function computeEdgeFrustration(stalkU, stalkV, edgeWeightQ16 = Q16_ONE) {
  const cU = stalkU[ALIGN.CHATTURGHA];
  const uU = stalkU[ALIGN.ULYAOTH];
  const xU = stalkU[ALIGN.XELLOTATH];
  const mU = stalkU[ALIGN.MANTOROK];

  const cV = stalkV[ALIGN.CHATTURGHA];
  const uV = stalkV[ALIGN.ULYAOTH];
  const xV = stalkV[ALIGN.XELLOTATH];
  const mV = stalkV[ALIGN.MANTOROK];

  // Cross-alignment conflict terms (non-zero when opposing ancients meet)
  const conflictCX = q16Mul(cU, xV) + q16Mul(xU, cV);
  const conflictXU = q16Mul(xU, uV) + q16Mul(uU, xV);
  const conflictUC = q16Mul(uU, cV) + q16Mul(cU, uV);

  const rawFrustration = conflictCX + conflictXU + conflictUC;

  // Mantorok binding attenuation: reduces runaway topological collapse
  const mantorokBinding = ((mU + mV) >> 1) + MANTOROK_LAMBDA_Q16;
  const dampingFactor = q16Clamp(Q16_ONE - (mantorokBinding >> 2), 8192, Q16_ONE);

  return q16Mul(q16Mul(rawFrustration, dampingFactor), edgeWeightQ16);
}

export class CosmologySheaf {
  constructor(nodeCount) {
    this.nodeCount = nodeCount;
    // Array of Int32Array(4) stalks in Q16.16
    this.stalks = Array.from({ length: nodeCount }, () => new Int32Array(4));
    this.edges = []; // { u, v, weightQ16 }
    this.sanityQ16 = Q16_ONE; // 1.0 = Full Sanity
    this.dirichletEnergyQ16 = 0;
  }

  setNodeAlignment(nodeIdx, alignment, powerQ16 = Q16_ONE) {
    const s = this.stalks[nodeIdx];
    s[alignment] = q16Clamp(s[alignment] + powerQ16, 0, Q16_ONE * 4);
  }

  addEdge(u, v, weightQ16 = Q16_ONE) {
    this.edges.push({ u, v, weightQ16 });
  }

  /**
   * Advances Ledger 1 sheaf relaxation by 1 deterministic tick.
   * Updates Dirichlet Frustration Energy and Sanity state.
   */
  step() {
    let totalFrustration = 0;
    let totalMantorok = 0;

    for (let i = 0; i < this.nodeCount; i++) {
      totalMantorok += this.stalks[i][ALIGN.MANTOROK];
    }

    for (const edge of this.edges) {
      const f = computeEdgeFrustration(
        this.stalks[edge.u],
        this.stalks[edge.v],
        edge.weightQ16
      );
      totalFrustration += f;
    }

    this.dirichletEnergyQ16 = totalFrustration;

    // Drain sanity proportional to Dirichlet frustration, stabilized by Mantorok
    const drain = totalFrustration >> 6;
    const recovery = (totalMantorok >> 8) + (MANTOROK_LAMBDA_Q16 >> 3);
    this.sanityQ16 = q16Clamp(this.sanityQ16 - drain + recovery, 0, Q16_ONE);

    return {
      dirichletEnergyQ16: this.dirichletEnergyQ16,
      sanityQ16: this.sanityQ16
    };
  }
}
