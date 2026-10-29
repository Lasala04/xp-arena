import { useEffect, useState } from 'react';
import type { EmoteEvent } from '../../shared/types';
import { socket } from '../lib/socket';
import { EmoteBadge } from './Emote';

interface Floating extends EmoteEvent {
  key: string;
  x: number;
}

/** Victory emotes float up the projector when players send them. */
export function EmoteLayer() {
  const [items, setItems] = useState<Floating[]>([]);
  useEffect(() => {
    const on = (e: EmoteEvent) => {
      const key = `${e.playerId}-${e.at}`;
      setItems((list) => [...list.slice(-24), { ...e, key, x: 6 + Math.random() * 88 }]);
      setTimeout(() => setItems((list) => list.filter((i) => i.key !== key)), 3200);
    };
    socket.on('room:emote', on);
    return () => {
      socket.off('room:emote', on);
    };
  }, []);
  return (
    <div className="emotes" aria-hidden="true">
      {items.map((i) => (
        <div key={i.key} className="emote" style={{ left: `${i.x}%` }}>
          <EmoteBadge id={i.emote} size={72} />
          <span className="emote__name">{i.name}</span>
        </div>
      ))}
    </div>
  );
}
