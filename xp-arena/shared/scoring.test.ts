import { test } from 'node:test';
import assert from 'node:assert/strict';
import { basePoints, coinsForAnswer, gradeBonus, streakBonus, top3Coins, xpToNextBonus } from './scoring';

test('wrong answers earn nothing', () => {
  assert.equal(basePoints(false, 0, 20_000), 0);
  assert.equal(coinsForAnswer(false), 0);
});

test('faster correct answers earn more, up to 1,000', () => {
  assert.equal(basePoints(true, 0, 20_000), 1000);
  assert.equal(basePoints(true, 10_000, 20_000), 750);
  assert.equal(basePoints(true, 20_000, 20_000), 500);
  assert.equal(basePoints(true, 99_000, 20_000), 500);
});

test('untimed review pays flat points', () => {
  assert.equal(basePoints(true, 45_000, null), 1000);
});

test('streak bonus starts at 3 in a row and stacks', () => {
  assert.equal(streakBonus(2), 0);
  assert.equal(streakBonus(3), 200);
  assert.equal(streakBonus(4), 400);
  assert.equal(streakBonus(20), 1000);
});

test('grade bonus is +1 per 1,000 XP, capped at +5', () => {
  assert.equal(gradeBonus(999), 0);
  assert.equal(gradeBonus(1000), 1);
  assert.equal(gradeBonus(4999), 4);
  assert.equal(gradeBonus(80_000), 5);
  assert.equal(xpToNextBonus(1250), 750);
  assert.equal(xpToNextBonus(5000), null);
});

test('top 3 earn the finishing coin bonus', () => {
  assert.equal(top3Coins(1), 25);
  assert.equal(top3Coins(3), 25);
  assert.equal(top3Coins(4), 0);
});
