// Tiny external stores (useSyncExternalStore) for the live game and the player's profile.

import { useSyncExternalStore } from 'react';
import type { FinalSummary, Look, PlayerResult, Profile, RoomState } from '../../shared/types';
import { socket } from './socket';

function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: Partial<T>) {
      value = { ...value, ...next };
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

// ---- session (survives refresh in this tab) ----

export interface Session {
  role: 'host' | 'player';
  code: string;
  hostKey?: string;
}

const SESSION_KEY = 'xp.session';

export function readSession(): Session | null {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export function writeSession(s: Session | null) {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable: the session just won't survive a refresh */
  }
}

// ---- live game ----

interface GameState {
  room: RoomState | null;
  result: PlayerResult | null;
  final: FinalSummary | null;
  /** serverNow − Date.now(), so countdowns agree with the server clock. */
  offset: number;
  notice: string | null;
  connected: boolean;
}

export const game = createStore<GameState>({ room: null, result: null, final: null, offset: 0, notice: null, connected: socket.connected });

export function useGame() {
  return useSyncExternalStore(game.subscribe, game.get);
}

socket.on('room:state', (room) => {
  const prev = game.get().room;
  const newQuestion = room.phase === 'question' && prev?.question?.id !== room.question?.id;
  game.set({
    room,
    offset: room.serverNow - Date.now(),
    ...(newQuestion || room.phase === 'lobby' ? { result: null } : {}),
    ...(room.phase !== 'final' ? { final: null } : {}),
  });
});
socket.on('player:result', (result) => game.set({ result }));
socket.on('player:final', (final) => {
  game.set({ final });
  void refreshProfile();
});
socket.on('room:closed', (reason) => leaveRoom(reason));
socket.on('player:kicked', () => leaveRoom('The host removed you from the game.'));
socket.on('disconnect', () => game.set({ connected: false }));
socket.on('connect', () => {
  game.set({ connected: true });
  resumeSession();
});

export function leaveRoom(notice: string | null = null) {
  const s = readSession();
  if (s?.role === 'player') socket.emit('player:leave');
  writeSession(null);
  game.set({ room: null, result: null, final: null, notice });
}

export function hostCreate(): Promise<string> {
  return new Promise((resolve, reject) => {
    socket.emit('host:create', (res) => {
      if (!res.ok) return reject(new Error(res.error));
      writeSession({ role: 'host', code: res.data.code, hostKey: res.data.hostKey });
      resolve(res.data.code);
    });
  });
}

export function joinRoom(code: string): Promise<void> {
  const profileId = getProfileId();
  return new Promise((resolve, reject) => {
    socket.emit('player:join', { code, profileId }, (res) => {
      if (!res.ok) return reject(new Error(res.error));
      writeSession({ role: 'player', code: res.data.code });
      game.set({ notice: null });
      resolve();
    });
  });
}

/** Rejoins after a refresh or a dropped connection. */
function resumeSession() {
  const s = readSession();
  if (!s) return;
  if (s.role === 'host' && s.hostKey) {
    socket.emit('host:resume', { code: s.code, hostKey: s.hostKey }, (res) => {
      if (!res.ok) leaveRoom(res.error);
    });
  } else if (s.role === 'player') {
    joinRoom(s.code).catch((e: Error) => leaveRoom(e.message));
  }
}

// ---- profile ----

const PROFILE_KEY = 'xp.profileId';

/** crypto.randomUUID needs a secure context, which phones joining over LAN http don't have. */
function newId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function getProfileId(): string {
  try {
    let id = localStorage.getItem(PROFILE_KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(PROFILE_KEY, id);
    }
    return id;
  } catch {
    return (memoryId ??= newId());
  }
}
let memoryId: string | undefined;

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
}

export const profileStore = createStore<ProfileState>({ profile: null, loading: true });

export function useProfile() {
  return useSyncExternalStore(profileStore.subscribe, profileStore.get);
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body as T;
}

export async function refreshProfile() {
  try {
    const profile = await api<Profile>(`/api/profile/${getProfileId()}`);
    profileStore.set({ profile, loading: false });
  } catch {
    profileStore.set({ profile: null, loading: false });
  }
}

export async function createProfile(name: string) {
  const profile = await api<Profile>('/api/profile', { method: 'POST', body: JSON.stringify({ id: getProfileId(), name }) });
  profileStore.set({ profile });
  return profile;
}

export async function buyItem(itemId: string) {
  const profile = await api<Profile>('/api/shop/buy', { method: 'POST', body: JSON.stringify({ profileId: getProfileId(), itemId }) });
  profileStore.set({ profile });
  return profile;
}

export async function saveLoadouts(loadouts: Look[], activeLoadout: number) {
  const profile = await api<Profile>(`/api/profile/${getProfileId()}/loadouts`, {
    method: 'PUT',
    body: JSON.stringify({ loadouts, activeLoadout }),
  });
  profileStore.set({ profile });
  const s = readSession();
  if (s?.role === 'player') socket.emit('player:look', profile.loadouts[profile.activeLoadout]);
  return profile;
}

export { api };

void refreshProfile();
