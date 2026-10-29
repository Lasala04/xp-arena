// Coin Shop catalog (slide 06 · Rewards & Customization).
// Coins buy the look, never the grade: nothing here affects scoring.

import type { Look } from './types';

export type ItemCategory = 'avatar' | 'skin' | 'frame' | 'nameplate' | 'cardTheme' | 'emote';

export interface CatalogItem {
  id: string;
  category: ItemCategory;
  name: string;
  price: number;
  blurb: string;
  /** Seasonal items are free but only unlock once the player hits this answer streak. */
  unlockStreak?: number;
  /** Emote icon key, drawn as an SVG badge by the client (see src/components/Emote.tsx). */
  icon?: EmoteIcon;
}

export type EmoteIcon = 'clap' | 'wave' | 'flex' | 'heartbeat' | 'stetho' | 'trophy' | 'mic' | 'jack';

export const CATEGORIES: { id: ItemCategory; label: string; lookKey: keyof Look }[] = [
  { id: 'avatar', label: 'Avatars', lookKey: 'avatar' },
  { id: 'skin', label: 'Skins & outfits', lookKey: 'skin' },
  { id: 'frame', label: 'Profile frames', lookKey: 'frame' },
  { id: 'nameplate', label: 'Nameplates', lookKey: 'nameplate' },
  { id: 'cardTheme', label: 'Answer cards', lookKey: 'cardTheme' },
  { id: 'emote', label: 'Victory emotes', lookKey: 'emote' },
];

export const CATALOG: CatalogItem[] = [
  // Avatars: doctors, nurses, lab techs, mascots
  { id: 'doctor', category: 'avatar', name: 'Doctor', price: 0, blurb: 'Stethoscope always ready.' },
  { id: 'nurse', category: 'avatar', name: 'Nurse', price: 0, blurb: 'Runs the ward, runs the leaderboard.' },
  { id: 'labtech', category: 'avatar', name: 'Lab Tech', price: 60, blurb: 'Goggles up, samples sorted.' },
  { id: 'heartie', category: 'avatar', name: 'Heartie', price: 120, blurb: 'Mascot. Cardi- means heart.' },
  { id: 'neura', category: 'avatar', name: 'Neura', price: 120, blurb: 'Mascot. Encephal- means brain.' },
  { id: 'bonnie', category: 'avatar', name: 'Bonnie', price: 150, blurb: 'Mascot. Oste- means bone.' },

  // Skins and outfits
  { id: 'classic', category: 'skin', name: 'Classic Coat', price: 0, blurb: 'Crisp white coat over your color.' },
  { id: 'scrubs', category: 'skin', name: 'Scrubs', price: 40, blurb: 'V-neck scrubs in any color.' },
  { id: 'surgical', category: 'skin', name: 'Surgical', price: 80, blurb: 'Cap and mask. Scrubbed in.' },
  { id: 'hero', category: 'skin', name: 'Code Blue Hero', price: 140, blurb: 'A cape for clutch answers.' },
  { id: 'champion', category: 'skin', name: 'Champion', price: 220, blurb: 'Gold crown. Top-3 energy.' },
  { id: 'pumpkin', category: 'skin', name: 'Spooky Season', price: 0, unlockStreak: 5, blurb: 'Seasonal. Unlocks at a 5-answer streak.' },

  // Profile frames
  { id: 'none', category: 'frame', name: 'No Frame', price: 0, blurb: 'Clean and simple.' },
  { id: 'ring', category: 'frame', name: 'Ring', price: 30, blurb: 'A bold ring in your color.' },
  { id: 'hex', category: 'frame', name: 'Hex Cell', price: 50, blurb: 'Six sides, like a benzene ring.' },
  { id: 'pulse', category: 'frame', name: 'Pulse', price: 90, blurb: 'Dashed rhythm around your avatar.' },
  { id: 'laurel', category: 'frame', name: 'Laurel', price: 160, blurb: 'For the honor roll.' },
  { id: 'bats', category: 'frame', name: 'Night Shift', price: 0, unlockStreak: 8, blurb: 'Seasonal. Unlocks at an 8-answer streak.' },

  // Nameplates
  { id: 'plain', category: 'nameplate', name: 'Plain', price: 0, blurb: 'Your name, nothing else.' },
  { id: 'ink', category: 'nameplate', name: 'Ink', price: 20, blurb: 'Dark plate, cream type.' },
  { id: 'ecg', category: 'nameplate', name: 'ECG', price: 60, blurb: 'A heartbeat trace behind your name.' },
  { id: 'neon', category: 'nameplate', name: 'Neon', price: 90, blurb: 'Glows on the projector.' },
  { id: 'gold', category: 'nameplate', name: 'Gold Leaf', price: 130, blurb: 'Shiny. Very shiny.' },
  { id: 'spooky', category: 'nameplate', name: 'Candlelight', price: 0, unlockStreak: 7, blurb: 'Seasonal. Unlocks at a 7-answer streak.' },

  // Answer-card themes
  { id: 'classic-cards', category: 'cardTheme', name: 'Classic', price: 0, blurb: 'Four colors, four shapes.' },
  { id: 'outline', category: 'cardTheme', name: 'Outline', price: 40, blurb: 'Light cards with bold edges.' },
  { id: 'pastel', category: 'cardTheme', name: 'Pastel', price: 60, blurb: 'Soft colors, same shapes.' },
  { id: 'midnight', category: 'cardTheme', name: 'Midnight', price: 80, blurb: 'Dark cards with glowing shapes.' },

  // Victory emotes
  { id: 'clap', category: 'emote', name: 'Clap', price: 0, icon: 'clap', blurb: 'Good game, everyone.' },
  { id: 'wave', category: 'emote', name: 'Wave', price: 15, icon: 'wave', blurb: 'Hi from the back row.' },
  { id: 'flex', category: 'emote', name: 'Flex', price: 30, icon: 'flex', blurb: 'Myo- means muscle.' },
  { id: 'heartbeat', category: 'emote', name: 'Heartbeat', price: 40, icon: 'heartbeat', blurb: 'Tachycardia from excitement.' },
  { id: 'stetho', category: 'emote', name: 'Diagnosis', price: 60, icon: 'stetho', blurb: 'Diagnosis: correct.' },
  { id: 'trophy', category: 'emote', name: 'Trophy', price: 90, icon: 'trophy', blurb: 'For podium finishes.' },
  { id: 'mic', category: 'emote', name: 'Mic Drop', price: 120, icon: 'mic', blurb: 'Nothing more to say.' },
  { id: 'jack', category: 'emote', name: 'Jack-o’-lantern', price: 0, unlockStreak: 5, icon: 'jack', blurb: 'Seasonal. Unlocks at a 5-answer streak.' },
];

