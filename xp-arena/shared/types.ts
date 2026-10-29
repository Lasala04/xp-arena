// Types shared by the game server and the browser client.

export type QuestionKind = 'recall' | 'decode' | 'apply';

export interface WordPart {
  part: string;
  meaning: string;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  prompt: string;
  /** The medical term or word part the question is about, highlighted in the UI. */
  term?: string;
  choices: [string, string, string, string];
  answer: number;
  breakdown: WordPart[];
  /** Plain-language meaning shown after the breakdown, e.g. "study of the heart". */
  result: string;
}

/** A question as players see it while it is open: no answer, no breakdown. */
export interface PublicQuestion {
  id: string;
  kind: QuestionKind;
  prompt: string;
  term?: string;
  choices: [string, string, string, string];
  index: number;
  total: number;
  timed: boolean;
  /** Epoch ms (server clock) when the question closes; null for the untimed review question. */
  endsAt: number | null;
  timeLimitMs: number | null;
}

/** Everything a player is wearing. Item fields hold catalog ids. */
export interface Look {
  avatar: string;
  skin: string;
  tone: string;
  outfitColor: string;
  frame: string;
  frameColor: string;
  nameplate: string;
  cardTheme: string;
  emote: string;
}

export interface PlayerPublic {
  id: string;
  name: string;
  look: Look;
  score: number;
  streak: number;
  connected: boolean;
  answered: boolean;
  bot: boolean;
}

export interface LeaderRow {
  id: string;
  name: string;
  look: Look;
  score: number;
  streak: number;
  rank: number;
  /** Positive = moved up since the last question. */
  delta: number;
  correct: number;
}

export interface RevealInfo {
  answer: number;
  breakdown: WordPart[];
  result: string;
  counts: [number, number, number, number];
  correctCount: number;
  answeredCount: number;
}

export type Phase = 'lobby' | 'question' | 'reveal' | 'final';

export interface RoomState {
  code: string;
  phase: Phase;
  players: PlayerPublic[];
  question: PublicQuestion | null;
  reveal: RevealInfo | null;
  answerCount: number;
  leaderboard: LeaderRow[];
  questionIndex: number;
  totalQuestions: number;
  serverNow: number;
}

export interface PlayerResult {
  questionIndex: number;
  answered: boolean;
  choice: number | null;
  correct: boolean;
  base: number;
  streakBonus: number;
  points: number;
  coins: number;
  streak: number;
  score: number;
  rank: number;
  totalCoins: number;
}

export interface FinalSummary {
  rank: number;
  playerCount: number;
  score: number;
  correct: number;
  total: number;
  coinsEarned: number;
  top3Bonus: number;
  bestStreak: number;
  termXp: number;
  bonusPoints: number;
  bonusPointsGained: number;
}

export interface EmoteEvent {
  playerId: string;
  name: string;
  emote: string;
  at: number;
}

export interface Profile {
  id: string;
  name: string;
  coins: number;
  owned: string[];
  loadouts: [Look, Look, Look];
  activeLoadout: number;
  termXp: number;
  bestStreak: number;
  gamesPlayed: number;
  correct: number;
  answered: number;
  createdAt: number;
}

export interface RecordRow {
  id: string;
  name: string;
  termXp: number;
  bonusPoints: number;
  gamesPlayed: number;
  accuracy: number | null;
  bestStreak: number;
  coins: number;
  look: Look;
}

// ---- Socket.IO event maps ----

export type Ack<T> = (res: { ok: true; data: T } | { ok: false; error: string }) => void;

export interface ClientToServer {
  'host:create': (ack: Ack<{ code: string; hostKey: string }>) => void;
  'host:resume': (p: { code: string; hostKey: string }, ack: Ack<{ code: string }>) => void;
  'host:addBots': (count: number) => void;
  'host:start': () => void;
  'host:reveal': () => void;
  'host:next': () => void;
  'host:kick': (playerId: string) => void;
  'host:restart': () => void;
  'host:end': () => void;
  'player:join': (p: { code: string; profileId: string }, ack: Ack<{ code: string; playerId: string }>) => void;
  'player:answer': (choice: number) => void;
  'player:look': (look: Look) => void;
  'player:emote': () => void;
  'player:leave': () => void;
}

export interface ServerToClient {
  'room:state': (s: RoomState) => void;
  'room:emote': (e: EmoteEvent) => void;
  'room:closed': (reason: string) => void;
  'player:result': (r: PlayerResult) => void;
  'player:final': (f: FinalSummary) => void;
  'player:kicked': () => void;
}
