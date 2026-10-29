import { useState, type FormEvent } from 'react';
import { Check, ShoppingBag, Table } from '@phosphor-icons/react';
import { Avatar } from '../components/Avatar';
import { ANSWER_COLORS, Coin, Flame, Logo, Shape, SkipLink } from '../components/bits';
import { DEFAULT_LOOK } from '../../shared/catalog';
import { navigate } from '../lib/router';
import { useProfile } from '../lib/store';
import type { Look } from '../../shared/types';

const CAST: Look[] = [
  { ...DEFAULT_LOOK, avatar: 'nurse', skin: 'scrubs', outfitColor: '#12A594', tone: '#AE7446', frame: 'ring', frameColor: '#12A594' },
  { ...DEFAULT_LOOK, avatar: 'heartie', skin: 'champion', outfitColor: '#5236E0', frame: 'laurel', frameColor: '#E9A23B' },
  { ...DEFAULT_LOOK, avatar: 'labtech', skin: 'surgical', outfitColor: '#3B82F6', tone: '#F6D7BD', frame: 'hex', frameColor: '#5236E0' },
];

const MECHANICS = [
  { big: '1,000', name: 'Points (XP)', body: 'Up to 1,000 per correct answer. Faster answers earn more; wrong answers earn 0.' },
  { big: '+200', name: 'Streak bonus', body: '3 correct in a row adds +200 XP, and it keeps stacking.' },
  { big: '+5', name: 'Grade incentive', body: 'Every 1,000 XP = +1 bonus point in class standing, capped at +5 per term.' },
  { big: '10', name: 'Coins', body: '10 coins per correct answer, plus 25 for finishing in the top 3.' },
  { big: 'Top 5', name: 'Leaderboard', body: 'Top 5 after each question; full ranking at the end of the round.' },
];

const STEPS = [
  { name: 'Join', body: 'Enter the room code, pick your avatar and equipped skin.' },
  { name: 'Answer', body: '15 timed questions on prefixes, suffixes, roots and patient scenarios.' },
  { name: 'Review', body: 'Every question ends with the term broken down: cardi + o + logy.' },
  { name: 'Spend', body: 'XP goes to the class record; coins go to the shop for new looks.' },
];

export function Home() {
  const [code, setCode] = useState('');
  const { profile } = useProfile();

  const join = (e: FormEvent) => {
    e.preventDefault();
    navigate(code.length === 6 ? `/play?code=${code}` : '/play');
  };

  return (
    <div className="page page--cream">
      <SkipLink />
      <header className="nav">
        <Logo />
        <nav className="nav__links" aria-label="Main">
          <a href="#/locker" className="nav__link">
            <ShoppingBag size={20} weight="bold" aria-hidden="true" />
            Locker &amp; Shop
          </a>
          <a href="#/record" className="nav__link">
            <Table size={20} weight="bold" aria-hidden="true" />
            Class record
          </a>
          {profile && (
            <a href="#/locker" className="pill pill--coins" aria-label={`${profile.coins} coins. Open the shop`}>
              <Coin /> {profile.coins}
            </a>
          )}
        </nav>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero">
          <div className="hero__copy">
            <p className="eyebrow">Live medical-terminology quiz</p>
            <h1 className="hero__title">
              Every right answer <span className="ink-violet">pays out twice.</span>
            </h1>
            <p className="hero__lede">
              XP that counts toward your grade, and coins for your avatar. Learn the prefixes, suffixes and roots behind every medical term, one timed question at a time.
            </p>

            <form className="pin" onSubmit={join}>
              <label className="sr-only" htmlFor="home-pin">
                Game PIN
              </label>
              <input
                id="home-pin"
                className="pin__input"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Game PIN"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <button className="btn btn--ink btn--lg" type="submit">
                Join game
              </button>
            </form>
            <div className="hero__alt">
              <span>Teaching today?</span>
              <button className="btn btn--violet btn--lg" onClick={() => navigate('/host')}>
                Host a game
              </button>
            </div>
          </div>

          <div className="hero__art" aria-hidden="true">
            <div className="demo-card scheme-dark">
              <div className="demo-card__top">
                <span className="chip chip--recall">Recall</span>
                <span className="demo-card__q">Q 3 / 15</span>
                <span className="demo-card__timer">14</span>
              </div>
              <p className="demo-card__prompt">What does this word part mean?</p>
              <p className="demo-card__term">cardi-</p>
              <div className="demo-card__grid">
                {['Heart', 'Lung', 'Liver', 'Blood'].map((c, i) => (
                  <div key={c} className={`demo-ans ans--${ANSWER_COLORS[i]} ${i === 0 ? 'demo-ans--right' : ''}`}>
                    <Shape i={i} size={18} />
                    {c}
                    {i === 0 && <Check className="demo-ans__check" size={18} weight="bold" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="float float--xp">+1,000 XP</div>
            <div className="float float--coins">
              <Coin /> +10
            </div>
            <div className="float float--streak">
              <Flame /> 3 in a row · +200
            </div>
            <div className="cast">
              {CAST.map((l, i) => (
                <div key={i} className="cast__item" style={{ animationDelay: `${i * 0.4}s` }}>
                  <Avatar look={l} size={84} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="mech-title">
          <div className="section__head">
            <p className="eyebrow">Game mechanics</p>
            <h2 id="mech-title">How points, grades and coins work</h2>
          </div>
          <div className="mech">
            {MECHANICS.map((m, i) => (
              <article key={m.name} className="mech__card">
                <div className={`mech__big ans--${ANSWER_COLORS[i % ANSWER_COLORS.length]}`}>{m.big}</div>
                <h3>{m.name}</h3>
                <p>{m.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section--ink scheme-dark" aria-labelledby="steps-title">
          <div className="section__head">
            <p className="eyebrow">One class session</p>
            <h2 id="steps-title">Four steps, about fifteen minutes</h2>
          </div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.name} className="steps__item">
                <span className={`steps__num ans--${ANSWER_COLORS[i]}`} aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{s.name}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
          <div className="section__cta">
            <button className="btn btn--violet btn--lg" onClick={() => navigate('/host')}>
              Host a game
            </button>
            <button className="btn btn--ghost btn--lg" onClick={() => navigate('/locker')}>
              Open the Coin Shop
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>XP Arena · Class Activity: Design a GBL Idea</span>
        <span>Lasala · Jomoc · David · Ausan · Mayam</span>
      </footer>
    </div>
  );
}
