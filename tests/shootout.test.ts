import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { Difficulty, Shootout } from '@/types';
import { ZONES, sweetSpot, composure, gradeStrike, resolveShot, COMPOSURE_MS } from '@/engine/kick';
import { cpuKeeperDive, habitColumn } from '@/engine/cpu';
import { createShootout, applyKick, takerOf, isSuddenDeath, tally, marks, simulateShootout } from '@/engine/shootout';
import { createRng } from '@/utils/random';

const play = (so: Shootout, results: boolean[]) => results.reduce((s, r) => applyKick(s, r), so);

test('alternating takers, starting with the toss winner', () => {
  let so = createShootout({ userFirst: false });
  assert.equal(takerOf(so), 'cpu');
  so = applyKick(so, true);
  assert.equal(takerOf(so), 'user');
});

test('decided early once the gap cannot be closed', () => {
  const so = play(createShootout({ userFirst: true }), [true, false, true, false, true]);
  assert.equal(so.winner, null, 'cpu can still draw level after 5 kicks');
  const done = applyKick(so, false);
  assert.equal(done.winner, 'user');
  assert.equal(applyKick(done, true), done, 'no kicks after the winner');
});

test('three-kick format ends as soon as it is mathematically over', () => {
  const so = play(createShootout({ userFirst: false, kicks: 3 }), [true, false, true, false]);
  assert.equal(so.winner, 'cpu');
});

test('sudden death needs equal kicks before deciding', () => {
  let so = play(createShootout({ userFirst: true }), Array(10).fill(true));
  assert.equal(so.winner, null);
  assert.ok(isSuddenDeath(so));
  so = applyKick(so, false);
  assert.equal(so.winner, null, 'the cpu still has to kick');
  const lost = applyKick(so, true);
  assert.equal(lost.winner, 'cpu');
  const cont = applyKick(so, false);
  assert.equal(cont.winner, null, 'both missed: keep going');
  assert.equal(marks(cont, 'user').length, 6);
  assert.deepEqual(tally(cont).user, { taken: 6, scored: 5 });
});

test('zone outcomes follow the technique rules', () => {
  const rng = createRng(7);
  assert.deepEqual(resolveShot({ zone: 0, quality: 'perfect', dive: 2, rng }), { result: 'goal', how: 'topBins' });
  assert.deepEqual(resolveShot({ zone: 0, quality: 'perfect', dive: 0, rng }), { result: 'goal', how: 'unstoppable' });
  assert.deepEqual(resolveShot({ zone: 1, quality: 'good', dive: 0, rng }), { result: 'goal', how: 'panenka' });
  assert.deepEqual(resolveShot({ zone: 1, quality: 'perfect', dive: 1, rng }), { result: 'save', how: 'panenkaRead' });
  assert.deepEqual(resolveShot({ zone: 4, quality: 'perfect', dive: 1, rng }), { result: 'save', how: 'straightAt' });
  assert.deepEqual(resolveShot({ zone: 3, quality: 'good', dive: 0, rng }), { result: 'save', how: 'parried' });
  for (let i = 0; i < 200; i++) {
    const r = resolveShot({ zone: 2, quality: 'poor', dive: 0, rng });
    assert.equal(r.result, 'miss', 'a poor strike at the top corner never goes in');
  }
});

test('the sweet spot reflects risk, difficulty and composure', () => {
  const low = sweetSpot(3).green;
  const high = sweetSpot(0).green;
  const middle = sweetSpot(4).green;
  assert.ok(high < low && low < middle);
  assert.ok(sweetSpot(3, { difficulty: 'easy' }).green > sweetSpot(3, { difficulty: 'hard' }).green);
  assert.ok(sweetSpot(3, { rating: 5 }).green > sweetSpot(3, { rating: 1 }).green);
  assert.equal(composure(0), 0);
  assert.equal(composure(COMPOSURE_MS * 2), 1);
  assert.equal(gradeStrike(0.5, 0.2, 0.1), 'perfect');
  assert.equal(gradeStrike(0.62, 0.2, 0.1), 'good');
  assert.equal(gradeStrike(0.9, 0.2, 0.1), 'poor');
  assert.equal(ZONES.length, 6);
});

test('keepers learn habits on normal and hard, never on easy', () => {
  const history = [0, 0, 0, 0, 0, 0];
  const share = (difficulty: Difficulty) => {
    const rng = createRng(99);
    let hits = 0;
    for (let i = 0; i < 4000; i++) if (cpuKeeperDive(history, difficulty, rng) === 0) hits += 1;
    return hits / 4000;
  };
  assert.ok(Math.abs(share('easy') - 0.43) < 0.03);
  assert.ok(share('hard') > share('normal'));
  assert.ok(share('normal') > 0.5);
  assert.equal(habitColumn([0, 0]), 0);
  assert.equal(habitColumn([0, 1]), null);
  assert.equal(habitColumn([2, 1, 2, 2]), 2);
});

test('simulated shootouts always produce a valid, reproducible winner', () => {
  for (let seed = 1; seed < 400; seed++) {
    const a = simulateShootout(3, 4, seed);
    const b = simulateShootout(3, 4, seed);
    assert.deepEqual(a, b);
    assert.ok(a.winner === 'a' || a.winner === 'b');
    const [sa, sb] = a.score;
    assert.ok(a.winner === 'a' ? sa > sb : sb > sa, `seed ${seed} score matches winner`);
  }
});
