// The teacher's projector view: lobby → question → reveal (review + top 5) → final podium.

import { useEffect, useState } from 'react';
import { ArrowClockwise, ArrowRight, Check, Hourglass, Plus, Table, Timer, Users, WifiSlash, X } from '@phosphor-icons/react';
import type { LeaderRow, RoomState } from '../../shared/types';
import { LEADERBOARD_SIZE } from '../../shared/scoring';
import { Avatar } from '../components/Avatar';
import { ANSWER_COLORS, ANSWER_NAMES, Breakdown, Coin, Dots, KindChip, Logo, Nameplate, QR, Shape, SkipLink, Spinner, TimerRing, fmt } from '../components/bits';
import { EmoteLayer } from '../components/EmoteLayer';
import { Leaderboard } from '../components/Leaderboard';
import { navigate } from '../lib/router';
import { socket } from '../lib/socket';
import { api, game, hostCreate, leaveRoom, readSession, useGame } from '../lib/store';
import { useCountdown } from '../lib/useCountdown';

let pendingCreate: Promise<string> | null = null;

export function Host() {
  const { room, offset, notice, connected } = useGame();
  const [joinBase, setJoinBase] = useState(window.location.origin);

  useEffect(() => {
    const s = readSession();
    if (s?.role === 'player') leaveRoom();
    if (readSession()?.role !== 'host' && !pendingCreate) {
      game.set({ notice: null });
      pendingCreate = hostCreate()
        .catch((e: Error) => {
          game.set({ notice: e.message });
          return '';
        })
        .finally(() => (pendingCreate = null));
    }
  }, []);

  useEffect(() => {
    if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) return;
    api<{ lanIps: string[] }>('/api/info')
      .then((r) => {
        const port = window.location.port ? `:${window.location.port}` : '';
        if (r.lanIps[0]) setJoinBase(`${window.location.protocol}//${r.lanIps[0]}${port}`);
      })
      .catch(() => {});
  }, []);

  const end = () => {
    socket.emit('host:end');
    leaveRoom();
    navigate('/');
  };

  if (!room || readSession()?.role !== 'host') {
    return (
      <div className="page page--ink host host--center">
        {notice ? (
          <div className="empty">
            <h2>{notice}</h2>
            <button className="btn btn--violet" onClick={() => location.reload()}>
              Open a new room
            </button>
          </div>
        ) : (
          <div className="empty">
            <Spinner />
            <p>Opening a room…</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page page--ink host">
      <SkipLink />
      <header className="host__bar">
        <Logo onDark />
        <div className="host__room">
          <span className="host__roomlabel">Game PIN</span>
          <span className="host__roomcode">{spacedPin(room.code)}</span>
        </div>
        <div className="host__barright">
          {!connected && (
            <span className="pill pill--warn" role="status">
              <WifiSlash size={16} weight="bold" aria-hidden="true" /> Reconnecting…
            </span>
          )}
          <span className="pill pill--dark">
            <Users size={16} weight="bold" aria-hidden="true" />
            {room.players.length} {room.players.length === 1 ? 'player' : 'players'}
          </span>
          <button className="btn btn--ghost-light btn--sm" onClick={end}>
            End game
          </button>
        </div>
      </header>

      {room.phase === 'lobby' && <Lobby room={room} joinBase={joinBase} />}
      {room.phase === 'question' && <QuestionView room={room} offset={offset} />}
      {room.phase === 'reveal' && <RevealView room={room} />}
      {room.phase === 'final' && <FinalView room={room} onEnd={end} />}
      <EmoteLayer />
    </div>
  );
}

function spacedPin(code: string) {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}

// ---- lobby ----

function Lobby({ room, joinBase }: { room: RoomState; joinBase: string }) {
  const joinUrl = `${joinBase}/#/play?code=${room.code}`;
  const host = joinBase.replace(/^https?:\/\//, '');
  return (
    <main className="lobby" id="main" tabIndex={-1}>
      <section className="lobby__join scheme-light">
        <p className="eyebrow">Join on your phone or laptop</p>
        <p className="lobby__url">
          Go to <strong>{host}</strong>
        </p>
        <p className="lobby__then">and enter the game PIN</p>
        <div className="lobby__pin">{spacedPin(room.code)}</div>
        <div className="lobby__qr">
          <QR text={joinUrl} size={150} />
          <span>Or scan to join</span>
        </div>
      </section>

      <section className="lobby__players">
        <div className="lobby__head">
          <h2 aria-live="polite">
            {room.players.length ? (
              <>
                {room.players.length} in the arena
              </>
            ) : (
              <>
                Waiting for players <Dots />
              </>
            )}
          </h2>
          <button className="btn btn--ghost btn--sm" onClick={() => socket.emit('host:addBots', 5)} title="Adds simulated classmates so you can try the game alone">
            <Plus size={18} weight="bold" aria-hidden="true" /> Add 5 demo players
          </button>
        </div>

        {room.players.length === 0 ? (
          <div className="lobby__empty">
            <p>Students appear here as they join, wearing their equipped avatar and skin.</p>
          </div>
        ) : (
          <ul className="tiles">
            {room.players.map((p) => (
              <li key={p.id} className={`tile ${p.connected ? '' : 'tile--away'}`}>
                <Avatar look={p.look} size={72} />
                <Nameplate look={p.look} name={p.name} size="sm" />
                {p.bot && <span className="tile__tag">demo</span>}
                <button className="tile__kick" onClick={() => socket.emit('host:kick', p.id)} aria-label={`Remove ${p.name}`}>
                  <span>
                    <X size={14} weight="bold" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="lobby__foot">
          <p className="lobby__hint">
            <Timer size={20} weight="bold" aria-hidden="true" />
            15 questions · 20 seconds each · last one is an untimed review
          </p>
          <button className="btn btn--violet btn--xl" disabled={room.players.length === 0} onClick={() => socket.emit('host:start')}>
            Start game
          </button>
        </div>
      </section>
    </main>
  );
}

// ---- question ----

function Progress({ room }: { room: RoomState }) {
  const q = room.question!;
  return (
    <div className="progress">
      <span className="progress__label">
        Question {q.index + 1} <span>of {q.total}</span>
      </span>
      <div className="progress__track" role="progressbar" aria-label="Round progress" aria-valuemin={0} aria-valuemax={q.total} aria-valuenow={q.index + 1}>
        <div className="progress__fill" style={{ transform: `scaleX(${(q.index + (room.phase === 'reveal' ? 1 : 0.5)) / q.total})` }} />
      </div>
      <KindChip kind={q.kind} onDark />
    </div>
  );
}

function QuestionView({ room, offset }: { room: RoomState; offset: number }) {
  const q = room.question!;
  const left = useCountdown(q.endsAt, offset);
  const active = room.players.filter((p) => p.connected).length;
  return (
    <main className="hq" id="main" tabIndex={-1}>
      <Progress room={room} />
      <div className="hq__stage">
        <div className="hq__prompt">
          <p className="hq__ask">{q.prompt}</p>
          {q.term && <p className="hq__term">{q.term}</p>}
        </div>
        <div className="hq__side">
          {q.timed && left !== null ? (
            <TimerRing left={left} total={q.timeLimitMs!} size={150} />
          ) : (
            <div className="untimed">
              <span className="untimed__label">
                <Hourglass size={22} weight="bold" aria-hidden="true" /> Untimed review
              </span>
              <span className="untimed__body">No speed bonus. Take your time.</span>
            </div>
          )}
          <div className="answered" aria-live="polite" aria-atomic="true">
            <span className="answered__num">{room.answerCount}</span>
            <span className="answered__label">of {active} answered</span>
          </div>
        </div>
      </div>
      <div className="hq__answers">
        {q.choices.map((c, i) => (
          <div key={i} className={`ans ans--${ANSWER_COLORS[i]}`} style={{ animationDelay: `${i * 60}ms` }}>
            <Shape i={i} size={34} />
            <span>
              <span className="sr-only">{ANSWER_NAMES[i]}: </span>
              {c}
            </span>
          </div>
        ))}
      </div>
      <div className="hq__actions">
        <button className="btn btn--ghost-light" onClick={() => socket.emit('host:reveal')}>
          {q.timed ? 'Skip to answer' : 'Reveal answer'}
        </button>
      </div>
    </main>
  );
}

// ---- reveal ----

function RevealView({ room }: { room: RoomState }) {
  const q = room.question!;
  const r = room.reveal!;
  const max = Math.max(1, ...r.counts);
  const last = q.index >= q.total - 1;
  const pct = r.answeredCount ? Math.round((r.correctCount / room.players.length) * 100) : 0;
  return (
    <main className="hr" id="main" tabIndex={-1}>
      <Progress room={room} />
      <div className="hr__grid">
        <section className="hr__left">
          <p className="hr__ask">{q.prompt}</p>
          {q.term && <p className="hr__term">{q.term}</p>}
          <div className="dist">
            {q.choices.map((c, i) => (
              <div key={i} className={`dist__row ${i === r.answer ? 'dist__row--right' : 'dist__row--wrong'}`}>
                <div className={`dist__label ans--${ANSWER_COLORS[i]}`}>
                  <Shape i={i} size={22} />
                  <span>{c}</span>
                  {i === r.answer && (
                    <span className="dist__check">
                      <Check size={18} weight="bold" aria-hidden="true" />
                      <span className="sr-only">Correct answer</span>
                    </span>
                  )}
                </div>
                <div className="dist__bar">
                  <div className={`dist__fill ans--${ANSWER_COLORS[i]}`} style={{ width: `${(r.counts[i] / max) * 100}%` }} />
                  <span className="dist__count">
                    {r.counts[i]}
                    <span className="sr-only"> {r.counts[i] === 1 ? 'player' : 'players'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="hr__summary">
            <strong>{pct}%</strong> of the class got it right
          </p>
        </section>

        <section className="hr__right">
          <div className="review">
            <p className="eyebrow">Review</p>
            <Breakdown parts={r.breakdown} result={r.result} onDark />
          </div>
          <div className="top5">
            <h3>Top {LEADERBOARD_SIZE}</h3>
            <Leaderboard rows={room.leaderboard.slice(0, LEADERBOARD_SIZE)} onDark />
          </div>
        </section>
      </div>
      <div className="hq__actions">
        <button className="btn btn--violet btn--lg" onClick={() => socket.emit('host:next')} autoFocus>
          {last ? 'See final results' : 'Next question'}
          <ArrowRight size={20} weight="bold" aria-hidden="true" />
        </button>
      </div>
    </main>
  );
}

// ---- final ----

function FinalView({ room, onEnd }: { room: RoomState; onEnd: () => void }) {
  const board = room.leaderboard;
  const podium: (LeaderRow | undefined)[] = [board[1], board[0], board[2]];
  return (
    <main className="final" id="main" tabIndex={-1}>
      <Confetti />
      <p className="eyebrow">Round complete</p>
      <h1 className="final__title">The arena has spoken</h1>
      <div className="podium">
        {podium.map((r, i) =>
          r ? (
            <div key={r.id} className={`podium__spot podium__spot--${r.rank}`} style={{ animationDelay: `${[400, 900, 0][i]}ms` }}>
              <Avatar look={r.look} size={r.rank === 1 ? 132 : 104} />
              <Nameplate look={r.look} name={r.name} />
              <span className="podium__score">{fmt(r.score)} XP</span>
              <div className="podium__block">
                <span>
                  <span className="sr-only">Place </span>
                  {r.rank}
                </span>
                <small>
                  <Coin size={14} /> +25 coins
                </small>
              </div>
            </div>
          ) : (
            <div key={i} className="podium__spot podium__spot--empty" />
          ),
        )}
      </div>
      {board.length > 3 && (
        <div className="final__rest">
          <Leaderboard rows={board.slice(3)} onDark />
        </div>
      )}
      <p className="final__note">XP has been added to the class record. Coins are ready to spend in the shop.</p>
      <div className="final__actions">
        <button className="btn btn--violet btn--lg" onClick={() => socket.emit('host:restart')}>
          <ArrowClockwise size={20} weight="bold" aria-hidden="true" /> Play another round
        </button>
        <a className="btn btn--ghost btn--lg" href="#/record" target="_blank" rel="noreferrer">
          <Table size={20} weight="bold" aria-hidden="true" /> Open class record
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        <button className="btn btn--ghost btn--lg" onClick={onEnd}>
          End game
        </button>
      </div>
    </main>
  );
}

function Confetti() {
  const colors = ['#5236E0', '#F2545B', '#12A594', '#E9A23B', '#F4F1E8'];
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: 70 }, (_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 14) * 0.18}s`,
            animationDuration: `${3 + (i % 5) * 0.5}s`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  );
}
