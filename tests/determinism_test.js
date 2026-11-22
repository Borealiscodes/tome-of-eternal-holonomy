import assert from 'node:assert/strict';
import { Q16_ONE, Q16_HALF } from '../src/core/q16.js';
import { ReplayLedger } from '../src/core/replay_ledger.js';

const ledger = new ReplayLedger(5);
ledger.recordInscribe(0, 0, 'XELLOTATH');
ledger.recordInscribe(2, 1, 'CHATTURGHA');
ledger.recordInscribe(4, 2, 'MANTOROK');
ledger.recordBrush(5, Q16_HALF, Q16_HALF, Q16_ONE);
ledger.recordInscribe(8, 3, 'TIER');
ledger.recordInscribe(10, 4, 'ARETAK');

const serialized = ledger.serialize();
assert.ok(serialized.length < 4096, 'Replay log stays strictly under 4 KB');

const runA = ReplayLedger.verifyReplay(serialized, 30);
const runB = ReplayLedger.verifyReplay(serialized, 30);
assert.equal(runA.digestHex, runB.digestHex, 'Replays produce identical FNV-1a state digest');

console.log('✓ Phase 5 <4KB Replay Ledger & Bit-Exact Digest verified:', {
  bytes: serialized.length,
  digestHex: runA.digestHex
});
