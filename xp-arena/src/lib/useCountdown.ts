import { useEffect, useState } from 'react';

/** Milliseconds left until `endsAt` (server clock), updated every animation frame. */
export function useCountdown(endsAt: number | null, offset: number): number | null {
  const calc = () => (endsAt === null ? null : Math.max(0, endsAt - (Date.now() + offset)));
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    if (endsAt === null) return setLeft(null);
    let raf = 0;
    const tick = () => {
      const v = calc();
      setLeft(v);
      if (v && v > 0) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, offset]);
  return left;
}
