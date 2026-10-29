// The live game: one Room per class session (slide 04 · Join → Answer → Review → Spend).
// The server owns the clock and the scoring so nobody can fake a fast answer.

import type { Server } from 'socket.io';
import crypto from 'node:crypto';
import type {
  ClientToServer,
  FinalSummary,
  LeaderRow,
  Look,
  Phase,
  PlayerPublic,
  PlayerResult,
  Question,
  RevealInfo,
  RoomState,
  ServerToClient,
} from '../shared/types';
import {
  QUESTIONS_PER_ROUND,
  QUESTION_TIME_MS,
  basePoints,
  coinsForAnswer,
  gradeBonus,
  streakBonus,
  top3Coins,
} from '../shared/scoring';
import { CATALOG, SWATCHES, TONES, getItem } from '../shared/catalog';
import { buildRound } from './questions';
import { recordGame } from './store';

type IO = Server<ClientToServer, ServerToClient>;

const GRACE_MS = 500;
const MAX_PLAYERS = 60;

interface Player {
  id: string;
  name: string;
  look: Look;
  bot: boolean;
  /** 0–1 chance a bot answers correctly. */
  skill: number;
  socketId: string | null;
  joinedAt: number;
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  answered: number;
  coins: number;
  result: PlayerResult | null;
  final: FinalSummary | null;
  lastEmoteAt: number;
}

interface Answer {
  choice: number;
  elapsed: number;
}

export class Room {
  phase: Phase = 'lobby';
  hostSocketId: string | null = null;
  players = new Map<string, Player>();
  questions: Question[] = [];
  qIndex = -1;
  qStartedAt = 0;
  endsAt: number | null = null;
  answers = new Map<string, Answer>();
  reveal: RevealInfo | null = null;
  prevRanks = new Map<string, number>();
  lastActivity = Date.now();
  private timers: NodeJS.Timeout[] = [];

  constructor(
    private io: IO,
    readonly code: string,
    readonly hostKey: string,
  ) {}

  get channel() {
    return `room:${this.code}`;
  }

  get question(): Question | null {
    return this.questions[this.qIndex] ?? null;
  }

  get timed(): boolean {
    return this.qIndex < this.questions.length - 1;
  }

  touch() {
    this.lastActivity = Date.now();
  }

  // ---- players ----

  addPlayer(p: { id: string; name: string; look: Look; socketId: string | null; bot?: boolean; skill?: number }): Player {
    const existing = this.players.get(p.id);
    if (existing) {
      existing.socketId = p.socketId;
      existing.name = p.name;
      if (this.phase === 'lobby') existing.look = p.look;
      return existing;
    }
    if (this.players.size >= MAX_PLAYERS) throw new Error('This room is full');
    const player: Player = {
      id: p.id,
      name: p.name,
      look: p.look,
      bot: !!p.bot,
      skill: p.skill ?? 0,
      socketId: p.socketId,
      joinedAt: Date.now(),
      score: 0,
      streak: 0,
      bestStreak: 0,
      correct: 0,
      answered: 0,
      coins: 0,
      result: null,
      final: null,
      lastEmoteAt: 0,
    };
    this.players.set(p.id, player);
    return player;
  }

  removePlayer(id: string) {
    this.players.delete(id);
    this.answers.delete(id);
    this.checkAllAnswered();
  }

  disconnect(socketId: string) {
    for (const p of this.players.values()) if (p.socketId === socketId) p.socketId = null;
    if (this.hostSocketId === socketId) this.hostSocketId = null;
    this.checkAllAnswered();
  }

  setLook(playerId: string, look: Look) {
    const p = this.players.get(playerId);
    if (p) p.look = look;
  }

  emote(playerId: string) {
    const p = this.players.get(playerId);
    if (!p || this.phase === 'question') return;
    const now = Date.now();
    if (now - p.lastEmoteAt < 1500) return;
    p.lastEmoteAt = now;
    this.io.to(this.channel).emit('room:emote', { playerId: p.id, name: p.name, emote: p.look.emote, at: now });
  }

  addBots(count: number) {
    const n = Math.max(0, Math.min(count, MAX_PLAYERS - this.players.size, 12));
    for (let i = 0; i < n; i++) {
      const name = pickBotName(new Set([...this.players.values()].map((p) => p.name)));
      this.addPlayer({ id: `bot-${crypto.randomUUID()}`, name, look: randomLook(), socketId: null, bot: true, skill: 0.45 + Math.random() * 0.45 });
    }
    this.broadcast();
  }

  // ---- round flow ----

  start() {
    if (this.phase !== 'lobby' || this.players.size === 0) return;
    this.questions = buildRound(QUESTIONS_PER_ROUND);
    this.qIndex = -1;
    for (const p of this.players.values()) {
      Object.assign(p, { score: 0, streak: 0, bestStreak: 0, correct: 0, answered: 0, coins: 0, result: null, final: null });
    }
    this.nextQuestion();
  }

  next() {
    if (this.phase !== 'reveal') return;
    if (this.qIndex >= this.questions.length - 1) this.finish();
    else this.nextQuestion();
  }

