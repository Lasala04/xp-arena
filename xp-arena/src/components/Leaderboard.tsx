import type { CSSProperties } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import type { LeaderRow } from '../../shared/types';
import { Avatar } from './Avatar';
import { Flame, Nameplate, fmt } from './bits';

/** Rows that changed rank start at their old position and slide into the new one (delta is in places). */
const MAX_CLIMB = 5;

export function Leaderboard({ rows, highlight, onDark }: { rows: LeaderRow[]; highlight?: string; onDark?: boolean }) {
  return (
    <ol className={`board ${onDark ? 'board--dark' : ''}`}>
      {rows.map((r, i) => {
        const climb = Math.max(-MAX_CLIMB, Math.min(MAX_CLIMB, r.delta));
        return (
          <li
            key={r.id}
            className={`board__row ${climb ? 'board__row--moved' : ''} ${r.id === highlight ? 'board__row--me' : ''}`}
            style={{ animationDelay: `${i * 70}ms`, '--d': climb } as CSSProperties}
          >
            <span className={`board__rank ${r.rank === 1 ? 'board__rank--first' : ''}`} aria-label={`Rank ${r.rank}`}>
              {r.rank}
            </span>
            <Avatar look={r.look} size={44} />
            <span className="board__name">
              <Nameplate look={r.look} name={r.name} size="sm" />
              {r.streak >= 3 && (
                <span className="board__streak" title={`${r.streak} in a row`}>
                  <Flame size={16} />
                  {r.streak}
                  <span className="sr-only"> answer streak</span>
                </span>
              )}
            </span>
            <span className={`board__delta ${r.delta > 0 ? 'up' : r.delta < 0 ? 'down' : ''}`}>
              {r.delta > 0 && (
                <>
                  <CaretUp size={14} weight="fill" aria-hidden="true" />
                  {r.delta}
                  <span className="sr-only"> places up</span>
                </>
              )}
              {r.delta < 0 && (
                <>
                  <CaretDown size={14} weight="fill" aria-hidden="true" />
                  {-r.delta}
                  <span className="sr-only"> places down</span>
                </>
              )}
            </span>
            <span className="board__score">
              {fmt(r.score)}
              <span className="sr-only"> XP</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
