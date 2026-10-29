// The student's device: create player → join → lobby → answer → result + review → final payout.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Hourglass, Lightning, PaperPlaneTilt, ShoppingBag, SignOut, Sparkle, Timer, Trophy, WifiSlash, X } from '@phosphor-icons/react';
import type { FinalSummary, Look, PlayerResult, Profile, RoomState } from '../../shared/types';
import { BONUS_POINT_CAP, STREAK_THRESHOLD, XP_PER_BONUS_POINT, xpToNextBonus } from '../../shared/scoring';
import { DEFAULT_LOOK, WELCOME_COINS, getItem } from '../../shared/catalog';
import { Avatar } from '../components/Avatar';
import { EmoteBadge } from '../components/Emote';
import { ANSWER_COLORS, ANSWER_NAMES, Breakdown, Coin, Dots, Flame, KindChip, Logo, Nameplate, Shape, SkipLink, Spinner, fmt, ordinal } from '../components/bits';
import { navigate, useRoute } from '../lib/router';
import { socket } from '../lib/socket';
import { createProfile, joinRoom, leaveRoom, readSession, saveLoadouts, useGame, useProfile } from '../lib/store';
import { useCountdown } from '../lib/useCountdown';

export function Play() {
  const { profile, loading } = useProfile();
  const { room, result, final, offset, notice, connected } = useGame();
  const { query } = useRoute();
  const inRoom = !!room && readSession()?.role === 'player';

  if (loading)
    return (
      <Shell>
        <div className="empty">
          <Spinner />
          <span className="sr-only">Loading</span>
        </div>
      </Shell>
    );
  if (!profile) return <CreatePlayer />;
  if (!inRoom || !room) return <JoinForm profile={profile} initialCode={query.get('code') ?? ''} notice={notice} />;

  const me = room.players.find((p) => p.id === profile.id);
  const look = me?.look ?? profile.loadouts[profile.activeLoadout];
  const myRow = room.leaderboard.find((r) => r.id === profile.id);

  return (
    <Shell room={room} look={look} name={profile.name} score={myRow?.score ?? 0} connected={connected}>
      {room.phase === 'lobby' && <PlayerLobby room={room} profile={profile} look={look} />}
      {room.phase === 'question' && <AnswerPad room={room} offset={offset} answered={!!me?.answered} look={look} />}
      {room.phase === 'reveal' && <ResultView room={room} result={result} look={look} />}
      {room.phase === 'final' && <FinalView final={final} look={look} name={profile.name} />}
    </Shell>
  );
}

function Shell({
  children,
  room,
  look,
  name,
  score,
  connected = true,
}: {
  children: React.ReactNode;
  room?: RoomState;
  look?: Look;
  name?: string;
  score?: number;
  connected?: boolean;
}) {
  return (
    <div className="page page--cream play">
      <SkipLink />
      <header className="play__bar">
        <Logo compact />
        {room ? (
          <>
            <span className="play__pin">PIN {room.code}</span>
            <span className="play__me">
              {look && <Avatar look={look} size={32} />}
              <span className="play__name">{name}</span>
              <span className="play__score">
                {fmt(score ?? 0)}
                <span className="sr-only"> XP</span>
              </span>
            </span>
          </>
        ) : (
          <a className="nav__link" href="#/locker">
            <ShoppingBag size={20} weight="bold" aria-hidden="true" />
            Locker
          </a>
        )}
      </header>
      {!connected && (
        <div className="banner banner--warn" role="status">
          <WifiSlash size={18} weight="bold" aria-hidden="true" /> Connection lost. Reconnecting…
        </div>
      )}
      <main className="play__main" id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

// ---- setup ----

function CreatePlayer() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createProfile(name);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Shell>
      <form className="card setup" onSubmit={submit} noValidate>
        <Avatar look={DEFAULT_LOOK} size={128} />
        <h1>Create your player</h1>
        <p className="muted">This is the name your class sees on the leaderboard.</p>
        <div className="field">
          <label htmlFor="player-name">Display name</label>
          <input
            id="player-name"
            autoFocus
            maxLength={16}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mika R."
            autoComplete="nickname"
            aria-invalid={!!error}
            aria-describedby={error ? 'name-error name-hint' : 'name-hint'}
          />
          <span className="field__hint" id="name-hint">
            2 to 16 characters
          </span>
        </div>
        {error && (
          <p className="error" id="name-error" role="alert">
            <X size={18} weight="bold" aria-hidden="true" />
            {error}
          </p>
        )}
        <button className="btn btn--violet btn--block btn--lg" disabled={busy || name.trim().length < 2}>
          {busy ? 'Creating…' : 'Create player'}
        </button>
        <p className="setup__gift">
          <Coin /> You start with {WELCOME_COINS} coins for the shop
        </p>
      </form>
    </Shell>
  );
}