const BY_ID = new Map(CATALOG.map((i) => [i.id, i]));

export function getItem(id: string): CatalogItem | undefined {
  return BY_ID.get(id);
}

export function itemsIn(category: ItemCategory): CatalogItem[] {
  return CATALOG.filter((i) => i.category === category);
}

/** Free starter items are owned by everyone; seasonal items need the streak. */
export function ownsItem(owned: string[], bestStreak: number, id: string): boolean {
  const item = BY_ID.get(id);
  if (!item) return false;
  if (item.unlockStreak !== undefined) return bestStreak >= item.unlockStreak;
  return item.price === 0 || owned.includes(id);
}

export const TONES = ['#F6D7BD', '#EBB98F', '#D49A6A', '#AE7446', '#7F5232', '#563621'];

export const SWATCHES = ['#5236E0', '#16141F', '#F2545B', '#12A594', '#E9A23B', '#3B82F6', '#EC4899', '#84CC16'];

/** Spoken names for the color pickers, so screen readers don't read out hex codes. */
export const COLOR_NAMES: Record<string, string> = {
  '#5236E0': 'Violet',
  '#16141F': 'Ink',
  '#F2545B': 'Coral',
  '#12A594': 'Teal',
  '#E9A23B': 'Amber',
  '#3B82F6': 'Blue',
  '#EC4899': 'Pink',
  '#84CC16': 'Lime',
  '#F6D7BD': 'Very light',
  '#EBB98F': 'Light',
  '#D49A6A': 'Medium light',
  '#AE7446': 'Medium',
  '#7F5232': 'Medium dark',
  '#563621': 'Dark',
};

export const DEFAULT_LOOK: Look = {
  avatar: 'doctor',
  skin: 'classic',
  tone: TONES[1],
  outfitColor: '#5236E0',
  frame: 'none',
  frameColor: '#5236E0',
  nameplate: 'plain',
  cardTheme: 'classic-cards',
  emote: 'clap',
};

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Returns a look that only uses items the player owns; anything else falls back to the default. */
export function sanitizeLook(input: Partial<Look> | undefined, owned: string[], bestStreak: number): Look {
  const look: Look = { ...DEFAULT_LOOK };
  if (!input) return look;
  for (const { id: category, lookKey } of CATEGORIES) {
    const value = input[lookKey];
    if (typeof value !== 'string') continue;
    const item = getItem(value);
    if (item && item.category === category && ownsItem(owned, bestStreak, value)) look[lookKey] = value;
  }
  if (typeof input.tone === 'string' && TONES.includes(input.tone)) look.tone = input.tone;
  if (typeof input.outfitColor === 'string' && HEX.test(input.outfitColor)) look.outfitColor = input.outfitColor;
  if (typeof input.frameColor === 'string' && HEX.test(input.frameColor)) look.frameColor = input.frameColor;
  return look;
}

export const WELCOME_COINS = 30;
