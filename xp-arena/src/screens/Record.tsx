// Teacher's class record: term XP and the capped grade bonus for every student.

import { useEffect, useRef, useState } from 'react';
import { ArrowCounterClockwise, ArrowLeft, CheckCircle, WarningCircle } from '@phosphor-icons/react';
import type { RecordRow } from '../../shared/types';
import { BONUS_POINT_CAP, XP_PER_BONUS_POINT } from '../../shared/scoring';
import { Avatar } from '../components/Avatar';
import { Flame, Logo, SkipLink, Spinner, Stat, fmt } from '../components/bits';
import { navigate } from '../lib/router';
import { api } from '../lib/store';

export function Record() {
  const [rows, setRows] = useState<RecordRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);

  const load = () =>
    api<RecordRow[]>('/api/record')
      .then(setRows)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void load();
    const t = window.setInterval(load, 5000);
    return () => window.clearInterval(t);
  }, []);

  // Focus moves into the confirmation (onto the safe choice) and back to the trigger when it closes.
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  const close = () => {
    setConfirming(false);
    requestAnimationFrame(() => resetRef.current?.focus());
  };

  const reset = async () => {
    await api('/api/record/reset', { method: 'POST' });
    close();
    void load();
  };

  const played = rows?.filter((r) => r.gamesPlayed > 0) ?? [];
  const acc = played.filter((r) => r.accuracy !== null);
  const avgAcc = acc.length ? acc.reduce((s, r) => s + (r.accuracy ?? 0), 0) / acc.length : null;
  const totalXp = played.reduce((s, r) => s + r.termXp, 0);
  const capped = played.filter((r) => r.bonusPoints >= BONUS_POINT_CAP).length;
  const target = played.filter((r) => (r.accuracy ?? 0) >= 0.8).length;

  return (
    <div className="page page--cream">
      <SkipLink />
      <header className="nav">
        <Logo />
        <nav className="nav__links" aria-label="Class record">
          <button className="nav__link" onClick={() => navigate('/')}>
            <ArrowLeft size={20} weight="bold" aria-hidden="true" /> Home
          </button>
          <button className="btn btn--violet btn--sm" onClick={() => navigate('/host')}>
            Host a game
          </button>
        </nav>
      </header>

      <main className="record" id="main" tabIndex={-1}>
        <div className="record__head">
          <div>
            <p className="eyebrow">Class record · this term</p>
            <h1>XP and grade bonuses</h1>
            <p className="muted">
              Every {fmt(XP_PER_BONUS_POINT)} XP adds +1 bonus point to class standing, capped at +{BONUS_POINT_CAP} per term. Updates live after each round.
            </p>
          </div>
          {confirming ? (
            <div
              className="confirm"
              role="alertdialog"
              aria-labelledby="confirm-text"
              onKeyDown={(e) => {
                if (e.key === 'Escape') close();
              }}
            >
              <span id="confirm-text">
                <WarningCircle size={20} weight="fill" aria-hidden="true" />
                Reset XP and bonuses for everyone? Coins and items are kept.
              </span>
              <button className="btn btn--coral btn--sm" onClick={() => void reset()}>
                Yes, start new term
              </button>
              <button ref={cancelRef} className="btn btn--ghost btn--sm" onClick={close}>
                Cancel
              </button>
            </div>
          ) : (
            <button ref={resetRef} className="btn btn--ghost btn--sm" onClick={() => setConfirming(true)} disabled={!played.length}>
              <ArrowCounterClockwise size={18} weight="bold" aria-hidden="true" /> Start a new term
            </button>
          )}
        </div>

        <div className="stats">
          <Stat value={played.length} label="students played" />
          <Stat value={avgAcc === null ? '—' : `${Math.round(avgAcc * 100)}%`} label="average accuracy" tone="violet" />
          <Stat value={played.length ? `${target}/${played.length}` : '—'} label="at the 80% target" tone="teal" />
          <Stat value={fmt(totalXp)} label="total XP this term" />
          <Stat value={capped} label={`at the +${BONUS_POINT_CAP} cap`} tone="amber" />
        </div>

        {error && (
          <p className="error" role="alert">
            <WarningCircle size={18} weight="fill" aria-hidden="true" />
            {error}
          </p>
        )}
        {!rows ? (
          <div className="empty">
            <Spinner />
            <span className="sr-only">Loading the class record</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="card empty">
            <h2>No students yet</h2>
            <p className="muted">Host a game. Each student's XP lands here when the round ends.</p>
          </div>
        ) : (
          <div className="card tablewrap" tabIndex={0} role="region" aria-label="Students this term">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Student</th>
                  <th scope="col" className="num">
                    Term XP
                  </th>
                  <th scope="col">Grade bonus</th>
                  <th scope="col" className="num">
                    Accuracy
                  </th>
                  <th scope="col" className="num">
                    Rounds
                  </th>
                  <th scope="col" className="num">
                    Best streak
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const onTarget = r.accuracy !== null && r.accuracy >= 0.8;
                  return (
                    <tr key={r.id}>
                      <td className="muted">{i + 1}</td>
                      <th scope="row" className="who-cell">
                        <span className="who">
                          <Avatar look={r.look} size={36} />
                          {r.name}
                        </span>
                      </th>
                      <td className="num strong">{fmt(r.termXp)}</td>
                      <td>
                        <span className="pips pips--sm" role="img" aria-label={`+${r.bonusPoints} of ${BONUS_POINT_CAP}`}>
                          {Array.from({ length: BONUS_POINT_CAP }, (_, k) => (
                            <span key={k} className={`pip ${k < r.bonusPoints ? 'pip--on' : ''}`} />
                          ))}
                          <b aria-hidden="true">+{r.bonusPoints}</b>
                        </span>
                      </td>
                      <td className={`num ${onTarget ? 'good' : ''}`}>
                        {r.accuracy === null ? (
                          '—'
                        ) : (
                          <span className="good__mark">
                            {onTarget && <CheckCircle size={16} weight="fill" aria-hidden="true" />}
                            {Math.round(r.accuracy * 100)}%{onTarget && <span className="sr-only"> (meets the 80% target)</span>}
                          </span>
                        )}
                      </td>
                      <td className="num">{r.gamesPlayed}</td>
                      <td className="num">
                        {r.bestStreak > 0 ? (
                          <span className="streakcell">
                            <Flame size={14} />
                            {r.bestStreak}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
