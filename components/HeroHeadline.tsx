'use client';

// Refs are passed from the parent Hero component via props
import { HEADLINE, DIM } from '@/lib/constants';

/**
 * HeroHeadline – Renders the brand text as individually animated spans.
 * Each letter gets a ref so GSAP can stagger-animate them on load
 * and progressively light them up on scroll.
 *
 * The h1 carries an aria-label for accessibility so screen readers
 * get the full text even though it's split into spans.
 */
export default function HeroHeadline({
  letterRefs,
}: {
  letterRefs: React.MutableRefObject<(HTMLSpanElement | null)[]>;
}) {
  const letters = HEADLINE.split('');

  return (
    <h1
      aria-label="Welcome Itz Fizz"
      className="flex flex-wrap justify-center gap-1 md:gap-2 text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-[0.2em] select-none"
    >
      {letters.map((char, i) => (
        <span
          key={i}
          ref={(el) => {
            letterRefs.current[i] = el;
          }}
          className="inline-block transition-none"
          style={{
            color: DIM,
            opacity: 0,
            transform: 'translateY(40px)',
          }}
          aria-hidden="true"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </h1>
  );
}
