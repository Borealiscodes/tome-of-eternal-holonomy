import assert from 'node:assert/strict';
import { Q16_ONE, Q16_HALF } from '../src/core/q16.js';
import { CircleOfPower } from '../src/physics/circle_of_power.js';

const circle = new CircleOfPower(5);

// Inscribe 5-point spell: Chattur'gha + Antorbok + Redgormor + 2x Pargon
circle.inscribeRune(0, 'CHATTURGHA');
circle.inscribeRune(1, 'PARGON');
circle.inscribeRune(2, 'ANTORBOK');
circle.inscribeRune(3, 'PARGON');
circle.inscribeRune(4, 'REDGORMOR');

// Draw brush stroke across the center of the Bezier tidal patch
circle.patch.applyBrushImpulse(Q16_HALF, Q16_HALF, Q16_ONE);
for (let t = 0; t < 10; t++) {
  circle.step();
}

const spell = circle.evaluateSpell();
assert.equal(spell.valid, true);
assert.equal(spell.pargonCount, 2);
assert.ok(spell.potencyQ16 > Q16_ONE, 'Double Pargon amplifies spell potency > 1.0');
assert.ok(circle.edgeFluxQ16.some(f => f > 0), 'Tidal brush stroke transfers astral flux');

console.log('✓ Phase 2 Circle of Power & Bezier Tidal Physics verified:', spell);
