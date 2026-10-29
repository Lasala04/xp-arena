import { useId, type ReactNode } from 'react';
import type { Look } from '../../shared/types';

const INK = '#2A2433';

/** Lightens (amt > 0) or darkens (amt < 0) a hex color. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const MASCOTS = new Set(['heartie', 'neura', 'bonnie']);
/** y of the top of each character's head; headwear is drawn for y = 30 and shifted. */
const HEAD_TOP: Record<string, number> = { heartie: 40, neura: 30, bonnie: 44 };

interface Props {
  look: Look;
  size?: number;
  className?: string;
  title?: string;
}

export function Avatar({ look, size = 96, className, title }: Props) {
  const uid = useId().replace(/:/g, '');
  const mascot = MASCOTS.has(look.avatar);
  const top = mascot ? HEAD_TOP[look.avatar] : 30;
  const headwear = skinHeadwear(look);
  return (
    <svg
      viewBox="-8 -8 136 136"
      width={size}
      height={size}
      className={className ? `avatar ${className}` : 'avatar'}
      // Avatars sit beside the player's name, so they're decorative unless a title is given.
      {...(title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true })}
    >
      <defs>
        <clipPath id={`c${uid}`}>
          <circle cx="60" cy="60" r="54" />
        </clipPath>
      </defs>
      <circle cx="60" cy="60" r="54" fill="#FFFDF8" />
      <circle cx="60" cy="60" r="54" fill={look.outfitColor} opacity="0.16" />
      <g clipPath={`url(#c${uid})`}>
        {look.skin === 'hero' && <path d="M18 124 L34 82 L86 82 L102 124 Z" fill={shade(look.outfitColor, -0.35)} />}
        {mascot ? <Mascot look={look} /> : <Human look={look} hasHeadwear={!!headwear} />}
        {look.skin === 'surgical' && <Mask mascot={mascot} y={mascot ? top + 26 : 0} />}
        {headwear && <g transform={`translate(0 ${top - 30})`}>{headwear}</g>}
      </g>
      <Frame look={look} />
    </svg>
  );
}

function Human({ look, hasHeadwear }: { look: Look; hasHeadwear: boolean }) {
  const { tone, outfitColor: c, skin, avatar } = look;
  const body = 'M16 124 C16 94 36 82 60 82 C84 82 104 94 104 124 Z';
  const coat = skin === 'classic' || skin === 'champion';
  return (
    <g>
      {/* outfit */}
      {coat ? (
        <>
          <path d={body} fill="#FBFAF6" stroke="#DCD6E6" strokeWidth="1.5" />
          <path d="M49 82 L60 104 L71 82 Z" fill={c} />
          <path d="M48 83 L60 108 M72 83 L60 108" stroke="#CFC8DD" strokeWidth="2" fill="none" />
          <rect x="74" y="98" width="12" height="9" rx="2" fill="none" stroke="#CFC8DD" strokeWidth="1.6" />
          {skin === 'champion' && <path d={body} fill="none" stroke="#E9A23B" strokeWidth="3" />}
        </>
      ) : (
        <>
          <path d={body} fill={c} />
          <path d="M50 82 L60 96 L70 82 Z" fill={shade(tone, -0.08)} />
          <path d="M49 82 L60 97 L71 82" stroke={shade(c, -0.25)} strokeWidth="2.4" fill="none" strokeLinejoin="round" />
          {skin === 'hero' && (
            <g>
              <circle cx="60" cy="108" r="8" fill="#FFFDF8" />
              <path d="M57 103 h6 v3 h3 v6 h-3 v3 h-6 v-3 h-3 v-6 h3 Z" fill={c} />
            </g>
          )}
        </>
      )}
      {/* neck + head */}
      <rect x="52" y="68" width="16" height="16" rx="5" fill={shade(tone, -0.1)} />
      <circle cx="60" cy="52" r="22" fill={tone} />
      <circle cx="38.5" cy="54" r="4" fill={shade(tone, -0.06)} />
      <circle cx="81.5" cy="54" r="4" fill={shade(tone, -0.06)} />
      {!hasHeadwear || skin === 'hero' ? (
        avatar === 'nurse' ? (
          <path d="M38 50 C37 33 48 27 60 27 C73 27 84 34 82 50 C80 42 70 38 60 38 C51 38 42 42 38 50 Z M74 30 a7 7 0 1 1 6 8" fill="#3A2A26" />
        ) : (
          <path d="M37 52 C36 34 47 28 60 28 C75 28 85 36 83 52 C78 43 71 40 63 42 C55 39 44 42 37 52 Z" fill="#2B2235" />
        )
      ) : null}
      <Face y={0} />
      {skin === 'hero' && (
        <path d="M42 51 C49 47 56 49 60 52 C64 49 71 47 78 51 C78 58 71 61 64 58 L60 56 L56 58 C49 61 42 58 42 51 Z" fill={c} />
      )}
      {skin === 'hero' && (
        <g fill="#FFFDF8">
          <circle cx="52" cy="54" r="3" />
          <circle cx="68" cy="54" r="3" />
        </g>
      )}
      {/* role accessories */}
      {avatar === 'doctor' && (
        <g fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round">
          <path d="M47 84 C44 98 52 106 60 106 C68 106 76 98 73 84" />
          <circle cx="60" cy="110" r="4.5" fill="#C9CED6" />
        </g>
      )}
      {avatar === 'nurse' && !hasHeadwear && (
        <g>
          <path d="M43 34 L48 22 L72 22 L77 34 Z" fill="#FFFFFF" stroke="#DCD6E6" strokeWidth="1.5" />
          <path d="M58 24.5 h4 v3 h3 v4 h-3 v3 h-4 v-3 h-3 v-4 h3 Z" fill="#F2545B" />
        </g>
      )}
      {avatar === 'nurse' && <rect x="38" y="96" width="14" height="10" rx="2" fill="#FFFDF8" stroke="#CFC8DD" strokeWidth="1.4" />}
      {avatar === 'labtech' && !hasHeadwear && (
        <g>
          <path d="M37 40 H83" stroke={INK} strokeWidth="3" />
          <circle cx="51" cy="40" r="7" fill="#BFE7F2" stroke={INK} strokeWidth="2.4" />
          <circle cx="69" cy="40" r="7" fill="#BFE7F2" stroke={INK} strokeWidth="2.4" />
        </g>
      )}
      {avatar === 'labtech' && (
        <g transform="translate(72 94)">
          <path d="M4 0 h6 v5 l5 10 a2 2 0 0 1 -2 3 h-12 a2 2 0 0 1 -2 -3 l5 -10 Z" fill="#FFFDF8" stroke={INK} strokeWidth="1.6" />
          <path d="M2 13 h10 l1.5 3 h-13 Z" fill="#12A594" />
        </g>
      )}
    </g>
  );
}