  restart() {
    this.clearTimers();
    this.phase = 'lobby';
    this.questions = [];
    this.qIndex = -1;
    this.reveal = null;
    this.answers.clear();
    this.prevRanks.clear();
    for (const p of this.players.values()) Object.assign(p, { score: 0, streak: 0, result: null, final: null });
    this.broadcast();
  }

  private nextQuestion() {
    this.clearTimers();
    this.prevRanks = new Map(this.leaderboard().map((r) => [r.id, r.rank]));
    this.qIndex += 1;
    this.phase = 'question';
    this.reveal = null;
    this.answers.clear();
    this.qStartedAt = Date.now();
    this.endsAt = this.timed ? this.qStartedAt + QUESTION_TIME_MS : null;
    if (this.endsAt) this.timers.push(setTimeout(() => this.endQuestion(), QUESTION_TIME_MS + GRACE_MS));
    this.scheduleBots();
    this.broadcast();
  }

  answer(playerId: string, choice: number) {
    if (this.phase !== 'question') return;
    const p = this.players.get(playerId);
    if (!p || this.answers.has(playerId)) return;
    if (!Number.isInteger(choice) || choice < 0 || choice > 3) return;
    const now = Date.now();
    if (this.endsAt && now > this.endsAt + GRACE_MS) return;
    const elapsed = this.endsAt ? Math.min(now - this.qStartedAt, QUESTION_TIME_MS) : now - this.qStartedAt;
    this.answers.set(playerId, { choice, elapsed });
    this.touch();
    if (!this.checkAllAnswered()) this.broadcast();
  }

  /** Ends the question early once every connected player has locked in. */
  private checkAllAnswered(): boolean {
    if (this.phase !== 'question') return false;
    const active = [...this.players.values()].filter((p) => p.bot || p.socketId);
    if (active.length > 0 && active.every((p) => this.answers.has(p.id))) {
      // Short beat so the last answer lands on screen before the reveal.
      this.clearTimers();
      this.timers.push(setTimeout(() => this.endQuestion(), 600));
      this.broadcast();
      return true;
    }
    return false;
  }

  endQuestion() {
    const q = this.question;
    if (this.phase !== 'question' || !q) return;
    this.clearTimers();
    const counts: [number, number, number, number] = [0, 0, 0, 0];
    let correctCount = 0;

    for (const p of this.players.values()) {
      const a = this.answers.get(p.id);
      const correct = !!a && a.choice === q.answer;
      if (a) {
        counts[a.choice] += 1;
        p.answered += 1;
      }
      p.streak = correct ? p.streak + 1 : 0;
      p.bestStreak = Math.max(p.bestStreak, p.streak);
      const base = basePoints(correct, a?.elapsed ?? 0, this.timed ? QUESTION_TIME_MS : null);
      const bonus = correct ? streakBonus(p.streak) : 0;
      const coins = coinsForAnswer(correct);
      if (correct) {
        p.correct += 1;
        correctCount += 1;
      }
      p.score += base + bonus;
      p.coins += coins;
      p.result = {
        questionIndex: this.qIndex,
        answered: !!a,
        choice: a?.choice ?? null,
        correct,
        base,
        streakBonus: bonus,
        points: base + bonus,
        coins,
        streak: p.streak,
        score: p.score,
        rank: 0,
        totalCoins: p.coins,
      };
    }

    const board = this.leaderboard();
    for (const row of board) {
      const p = this.players.get(row.id);
      if (p?.result) p.result.rank = row.rank;
    }

    this.reveal = { answer: q.answer, breakdown: q.breakdown, result: q.result, counts, correctCount, answeredCount: this.answers.size };
    this.phase = 'reveal';
    this.endsAt = null;
    this.broadcast();
    for (const p of this.players.values()) if (p.socketId && p.result) this.io.to(p.socketId).emit('player:result', p.result);
  }

  private finish() {
    this.clearTimers();
    this.phase = 'final';
    const board = this.leaderboard();
    for (const row of board) {
      const p = this.players.get(row.id)!;
      const top3Bonus = top3Coins(row.rank);
      const coinsEarned = p.coins + top3Bonus;
      let termXp = 0;
      let before = 0;
      if (!p.bot) {
        // Accuracy counts every question in the round, so skipped questions count against the 80% target.
        const profile = recordGame(p.id, { xp: p.score, coins: coinsEarned, correct: p.correct, answered: this.questions.length, bestStreak: p.bestStreak });
        termXp = profile?.termXp ?? p.score;
        before = gradeBonus(termXp - p.score);
      }
      p.final = {
        rank: row.rank,
        playerCount: board.length,
        score: p.score,
        correct: p.correct,
        total: this.questions.length,
        coinsEarned,
        top3Bonus,
        bestStreak: p.bestStreak,
        termXp,
        bonusPoints: gradeBonus(termXp),
        bonusPointsGained: gradeBonus(termXp) - before,
      };
    }
    this.broadcast();
    for (const p of this.players.values()) if (p.socketId && p.final) this.io.to(p.socketId).emit('player:final', p.final);
  }

