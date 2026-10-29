// Victory emotes as SVG badges (no emoji: they render differently on every phone and projector).

import type { CSSProperties } from 'react';
import { Barbell, HandsClapping, HandWaving, Heartbeat, MicrophoneStage, Stethoscope, Trophy, type Icon } from '@phosphor-icons/react';
import { getItem, type EmoteIcon } from '../../shared/catalog';

const STYLE: Record<EmoteIcon, { icon?: Icon; bg: string; fg: string }> = {
  clap: { icon: HandsClapping, bg: '#E9A23B', fg: '#16141F' },
  wave: { icon: HandWaving, bg: '#12A594', fg: '#16141F' },
  flex: { icon: Barbell, bg: '#F2545B', fg: '#16141F' },
  heartbeat: { icon: Heartbeat, bg: '#EC4899', fg: '#16141F' },
  stetho: { icon: Stethoscope, bg: '#5236E0', fg: '#FFFFFF' },
  trophy: { icon: Trophy, bg: '#F2B544', fg: '#5A3A00' },
  mic: { icon: MicrophoneStage, bg: '#16141F', fg: '#F2B544' },
  jack: { bg: '#2A1640', fg: '#F28C28' },
};

/** The seasonal jack-o'-lantern; Phosphor has no pumpkin. Matches the pumpkin hat in Avatar.tsx. */
function Pumpkin({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <path d="M16 7 C16 4 18 3 20 3" stroke="#2F7A3A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="16" cy="18" rx="13" ry="11" fill="currentColor" />
      <path d="M16 7.5 C12 11 12 25 16 29 M16 7.5 C20 11 20 25 16 29" stroke="#D2691E" strokeWidth="1.4" fill="none" />
      <path d="M9 15 L12 12 L13.5 16 Z M23 15 L20 12 L18.5 16 Z" fill="#2A1640" />
      <path d="M9 20 Q16 26 23 20 L21 21.5 L19.5 20.5 L18 22 L16 20.8 L14 22 L12.5 20.5 L11 21.5 Z" fill="#2A1640" />
    </svg>
  );
}

export function EmoteBadge({ id, size = 48 }: { id: string; size?: number }) {
  const key = getItem(id)?.icon ?? 'clap';
  const { icon: Glyph, bg, fg } = STYLE[key];
  const inner = Math.round(size * 0.6);
  return (
    <span className="emote-badge" style={{ '--size': `${size}px`, '--emote-c': bg, '--emote-on': fg } as CSSProperties} aria-hidden="true">
      {Glyph ? <Glyph size={inner} weight="fill" /> : <Pumpkin size={inner} />}
    </span>
  );
}