function Face({ y, dx = 8, big = false }: { y: number; dx?: number; big?: boolean }) {
  const cy = 54 + y;
  return (
    <g>
      {big ? (
        <>
          <circle cx={60 - dx} cy={cy} r="6" fill="#FFFFFF" />
          <circle cx={60 + dx} cy={cy} r="6" fill="#FFFFFF" />
          <circle cx={61 - dx} cy={cy + 1} r="3.4" fill="#16141F" />
          <circle cx={61 + dx} cy={cy + 1} r="3.4" fill="#16141F" />
        </>
      ) : (
        <>
          <circle cx={60 - dx} cy={cy} r="2.7" fill="#16141F" />
          <circle cx={60 + dx} cy={cy} r="2.7" fill="#16141F" />
        </>
      )}
      <path d={`M${53} ${cy + 8} Q60 ${cy + 14} ${67} ${cy + 8}`} stroke="#16141F" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <circle cx={60 - dx - 6} cy={cy + 6} r="3.2" fill="#F2545B" opacity="0.28" />
      <circle cx={60 + dx + 6} cy={cy + 6} r="3.2" fill="#F2545B" opacity="0.28" />
    </g>
  );
}

function Mascot({ look }: { look: Look }) {
  const scarf = (
    <path d="M36 98 C48 106 72 106 84 98 L86 106 C72 114 48 114 34 106 Z" fill={look.outfitColor} stroke={shade(look.outfitColor, -0.25)} strokeWidth="1.5" />
  );
  if (look.avatar === 'heartie')
    return (
      <g>
        <path d="M60 108 C28 90 18 70 22 54 C26 38 48 34 60 50 C72 34 94 38 98 54 C102 70 92 90 60 108 Z" fill="#F2545B" />
        <path d="M34 52 C36 44 44 42 50 46" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.5" />
        <Face y={14} dx={10} big />
        {scarf}
      </g>
    );
  if (look.avatar === 'neura')
    return (
      <g>
        <path
          d="M30 76 C18 72 18 54 30 50 C28 36 42 28 52 34 C56 26 70 26 74 34 C86 30 96 40 92 52 C102 58 100 76 88 78 C86 90 72 94 64 88 C56 94 40 92 38 84 C34 84 31 80 30 76 Z"
          fill="#F49CBB"
        />
        <g stroke="#D9709A" strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d="M60 32 C56 40 64 44 60 52" />
          <path d="M38 44 C44 46 44 52 40 56" />
          <path d="M82 44 C76 46 76 52 80 56" />
          <path d="M44 80 C48 76 54 78 56 82" />
          <path d="M76 80 C72 76 66 78 64 82" />
        </g>
        <Face y={10} dx={10} big />
        {scarf}
      </g>
    );
  // bonnie
  return (
    <g>
      <g fill="#F5F0E1" stroke="#CFC5AA" strokeWidth="2">
        <circle cx="28" cy="50" r="12" />
        <circle cx="28" cy="78" r="12" />
        <circle cx="92" cy="50" r="12" />
        <circle cx="92" cy="78" r="12" />
        <rect x="26" y="46" width="68" height="36" rx="16" />
      </g>
      <rect x="24" y="48" width="72" height="32" rx="14" fill="#F5F0E1" />
      <Face y={8} dx={10} big />
      {scarf}
    </g>
  );
}