  private scheduleBots() {
    const q = this.question;
    if (!q) return;
    const window = this.timed ? QUESTION_TIME_MS * 0.85 : 9000;
    for (const p of this.players.values()) {
      if (!p.bot) continue;
      const delay = 1200 + Math.random() * window * (1.15 - p.skill);
      const right = Math.random() < p.skill;
      const wrong = [0, 1, 2, 3].filter((c) => c !== q.answer);
      const choice = right ? q.answer : wrong[Math.floor(Math.random() * wrong.length)];
      this.timers.push(setTimeout(() => this.answer(p.id, choice), delay));
    }
  }

  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  // ---- state ----

  leaderboard(): LeaderRow[] {
    const rows = [...this.players.values()].sort(
      (a, b) => b.score - a.score || b.correct - a.correct || a.joinedAt - b.joinedAt,
    );
    return rows.map((p, i) => {
      const prev = this.prevRanks.get(p.id);
      return {
        id: p.id,
        name: p.name,
        look: p.look,
        score: p.score,
        streak: p.streak,
        correct: p.correct,
        rank: i + 1,
        delta: prev && this.qIndex > 0 ? prev - (i + 1) : 0,
      };
    });
  }

  state(): RoomState {
    const q = this.question;
    const players: PlayerPublic[] = [...this.players.values()]
      .sort((a, b) => a.joinedAt - b.joinedAt)
      .map((p) => ({
        id: p.id,
        name: p.name,
        look: p.look,
        score: p.score,
        streak: p.streak,
        connected: p.bot || !!p.socketId,
        answered: this.answers.has(p.id),
        bot: p.bot,
      }));
    return {
      code: this.code,
      phase: this.phase,
      players,
      question:
        q && (this.phase === 'question' || this.phase === 'reveal')
          ? {
              id: q.id,
              kind: q.kind,
              prompt: q.prompt,
              term: q.term,
              choices: q.choices,
              index: this.qIndex,
              total: this.questions.length,
              timed: this.timed,
              endsAt: this.endsAt,
              timeLimitMs: this.timed ? QUESTION_TIME_MS : null,
            }
          : null,
      reveal: this.phase === 'reveal' ? this.reveal : null,
      answerCount: this.answers.size,
      leaderboard: this.leaderboard(),
      questionIndex: this.qIndex,
      totalQuestions: this.questions.length || QUESTIONS_PER_ROUND,
      serverNow: Date.now(),
    };
  }

  broadcast() {
    this.io.to(this.channel).emit('room:state', this.state());
  }

  /** Re-sends a reconnecting player's private result or final summary. */
  resync(playerId: string) {
    const p = this.players.get(playerId);
    if (!p?.socketId) return;
    if (this.phase === 'reveal' && p.result?.questionIndex === this.qIndex) this.io.to(p.socketId).emit('player:result', p.result);
    if (this.phase === 'final' && p.final) this.io.to(p.socketId).emit('player:final', p.final);
  }

  close(reason: string) {
    this.clearTimers();
    this.io.to(this.channel).emit('room:closed', reason);
  }
}

// ---- registry ----

const rooms = new Map<string, Room>();

export function createRoom(io: IO): Room {
  let code: string;
  do code = String(Math.floor(100000 + Math.random() * 900000));
  while (rooms.has(code));
  const room = new Room(io, code, crypto.randomUUID());
  rooms.set(code, room);
  return room;
}

export function endRoom(room: Room) {
  room.close('The host ended the game.');
  rooms.delete(room.code);
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(String(code).replace(/\D/g, ''));
}

/** Drops rooms nobody has touched for two hours. */
export function sweepRooms() {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    if (room.lastActivity < cutoff) {
      room.close('This room expired.');
      rooms.delete(code);
    }
  }
}

// ---- demo players ----

const BOT_NAMES = ['Ana', 'Ben', 'Carlo', 'Dani', 'Eli', 'Faye', 'Gio', 'Hana', 'Ivan', 'Jules', 'Kim', 'Lia', 'Migs', 'Nina', 'Oli', 'Pia', 'Rafa', 'Sam', 'Tess', 'Vince'];

function pickBotName(taken: Set<string>): string {
  const free = BOT_NAMES.filter((n) => !taken.has(n));
  const base = free.length ? free[Math.floor(Math.random() * free.length)] : `Guest ${taken.size + 1}`;
  return base;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomLook(): Look {
  const of = (c: string) => CATALOG.filter((i) => i.category === c && i.unlockStreak === undefined).map((i) => i.id);
  const look: Look = {
    avatar: pick(of('avatar')),
    skin: pick(of('skin')),
    tone: pick(TONES),
    outfitColor: pick(SWATCHES),
    frame: pick(of('frame')),
    frameColor: pick(SWATCHES),
    nameplate: pick(of('nameplate')),
    cardTheme: 'classic-cards',
    emote: pick(of('emote')),
  };
  if (!getItem(look.avatar)) look.avatar = 'doctor';
  return look;
}