function JoinForm({ profile, initialCode, notice }: { profile: Profile; initialCode: string; notice: string | null }) {
  const [code, setCode] = useState(initialCode.replace(/\D/g, '').slice(0, 6));
  const [error, setError] = useState<string | null>(notice);
  const [busy, setBusy] = useState(false);
  const autoTried = useRef(false);
  const look = profile.loadouts[profile.activeLoadout];

  const join = async (c = code) => {
    setBusy(true);
    setError(null);
    try {
      await joinRoom(c);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Scanning the projector's QR code lands here with ?code=, so join straight away.
  useEffect(() => {
    if (!autoTried.current && code.length === 6 && !notice) {
      autoTried.current = true;
      void join(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Shell>
      <form
        className="card join"
        onSubmit={(e) => {
          e.preventDefault();
          void join();
        }}
      >
        <h1>Join a game</h1>
        <p className="muted" id="pin-hint">
          Enter the 6-digit PIN on the projector.
        </p>
        <input
          className="pin__input pin__input--big"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Game PIN"
          aria-describedby={error ? 'pin-hint pin-error' : 'pin-hint'}
          aria-invalid={!!error}
          placeholder="000000"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          autoFocus
        />
        {error && (
          <p className="error" id="pin-error" role="alert">
            <X size={18} weight="bold" aria-hidden="true" />
            {error}
          </p>
        )}
        <button className="btn btn--violet btn--block btn--lg" disabled={busy || code.length !== 6}>
          {busy ? 'Joining…' : 'Enter the arena'}
        </button>
        <div className="join__as">
          <Avatar look={look} size={56} />
          <div>
            <span className="muted small">Playing as</span>
            <Nameplate look={look} name={profile.name} />
          </div>
          <a className="btn btn--ghost btn--sm" href="#/locker">
            Change look
          </a>
        </div>
      </form>
    </Shell>
  );
}

// ---- lobby ----

function PlayerLobby({ room, profile, look }: { room: RoomState; profile: Profile; look: Look }) {
  const choose = (i: number) => {
    if (i !== profile.activeLoadout) void saveLoadouts(profile.loadouts, i);
  };
  return (
    <div className="stack center">
      <div className="card lobbycard">
        <p className="eyebrow">You're in!</p>
        <div className="lobbycard__avatar">
          <Avatar look={look} size={168} />
        </div>
        <Nameplate look={look} name={profile.name} size="lg" />
        <p className="muted">
          Watch the projector. The game starts soon <Dots />
        </p>
        <p className="small muted" aria-live="polite">
          {room.players.length} in the room
        </p>
      </div>

      <div className="card">
        <div className="row-between">
          <h2 className="h3">Loadout</h2>
          <a className="link" href="#/locker">
            Customize
          </a>
        </div>
        <div className="loadouts">
          {profile.loadouts.map((l, i) => (
            <button
              key={i}
              className={`loadout ${i === profile.activeLoadout ? 'loadout--on' : ''}`}
              onClick={() => choose(i)}
              aria-pressed={i === profile.activeLoadout}
              aria-label={`Wear slot ${i + 1}`}
            >
              <Avatar look={l} size={64} />
              <span aria-hidden="true">Slot {i + 1}</span>
            </button>
          ))}
        </div>
      </div>
      <EmoteButton look={look} />
      <button
        className="btn btn--ghost btn--sm"
        onClick={() => {
          leaveRoom();
          navigate('/');
        }}
      >
        <SignOut size={18} weight="bold" aria-hidden="true" /> Leave room
      </button>
    </div>
  );
}

// ---- question ----

function AnswerPad({ room, offset, answered, look }: { room: RoomState; offset: number; answered: boolean; look: Look }) {
  const q = room.question!;
  const left = useCountdown(q.endsAt, offset);
  const [chosen, setChosen] = useState<{ id: string; choice: number } | null>(null);
  const pick = chosen?.id === q.id ? chosen.choice : null;
  const locked = answered || pick !== null;
  const timeUp = q.timed && left === 0 && !locked;
  const urgent = q.timed && left !== null && left < 5000;

  const answer = (i: number) => {
    if (locked || timeUp) return;
    setChosen({ id: q.id, choice: i });
    socket.emit('player:answer', i);
    navigator.vibrate?.(30);
  };

  return (
    <div className="pad">
      <div className="pad__top">
        <span className="pad__q">
          Q {q.index + 1}/{q.total}
        </span>
        <KindChip kind={q.kind} />
        {q.timed && left !== null ? (
          <span className={`pad__secs ${urgent ? 'pad__secs--urgent' : ''}`}>
            <Timer size={22} weight="bold" aria-hidden="true" />
            {Math.ceil(left / 1000)}s<span className="sr-only"> left</span>
          </span>
        ) : (
          <span className="pad__secs pad__secs--calm">
            <Hourglass size={18} weight="bold" aria-hidden="true" /> Untimed
          </span>
        )}
      </div>
      {q.timed && left !== null && (
        <div className={`pad__timebar ${urgent ? 'pad__timebar--urgent' : ''}`} aria-hidden="true">
          <div style={{ transform: `scaleX(${left / q.timeLimitMs!})` }} />
        </div>
      )}

      <div className="pad__prompt scheme-dark">
        <p>{q.prompt}</p>
        {q.term && <p className="pad__term">{q.term}</p>}
      </div>

      {locked ? (
        <div className="locked">
          {pick !== null && (
            <div className={`locked__pick ans--${ANSWER_COLORS[pick]}`}>
              <Shape i={pick} size={30} />
              <span>{q.choices[pick]}</span>
              <span className="locked__badge" aria-hidden="true">
                <Check size={18} weight="bold" />
              </span>
            </div>
          )}
          <h2>Answer locked in</h2>
          <p className="muted" role="status" aria-atomic="true">
            {room.answerCount} of {room.players.length} answered <Dots />
          </p>
        </div>
      ) : timeUp ? (
        <div className="locked" role="status">
          <span className="locked__icon" aria-hidden="true">
            <Timer size={34} weight="bold" />
          </span>
          <h2>Time's up</h2>
          <p className="muted">The answer is coming up on the projector.</p>
        </div>
      ) : (
        <div className={`pad__grid cards--${look.cardTheme}`} role="group" aria-label="Answers">
          {q.choices.map((c, i) => (
            <button key={i} className={`pad__ans ans--${ANSWER_COLORS[i]}`} onClick={() => answer(i)} aria-label={`${ANSWER_NAMES[i]}: ${c}`}>
              <Shape i={i} size={26} />
              <span>{c}</span>
            </button>
          ))}
        </div>
      )}
      {!q.timed && !locked && (
        <p className="pad__note">
          <Hourglass size={18} weight="bold" aria-hidden="true" /> Final review: no timer and no speed bonus. Read carefully.
        </p>
      )}
    </div>
  );
}

// ---- result ----

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Counts up to `to` over `ms` (an XP payout tick). Shows the final number at once under reduced motion. */
function useCountUp(to: number, ms = 600) {
  const [value, setValue] = useState(() => (reducedMotion() ? to : 0));
  useEffect(() => {
    if (reducedMotion()) return setValue(to);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(to * (1 - (1 - t) ** 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, ms]);
  return value;
}

function ResultView({ room, result, look }: { room: RoomState; result: PlayerResult | null; look: Look }) {
  const q = room.question!;
  const r = room.reveal!;
  const points = useCountUp(result?.correct ? result.points : 0);
  if (!result || result.questionIndex !== q.index)
    return (
      <div className="empty" role="status">
        <Spinner />
        <p>Checking your answer…</p>
      </div>
    );

  const tone = result.correct ? 'right' : result.answered ? 'wrong' : 'late';
  const heading = result.correct ? 'Correct!' : result.answered ? 'Not quite' : "Time's up";
  const answerText = q.choices[r.answer];
  const VerdictIcon = result.correct ? Check : result.answered ? X : Timer;

  return (
    <div className="stack">
      <div className={`verdict verdict--${tone}`} role="status" aria-atomic="true">
        <span className="verdict__icon" aria-hidden="true">
          <VerdictIcon size={34} weight="bold" />
        </span>
        <h1>{heading}</h1>
        {result.correct ? (
          <p className="verdict__points">
            <span aria-hidden="true">+{fmt(points)} XP</span>
            <span className="sr-only">plus {fmt(result.points)} XP</span>
          </p>
        ) : (
          <p className="verdict__sub">
            The answer was <strong>{answerText}</strong>
          </p>
        )}
      </div>

      <div className="card payout">
        <div className="payout__row">
          <span>Speed points</span>
          <strong>{fmt(result.base)}</strong>
        </div>
        <div className={`payout__row ${result.streakBonus ? '' : 'payout__row--dim'}`}>
          <span>
            <Flame size={16} /> Streak bonus
          </span>
          <strong>+{fmt(result.streakBonus)}</strong>
        </div>
        <div className={`payout__row ${result.coins ? '' : 'payout__row--dim'}`}>
          <span>
            <Coin size={16} /> Coins
          </span>
          <strong>+{result.coins}</strong>
        </div>
        <div className="payout__foot">
          <span className="payout__rank">
            {ordinal(result.rank)} <small>of {room.players.length}</small>
          </span>
          <span className="payout__streak">
            {result.streak > 0 ? (
              <>
                <Flame size={18} /> {result.streak} in a row
              </>
            ) : (
              'Streak reset'
            )}
          </span>
        </div>
        {result.streak === STREAK_THRESHOLD - 1 && (
          <p className="payout__hint">
            <Lightning size={18} weight="fill" aria-hidden="true" /> One more correct answer starts a +200 streak bonus.
          </p>
        )}
      </div>

      <div className="card">
        <p className="eyebrow">Review</p>
        <Breakdown parts={r.breakdown} result={r.result} term={q.term ?? undefined} />
      </div>

      <EmoteButton look={look} />
    </div>
  );
}

// ---- final ----

function FinalView({ final, look, name }: { final: FinalSummary | null; look: Look; name: string }) {
  if (!final)
    return (
      <div className="empty" role="status">
        <Spinner />
        <p>Tallying the round…</p>
      </div>
    );
  const toNext = xpToNextBonus(final.termXp);
  const intoPoint = toNext === null ? XP_PER_BONUS_POINT : XP_PER_BONUS_POINT - toNext;
  const podium = final.rank <= 3;
  return (
    <div className="stack">
      <div className={`card finalcard ${podium ? 'finalcard--podium' : ''}`}>
        <Avatar look={look} size={120} />
        <Nameplate look={look} name={name} />
        <p className="finalcard__rank">
          {podium && <Trophy size={36} weight="fill" color="#E9A23B" aria-hidden="true" />}
          {podium ? `${ordinal(final.rank)} place!` : `${ordinal(final.rank)} of ${final.playerCount}`}
        </p>
        <div className="finalstats">
          <div>
            <strong>{fmt(final.score)}</strong>
            <span>XP earned</span>
          </div>
          <div>
            <strong>
              {final.correct}/{final.total}
            </strong>
            <span>correct</span>
          </div>
          <div>
            <strong>{final.bestStreak}</strong>
            <span>best streak</span>
          </div>
        </div>
      </div>

      <div className="card coinsum">
        <Coin size={36} />
        <div>
          <strong>+{final.coinsEarned} coins</strong>
          <span className="muted small">
            {final.coinsEarned - final.top3Bonus} for correct answers{final.top3Bonus ? ` + ${final.top3Bonus} top-3 bonus` : ''}
          </span>
        </div>
        <a className="btn btn--violet btn--sm" href="#/locker">
          <ShoppingBag size={18} weight="bold" aria-hidden="true" /> Spend
        </a>
      </div>

      <div className="card grade">
        <div className="row-between">
          <h2 className="h3">Class standing bonus</h2>
          <span className="grade__val">
            +{final.bonusPoints}
            <small>/{BONUS_POINT_CAP}</small>
          </span>
        </div>
        <div className="pips" role="img" aria-label={`${final.bonusPoints} of ${BONUS_POINT_CAP} bonus points`}>
          {Array.from({ length: BONUS_POINT_CAP }, (_, i) => (
            <span key={i} className={`pip ${i < final.bonusPoints ? 'pip--on' : ''} ${i >= final.bonusPoints - final.bonusPointsGained && i < final.bonusPoints ? 'pip--new' : ''}`} />
          ))}
        </div>
        <p className="small muted">
          {toNext === null
            ? 'Maxed for this term. Keep playing for coins and streak unlocks.'
            : `${fmt(final.termXp)} XP this term · ${fmt(toNext)} XP to the next point`}
        </p>
        {toNext !== null && (
          <div className="meter" aria-hidden="true">
            <div style={{ width: `${(intoPoint / XP_PER_BONUS_POINT) * 100}%` }} />
          </div>
        )}
        {final.bonusPointsGained > 0 && (
          <p className="grade__gain">
            <Sparkle size={18} weight="fill" aria-hidden="true" /> +{final.bonusPointsGained} bonus point{final.bonusPointsGained > 1 ? 's' : ''} this round
          </p>
        )}
      </div>

      <EmoteButton look={look} />
      <p className="small muted center-text">The host may start another round. Stay here to play again.</p>
      <button
        className="btn btn--ghost btn--sm"
        onClick={() => {
          leaveRoom();
          navigate('/');
        }}
      >
        <SignOut size={18} weight="bold" aria-hidden="true" /> Leave game
      </button>
    </div>
  );
}

function EmoteButton({ look }: { look: Look }) {
  const [cool, setCool] = useState(false);
  const item = getItem(look.emote);
  return (
    <button
      className={`emotebtn ${cool ? 'emotebtn--cool' : ''}`}
      disabled={cool}
      onClick={() => {
        socket.emit('player:emote');
        setCool(true);
        setTimeout(() => setCool(false), 1600);
      }}
    >
      <EmoteBadge id={look.emote} size={40} />
      {cool ? (
        <>
          <Check size={18} weight="bold" aria-hidden="true" /> Sent to the projector
        </>
      ) : (
        <>
          Send {item?.name ?? 'emote'} to the projector
          <PaperPlaneTilt size={18} weight="bold" aria-hidden="true" />
        </>
      )}
    </button>
  );
}
