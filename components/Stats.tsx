'use client';

import { STATS } from '@/lib/constants';

/**
 * Stats – Four impact metric cards displayed below the headline.
 * Each card has a large percentage value and a description.
 * Animated in via GSAP stagger from the Hero component.
 */
export default function Stats({
  statRefs,
}: {
  statRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-5xl px-4">
      {STATS.map((stat, i) => (
        <div
          key={i}
          ref={(el) => {
            statRefs.current[i] = el;
          }}
          className="rounded-xl p-4 md:p-6 flex flex-col gap-1"
          style={{
            backgroundColor: stat.color + '15', // 15 = ~8% opacity hex suffix
            borderLeft: `3px solid ${stat.color}`,
            opacity: 0,
            transform: 'translateY(30px)',
          }}
        >
          <span
            className="text-3xl md:text-5xl font-bold"
            style={{ color: stat.color }}
          >
            {stat.value}
          </span>
          <span className="text-xs md:text-sm text-gray-400">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
