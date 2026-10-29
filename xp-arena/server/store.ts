// Player profiles and the class record, persisted to data/store.json.
// A JSON file is enough for a classroom prototype; swap for a database later.

import fs from 'node:fs';
import path from 'node:path';
import type { Look, Profile, RecordRow } from '../shared/types';
import { DEFAULT_LOOK, WELCOME_COINS, getItem, ownsItem, sanitizeLook } from '../shared/catalog';
import { gradeBonus } from '../shared/scoring';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'store.json');

interface StoreFile {
  profiles: Record<string, Profile>;
}

let data: StoreFile = { profiles: {} };
let saveTimer: NodeJS.Timeout | null = null;

function load() {
  try {
    data = JSON.parse(fs.readFileSync(FILE, 'utf8')) as StoreFile;
  } catch {
    data = { profiles: {} };
  }
}

function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  }, 250);
}

load();

const ID = /^[A-Za-z0-9_-]{8,64}$/;

export function cleanName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const n = name.replace(/\s+/g, ' ').trim().slice(0, 16);
  return n.length >= 2 ? n : null;
}

export function getProfile(id: string): Profile | undefined {
  return data.profiles[id];
}

export function upsertProfile(id: string, name: string): Profile {
  if (!ID.test(id)) throw new Error('Invalid profile id');
  const existing = data.profiles[id];
  if (existing) {
    existing.name = name;
    save();
    return existing;
  }
  const look: Look = { ...DEFAULT_LOOK };
  const profile: Profile = {
    id,
    name,
    coins: WELCOME_COINS,
    owned: [],
    loadouts: [look, { ...look, avatar: 'nurse', skin: 'classic', outfitColor: '#12A594' }, { ...look, outfitColor: '#F2545B' }],
    activeLoadout: 0,
    termXp: 0,
    bestStreak: 0,
    gamesPlayed: 0,
    correct: 0,
    answered: 0,
    createdAt: Date.now(),
  };
  data.profiles[id] = profile;
  save();
  return profile;
}

export function activeLook(p: Profile): Look {
  return p.loadouts[p.activeLoadout] ?? p.loadouts[0];
}

export function buyItem(id: string, itemId: string): Profile {
  const p = data.profiles[id];
  if (!p) throw new Error('Profile not found');
  const item = getItem(itemId);
  if (!item) throw new Error('Item not found');
  if (item.unlockStreak !== undefined) throw new Error(`Seasonal item: reach a ${item.unlockStreak}-answer streak to unlock it`);
  if (ownsItem(p.owned, p.bestStreak, itemId)) throw new Error('You already own this');
  if (p.coins < item.price) throw new Error(`You need ${item.price - p.coins} more coins`);
  p.coins -= item.price;
  p.owned.push(itemId);
  save();
  return p;
}

export function saveLoadouts(id: string, loadouts: unknown, activeLoadout: unknown): Profile {
  const p = data.profiles[id];
  if (!p) throw new Error('Profile not found');
  if (!Array.isArray(loadouts) || loadouts.length !== 3) throw new Error('Expected 3 loadouts');
  p.loadouts = loadouts.map((l) => sanitizeLook(l as Partial<Look>, p.owned, p.bestStreak)) as Profile['loadouts'];
  const idx = Number(activeLoadout);
  p.activeLoadout = Number.isInteger(idx) && idx >= 0 && idx < 3 ? idx : 0;
  save();
  return p;
}

export function recordGame(id: string, r: { xp: number; coins: number; correct: number; answered: number; bestStreak: number }): Profile | undefined {
  const p = data.profiles[id];
  if (!p) return undefined;
  p.termXp += r.xp;
  p.coins += r.coins;
  p.correct += r.correct;
  p.answered += r.answered;
  p.bestStreak = Math.max(p.bestStreak, r.bestStreak);
  p.gamesPlayed += 1;
  save();
  return p;
}

export function classRecord(): RecordRow[] {
  return Object.values(data.profiles)
    .map((p) => ({
      id: p.id,
      name: p.name,
      termXp: p.termXp,
      bonusPoints: gradeBonus(p.termXp),
      gamesPlayed: p.gamesPlayed,
      accuracy: p.answered ? p.correct / p.answered : null,
      bestStreak: p.bestStreak,
      coins: p.coins,
      look: activeLook(p),
    }))
    .sort((a, b) => b.termXp - a.termXp);
}

/** Starts a new term: XP and grade bonuses reset, coins and items are kept. */
export function resetTerm() {
  for (const p of Object.values(data.profiles)) {
    p.termXp = 0;
    p.gamesPlayed = 0;
    p.correct = 0;
    p.answered = 0;
  }
  save();
}
