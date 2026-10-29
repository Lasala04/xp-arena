// Locker & Coin Shop: buy items with coins, mix and match, pick colors, save up to 3 loadouts.

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, Check, CheckCircle, Lock, WarningCircle } from '@phosphor-icons/react';
import type { Look, Profile } from '../../shared/types';
import { CATEGORIES, COLOR_NAMES, SWATCHES, TONES, itemsIn, ownsItem, type CatalogItem, type ItemCategory } from '../../shared/catalog';
import { Avatar } from '../components/Avatar';
import { EmoteBadge } from '../components/Emote';
import { ANSWER_COLORS, Coin, Logo, Nameplate, Shape, SkipLink, Spinner } from '../components/bits';
import { navigate } from '../lib/router';
import { buyItem, readSession, saveLoadouts, useGame, useProfile } from '../lib/store';

export function Locker() {
  const { profile, loading } = useProfile();
  const { room } = useGame();
  const inGame = !!room && readSession()?.role === 'player';
  const bump = useBumpOnChange(profile?.coins);

  return (
    <div className="page page--cream">
      <SkipLink />
      <header className="nav">
        <Logo />
        <nav className="nav__links" aria-label="Locker">
          <button className="nav__link" onClick={() => navigate(inGame ? '/play' : '/')}>
            <ArrowLeft size={20} weight="bold" aria-hidden="true" />
            {inGame ? 'Back to game' : 'Home'}
          </button>
          {profile && (
            <span className={`pill pill--coins pill--lg ${bump ? 'pill--bump' : ''}`}>
              <Coin size={20} /> {profile.coins}
              <span className="sr-only"> coins</span>
            </span>
          )}
        </nav>
      </header>
      {loading ? (
        <div className="empty">
          <Spinner />
          <span className="sr-only">Loading</span>
        </div>
      ) : !profile ? (
        <main className="empty" id="main" tabIndex={-1}>
          <h1 className="h2">Create your player first</h1>
          <p className="muted">Your coins, items and loadouts live on your player.</p>
          <button className="btn btn--violet btn--lg" onClick={() => navigate('/play')}>
            Create player
          </button>
        </main>
      ) : (
        <Shop profile={profile} inGame={inGame && room?.phase !== 'lobby'} />
      )}
    </div>
  );
}

/** True for a moment whenever `value` changes after the first render (the coin pill's purchase bump). */
function useBumpOnChange(value: unknown) {
  const [on, setOn] = useState(false);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== undefined && prev.current !== value) {
      setOn(true);
      const t = window.setTimeout(() => setOn(false), 450);
      prev.current = value;
      return () => window.clearTimeout(t);
    }
    prev.current = value;
  }, [value]);
  return on;
}