function Mask({ mascot, y }: { mascot: boolean; y: number }) {
  if (mascot)
    return (
      <g transform={`translate(0 ${y - 56})`}>
        <rect x="44" y="60" width="32" height="16" rx="6" fill="#CFE8F3" stroke="#9CCADD" strokeWidth="1.5" />
        <path d="M48 66 h24 M48 70 h24" stroke="#9CCADD" strokeWidth="1.2" />
      </g>
    );
  return (
    <g>
      <path d="M40 56 L46 60 M80 56 L74 60" stroke="#9CCADD" strokeWidth="1.6" />
      <rect x="44" y="57" width="32" height="17" rx="7" fill="#CFE8F3" stroke="#9CCADD" strokeWidth="1.5" />
      <path d="M48 63 h24 M48 67.5 h24" stroke="#9CCADD" strokeWidth="1.2" />
    </g>
  );
}

function skinHeadwear(look: Look): ReactNode {
  const c = look.outfitColor;
  switch (look.skin) {
    case 'surgical':
      return (
        <g>
          <path d="M36 40 C36 22 48 16 60 16 C72 16 84 22 84 40 C76 36 68 35 60 35 C52 35 44 36 36 40 Z" fill={shade(c, 0.25)} />
          <path d="M40 34 C50 30 70 30 80 34" stroke={shade(c, -0.1)} strokeWidth="1.6" fill="none" />
          <circle cx="50" cy="26" r="1.6" fill={shade(c, -0.2)} />
          <circle cx="66" cy="24" r="1.6" fill={shade(c, -0.2)} />
        </g>
      );
    case 'champion':
      return (
        <g>
          <path d="M40 34 L42 14 L51 24 L60 10 L69 24 L78 14 L80 34 Z" fill="#F2B544" stroke="#C98A14" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="60" cy="27" r="3" fill="#F2545B" />
          <circle cx="47" cy="29" r="2.2" fill="#5236E0" />
          <circle cx="73" cy="29" r="2.2" fill="#12A594" />
        </g>
      );
    case 'pumpkin':
      return (
        <g>
          <path d="M58 14 C58 8 62 6 66 6" stroke="#2F7A3A" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <ellipse cx="60" cy="26" rx="22" ry="13" fill="#F28C28" />
          <path d="M60 14 C54 20 54 32 60 39 M60 14 C66 20 66 32 60 39 M46 17 C42 24 43 32 48 37 M74 17 C78 24 77 32 72 37" stroke="#D2691E" strokeWidth="2" fill="none" />
        </g>
      );
    default:
      return null;
  }
}

function Frame({ look }: { look: Look }) {
  const c = look.frameColor;
  switch (look.frame) {
    case 'ring':
      return <circle cx="60" cy="60" r="56" fill="none" stroke={c} strokeWidth="7" />;
    case 'hex': {
      const pts = Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        return `${60 + 63 * Math.cos(a)},${60 + 63 * Math.sin(a)}`;
      }).join(' ');
      return <polygon points={pts} fill="none" stroke={c} strokeWidth="6" strokeLinejoin="round" />;
    }
    case 'pulse':
      return (
        <g fill="none" stroke={c} strokeLinecap="round">
          <circle cx="60" cy="60" r="56" strokeWidth="5" strokeDasharray="14 7" />
          <path d="M44 120 h8 l4 -8 l5 14 l4 -10 l3 4 h8" strokeWidth="3.6" strokeLinejoin="round" />
        </g>
      );
    case 'laurel': {
      const leaves = [];
      for (let i = 0; i < 9; i++) {
        const a = ((115 + i * 16) * Math.PI) / 180;
        for (const side of [1, -1]) {
          const x = 60 + side * -58 * Math.cos(a);
          const y = 60 + 58 * Math.sin(a) * -1;
          const rot = side === 1 ? 180 - (115 + i * 16) + 90 : (115 + i * 16) - 90;
          leaves.push(<ellipse key={`${i}${side}`} cx={x} cy={y} rx="7.5" ry="3.6" transform={`rotate(${rot} ${x} ${y})`} fill={c} />);
        }
      }
      return <g>{leaves}</g>;
    }
    case 'bats':
      return (
        <g fill={c}>
          <circle cx="60" cy="60" r="56" fill="none" stroke={c} strokeWidth="4" />
          {[
            [16, 18, -20],
            [100, 14, 20],
            [108, 92, 10],
          ].map(([x, y, r]) => (
            <path
              key={x}
              transform={`translate(${x} ${y}) rotate(${r})`}
              d="M0 0 C-4 -6 -10 -6 -14 -2 C-10 -2 -9 1 -10 4 C-6 2 -3 3 0 6 C3 3 6 2 10 4 C9 1 10 -2 14 -2 C10 -6 4 -6 0 0 Z"
            />
          ))}
        </g>
      );
    default:
      return <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(22,20,31,0.10)" strokeWidth="2" />;
  }
}
