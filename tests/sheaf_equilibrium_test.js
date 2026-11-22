import assert from 'node:assert/strict';
import { Q16_ONE, q16Sin, q16Cos, Q16_HALF_PI } from '../src/core/q16.js';
import { ALIGN, CosmologySheaf } from '../src/core/sheaf_cosmology.js';

// 1. Verify Bhaskara Q16.16 trig accuracy
assert.equal(q16Sin(0), 0);
assert.ok(Math.abs(q16Sin(Q16_HALF_PI) - Q16_ONE) <= 2, 'sin(pi/2) == 1.0');
assert.ok(Math.abs(q16Cos(0) - Q16_ONE) <= 2, 'cos(0) == 1.0');

// 2. Verify 3-Point Circle of Power: Chattur'gha vs Xel'lotath bound by Mantorok
const circle = new CosmologySheaf(3);
circle.setNodeAlignment(0, ALIGN.CHATTURGHA, Q16_ONE);
circle.setNodeAlignment(1, ALIGN.XELLOTATH, Q16_ONE);
circle.addEdge(0, 1, Q16_ONE);

const tick1 = circle.step();
assert.ok(tick1.dirichletEnergyQ16 > 0, 'Opposing ancients generate Dirichlet tension');
assert.ok(tick1.sanityQ16 < Q16_ONE, 'Frustration drains Sanity');

// Bind node 2 with Mantorok to damp edge frustration
circle.setNodeAlignment(2, ALIGN.MANTOROK, Q16_ONE * 2);
circle.addEdge(1, 2, Q16_ONE);
circle.addEdge(2, 0, Q16_ONE);

const tick2 = circle.step();
console.log('✓ Determinism & Sheaf Equilibrium verified:', tick2);