function Shop({ profile, inGame }: { profile: Profile; inGame: boolean }) {
  const [slot, setSlot] = useState(profile.activeLoadout);
  const [draft, setDraft] = useState<Look>(profile.loadouts[profile.activeLoadout]);
  const [tab, setTab] = useState<ItemCategory>('avatar');
  const [tryOn, setTryOn] = useState<CatalogItem | null>(null);
  const [status, setStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [toast, setToast] = useState<{ text: string; tone: 'ok' | 'err'; id: number } | null>(null);
  const saveTimer = useRef<number>();
  const toastTimer = useRef<number>();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => setDraft(profile.loadouts[slot]), [slot]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (text: string, tone: 'ok' | 'err' = 'ok') => {
    window.clearTimeout(toastTimer.current);
    setToast({ text, tone, id: Date.now() });
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const persist = (look: Look, active = profile.activeLoadout, immediate = false) => {
    const loadouts = profile.loadouts.map((l, i) => (i === slot ? look : l));
    window.clearTimeout(saveTimer.current);
    setStatus('saving');
    const run = () =>
      saveLoadouts(loadouts, active)
        .then(() => setStatus('saved'))
        .catch((e: Error) => {
          setStatus('idle');
          flash(e.message, 'err');
        });
    if (immediate) void run();
    else saveTimer.current = window.setTimeout(run, 450);
  };

  const update = (patch: Partial<Look>, immediate = false) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    persist(next, profile.activeLoadout, immediate);
  };

  const keyOf = (c: ItemCategory) => CATEGORIES.find((x) => x.id === c)!.lookKey;

  const equip = (item: CatalogItem) => {
    update({ [keyOf(item.category)]: item.id } as Partial<Look>, true);
    setTryOn(null);
  };

  const buy = async (item: CatalogItem) => {
    try {
      await buyItem(item.id);
      flash(`Unlocked ${item.name}! −${item.price} coins`);
      equip(item);
    } catch (e) {
      flash((e as Error).message, 'err');
    }
  };

  const selectTab = (id: ItemCategory) => {
    setTab(id);
    setTryOn(null);
  };

  // Tabs follow the ARIA pattern: arrow keys move between them, Home/End jump to the ends.
  const onTabKey = (e: KeyboardEvent, i: number) => {
    const n = CATEGORIES.length;
    const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    selectTab(CATEGORIES[to].id);
    tabRefs.current[to]?.focus();
  };

  const preview = useMemo<Look>(() => (tryOn ? { ...draft, [keyOf(tryOn.category)]: tryOn.id } : draft), [draft, tryOn]);
  const owns = (id: string) => ownsItem(profile.owned, profile.bestStreak, id);
  const isAvatarish = (c: ItemCategory) => c === 'avatar' || c === 'skin' || c === 'frame';

  return (
    <main className="locker" id="main" tabIndex={-1}>
      <aside className="locker__preview card" aria-label="Your look">
        <div className="preview">
          {tryOn && <span className="preview__tag">Trying on: {tryOn.name}</span>}
          <Avatar look={preview} size={208} title={`Preview of your ${preview.avatar} avatar`} />
          <Nameplate look={preview} name={profile.name} size="lg" />
          <div className="preview__extras" aria-hidden="true">
            <EmoteBadge id={preview.emote} size={44} />
            <MiniCards theme={preview.cardTheme} />
          </div>
        </div>

        <ColorRow label="Outfit color" colors={SWATCHES} value={draft.outfitColor} onChange={(c) => update({ outfitColor: c })} custom />
        <ColorRow label="Frame color" colors={SWATCHES} value={draft.frameColor} onChange={(c) => update({ frameColor: c })} custom />
        <ColorRow label="Skin tone" colors={TONES} value={draft.tone} onChange={(c) => update({ tone: c })} />

        <div className="slots">
          <div className="row-between">
            <span className="colors__label" id="slots-label">
              Loadouts
            </span>
            <span className="small muted saved" role="status">
              {status === 'saving' ? (
                'Saving…'
              ) : status === 'saved' ? (
                <>
                  <Check size={16} weight="bold" aria-hidden="true" /> Saved
                </>
              ) : (
                ''
              )}
            </span>
          </div>
          <div className="loadouts" role="group" aria-labelledby="slots-label">
            {profile.loadouts.map((l, i) => (
              <button
                key={i}
                className={`loadout ${i === slot ? 'loadout--on' : ''}`}
                onClick={() => setSlot(i)}
                aria-pressed={i === slot}
                aria-label={`Edit slot ${i + 1}${i === profile.activeLoadout ? ', wearing' : ''}`}
              >
                <Avatar look={i === slot ? draft : l} size={60} />
                <span aria-hidden="true">Slot {i + 1}</span>
                {i === profile.activeLoadout && (
                  <em className="loadout__wear" aria-hidden="true">
                    Wearing
                  </em>
                )}
              </button>
            ))}
          </div>
          {slot !== profile.activeLoadout ? (
            <button className="btn btn--ink btn--block" onClick={() => persist(draft, slot, true)} disabled={inGame}>
              Wear slot {slot + 1}
            </button>
          ) : (
            <p className="small muted">Editing the loadout you're wearing. Changes save automatically.</p>
          )}
          {inGame && <p className="small muted">You can swap loadouts in the lobby, between rounds.</p>}
        </div>
      </aside>

      <section className="locker__shop" aria-labelledby="shop-title">
        <div className="shop__head">
          <p className="eyebrow">Coin Shop</p>
          <h1 id="shop-title">Coins buy the look, not the grade</h1>
          <p className="muted">Earn 10 coins per correct answer and 25 more for a top-3 finish. Seasonal items unlock with answer streaks.</p>
        </div>

        <div className="tabs" role="tablist" aria-label="Item categories">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              ref={(el) => (tabRefs.current[i] = el)}
              role="tab"
              id={`tab-${c.id}`}
              aria-selected={tab === c.id}
              aria-controls="shop-panel"
              tabIndex={tab === c.id ? 0 : -1}
              className={`tab ${tab === c.id ? 'tab--on' : ''}`}
              onClick={() => selectTab(c.id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="items" role="tabpanel" id="shop-panel" aria-labelledby={`tab-${tab}`}>
          {itemsIn(tab).map((item) => {
            const owned = owns(item.id);
            const equipped = draft[keyOf(item.category)] === item.id;
            const locked = item.unlockStreak !== undefined && !owned;
            const short = item.price - profile.coins;
            const trying = tryOn?.id === item.id;
            const itemLook = { ...draft, [keyOf(item.category)]: item.id } as Look;
            return (
              <article key={item.id} className={`item ${equipped ? 'item--on' : ''} ${trying ? 'item--trying' : ''}`}>
                <button
                  className="item__try"
                  onClick={() => setTryOn(equipped || trying ? null : item)}
                  aria-pressed={trying}
                  aria-label={`Try on ${item.name}`}
                  aria-describedby={`blurb-${item.id}`}
                  disabled={equipped}
                >
                  <div className="item__art" aria-hidden="true">
                    {isAvatarish(item.category) && <Avatar look={itemLook} size={96} />}
                    {item.category === 'nameplate' && <Nameplate look={itemLook} name={profile.name} />}
                    {item.category === 'cardTheme' && <MiniCards theme={item.id} big />}
                    {item.category === 'emote' && <EmoteBadge id={item.id} size={72} />}
                    {item.unlockStreak !== undefined && <span className="item__season">Seasonal</span>}
                  </div>
                  <div className="item__body">
                    <h3>{item.name}</h3>
                    <p id={`blurb-${item.id}`}>{item.blurb}</p>
                  </div>
                </button>
                <div className="item__foot">
                  {equipped ? (
                    <span className="item__state">
                      <CheckCircle size={18} weight="fill" aria-hidden="true" /> Equipped
                    </span>
                  ) : owned ? (
                    <button className="btn btn--ink btn--sm btn--block" onClick={() => equip(item)}>
                      Equip<span className="sr-only"> {item.name}</span>
                    </button>
                  ) : locked ? (
                    <span className="item__state item__state--locked">
                      <Lock size={16} weight="bold" aria-hidden="true" /> {item.unlockStreak}-answer streak · best {profile.bestStreak}
                    </span>
                  ) : (
                    <button className="btn btn--violet btn--sm btn--block" disabled={short > 0} onClick={() => void buy(item)}>
                      <Coin size={16} />
                      {short > 0 ? `${item.price} · need ${short} more` : `Buy · ${item.price}`}
                      <span className="sr-only"> coins for {item.name}</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Persistent live region so purchases and errors are announced; the visual toast is separate. */}
      <p className="sr-only" role="status" aria-live="polite">
        {toast?.text ?? ''}
      </p>
      {toast && (
        <div key={toast.id} className={`toast toast--${toast.tone}`} aria-hidden="true">
          {toast.tone === 'ok' ? <CheckCircle size={20} weight="fill" /> : <WarningCircle size={20} weight="fill" />}
          {toast.text}
        </div>
      )}
    </main>
  );
}

function ColorRow({ label, colors, value, onChange, custom }: { label: string; colors: string[]; value: string; onChange: (c: string) => void; custom?: boolean }) {
  const id = `colors-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="colors">
      <span className="colors__label" id={id}>
        {label}
      </span>
      <div className="swatches" role="group" aria-labelledby={id}>
        {colors.map((s) => {
          const on = value.toLowerCase() === s.toLowerCase();
          return (
            <button key={s} className={`swatch ${on ? 'swatch--on' : ''}`} onClick={() => onChange(s)} aria-pressed={on} aria-label={COLOR_NAMES[s] ?? s}>
              <span className="swatch__dot" style={{ background: s }} />
              {on && (
                <span className="swatch__check" aria-hidden="true">
                  <Check size={16} weight="bold" />
                </span>
              )}
            </button>
          );
        })}
        {custom && (
          <label className="swatch swatch--custom" title="Pick any color">
            <span className="swatch__dot">
              <span style={{ background: value }} />
            </span>
            <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`Custom ${label.toLowerCase()}`} />
          </label>
        )}
      </div>
    </div>
  );
}

function MiniCards({ theme, big }: { theme: string; big?: boolean }) {
  return (
    <div className={`minicards cards--${theme} ${big ? 'minicards--big' : ''}`} aria-hidden="true">
      {ANSWER_COLORS.map((c, i) => (
        <span key={c} className={`pad__ans ans--${c}`}>
          <Shape i={i} size={big ? 16 : 12} />
        </span>
      ))}
    </div>
  );
}
