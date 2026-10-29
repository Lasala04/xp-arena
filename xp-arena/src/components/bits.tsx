// Small presentational pieces shared across screens.

import { useEffect, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import type { Look, QuestionKind, WordPart } from '../../shared/types';
import { navigate } from '../lib/router';

export const ANSWER_COLORS = ['violet', 'coral', 'teal', 'amber'] as const;
export const ANSWER_NAMES = ['Triangle', 'Diamond', 'Circle', 'Square'];

export function Shape({ i, size = 28 }: { i: number; size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true" className="shape">
      {i === 0 && <path d="M16 4 L29 27 H3 Z" fill="currentColor" />}
      {i === 1 && <path d="M16 2 L30 16 L16 30 L2 16 Z" fill="currentColor" />}
      {i === 2 && <circle cx="16" cy="16" r="13" fill="currentColor" />}
      {i === 3 && <rect x="4" y="4" width="24" height="24" rx="3" fill="currentColor" />}
    </svg>
  );
}

export function Logo({ onDark = false, compact = false }: { onDark?: boolean; compact?: boolean }) {
  return (
    <a
      href="#/"
      className={`logo ${onDark ? 'logo--dark' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        navigate('/');
      }}
    >
      <span className="logo__mark" aria-hidden="true">
        XP
      </span>
      {!compact && <span className="logo__word">Arena</span>}
    </a>
  );
}

/** Jumps keyboard users past the header. The app uses a hash router, so this focuses <main> instead of linking to #main. */
export function SkipLink() {
  return (
    <a
      className="skip"
      href="#main"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById('main')?.focus();
      }}
    >
      Skip to content
    </a>
  );
}

export function Coin({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="coin">
      <circle cx="12" cy="12" r="11" fill="#F2B544" />
      <circle cx="12" cy="12" r="8" fill="none" stroke="#C98A14" strokeWidth="1.6" />
      <path d="M10.5 7.5 h3 v3 h3 v3 h-3 v3 h-3 v-3 h-3 v-3 h3 Z" fill="#C98A14" />
    </svg>
  );
}

export function Flame({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className="flame">
      <path d="M12 2 C13 7 18 9 18 15 A6 6 0 0 1 6 15 C6 11 9 10 9 6 C11 8 11 10 12 11 C13 8 12 5 12 2 Z" fill="#F2545B" />
      <path d="M12 12 C13 14 15 15 15 17 A3 3 0 0 1 9 17 C9 15 11 14 12 12 Z" fill="#F2B544" />
    </svg>
  );
}

export function Nameplate({ look, name, size = 'md' }: { look: Look; name: string; size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`plate plate--${look.nameplate} plate--${size}`}>{name}</span>;
}

const KIND_LABEL: Record<QuestionKind, string> = { recall: 'Recall', decode: 'Decode', apply: 'Apply' };
/** `onDark` is accepted for older call sites; chip colors now come from the theme tokens. */
export function KindChip({ kind }: { kind: QuestionKind; onDark?: boolean }) {
  return <span className={`chip chip--${kind}`}>{KIND_LABEL[kind]}</span>;
}

/** The Review step: cardi + o + logy = study of the heart. */
export function Breakdown({ parts, result, term, onDark }: { parts: WordPart[]; result: string; term?: string; onDark?: boolean }) {
  return (
    <div className={`breakdown ${onDark ? 'breakdown--dark' : ''}`}>
      <div className="breakdown__parts">
        {parts.map((p, i) => (
          <div className="breakdown__group" key={i} style={{ animationDelay: `${i * 120}ms` }}>
            {i > 0 && <span className="breakdown__plus">+</span>}
            <div className="part">
              <span className="part__text">{p.part}</span>
              <span className="part__meaning">{p.meaning}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="breakdown__result" style={{ animationDelay: `${parts.length * 120 + 80}ms` }}>
        <span className="breakdown__eq">=</span>
        <span>
          {term && <strong>{term}: </strong>}
          {result}
        </span>
      </div>
    </div>
  );
}

export function TimerRing({ left, total, size = 120 }: { left: number; total: number; size?: number }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, left / total));
  const secs = Math.ceil(left / 1000);
  const urgent = secs <= 5;
  return (
    <div className={`timer ${urgent ? 'timer--urgent' : ''}`} style={{ width: size, height: size }} role="timer" aria-label={`${secs} seconds left`}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r={r} className="timer__track" />
        <circle cx="50" cy="50" r={r} className="timer__bar" strokeDasharray={circ} strokeDashoffset={circ * (1 - frac)} transform="rotate(-90 50 50)" />
      </svg>
      <span className="timer__num">{secs}</span>
    </div>
  );
}

export function QR({ text, size = 160 }: { text: string; size?: number }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    QRCode.toString(text, { type: 'svg', margin: 0, color: { dark: '#16141F', light: '#00000000' }, errorCorrectionLevel: 'M' })
      .then(setSvg)
      .catch(() => setSvg(''));
  }, [text]);
  return <div className="qr" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} aria-label={`QR code for ${text}`} role="img" />;
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function Dots() {
  return (
    <span className="dots" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export function Stat({ value, label, icon, tone }: { value: ReactNode; label: string; icon?: ReactNode; tone?: string }) {
  return (
    <div className={`stat ${tone ? `stat--${tone}` : ''}`}>
      <div className="stat__value">
        {icon}
        {value}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  );
}

export function fmt(n: number) {
  return n.toLocaleString('en-US');
}

export function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
