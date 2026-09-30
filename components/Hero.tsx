// components/Hero.tsx
// The main hero section: pins on scroll, contains the 3D scene,
// headline, and stats. Orchestrates intro and scroll animations.

'use client';

import { useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroHeadline from './HeroHeadline';
import Stats from './Stats';
import { ANIM, DIM, HEADLINE, STATS } from '@/lib/constants';

gsap.registerPlugin(ScrollTrigger);

// Load 3D scene client-only to avoid SSR errors with three.js
const CarScene = dynamic(() => import('./CarScene'), { ssr: false });

/**
 * Hero — The full-screen hero section.
 *
 * Layout:
 *   - 100svh pinned section (ScrollTrigger pin)
 *   - 3D canvas fills the entire section (absolute positioned)
 *   - Headline and stats overlay on top with z-index
 *
 * Animations:
 *   1. Intro (on mount): headline letters stagger in, stats fade up
 *   2. Scroll: headline letters progressively light up (dim → white),
 *      stats shift slightly upward
 */
export default function Hero() {
  const letterRefs = useRef<(HTMLSpanElement | null)[]>(
    new Array(HEADLINE.length).fill(null)
  );
  const statRefs = useRef<(HTMLDivElement | null)[]>(
    new Array(STATS.length).fill(null)
  );
  const sectionRef = useRef<HTMLDivElement>(null);

  // ── Intro animations (run once on mount) ─────────────────────
  useEffect(() => {

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const ctx = gsap.context(() => {
      // Headline letters: stagger fade + translate up
      const validLetters = letterRefs.current.filter(Boolean);
      if (validLetters.length) {
        gsap.to(validLetters, {
          opacity: 1,
          y: 0,
          duration: prefersReducedMotion ? 0 : 0.8,
          stagger: prefersReducedMotion ? 0 : ANIM.headlineStagger,
          ease: 'power3.out',
          delay: 0.3,
        });
      }

      // Stats: stagger fade + translate up
      const validStats = statRefs.current.filter(Boolean);
      if (validStats.length) {
        gsap.to(validStats, {
          opacity: 1,
          y: 0,
          duration: prefersReducedMotion ? 0 : 0.6,
          stagger: prefersReducedMotion ? 0 : ANIM.statsStagger,
          ease: 'power3.out',
          delay: prefersReducedMotion ? 0 : 1.2, // After headline finishes
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // ── Scroll progress callback from CarScene ───────────────────
  // Lights up headline letters progressively and shifts stats
  const onProgressChange = useCallback((progress: number) => {
    // Map scroll progress to letter lighting
    // Each letter lights up at evenly spaced progress intervals
    const letters = letterRefs.current;
    const totalLetters = letters.length;

    letters.forEach((el, i) => {
      if (!el) return;
      const threshold = i / totalLetters;
      if (progress >= threshold) {
        // Lit: white
        el.style.color = '#ffffff';
      } else {
        // Dim: grey
        el.style.color = DIM;
      }
    });

    // Stats shift slightly upward with stagger based on scroll
    const stats = statRefs.current;
    stats.forEach((el, i) => {
      if (!el) return;
      const offset = Math.max(0, progress - 0.2 - i * 0.05);
      const shift = Math.min(offset * 20, 10); // Max 10px up
      el.style.transform = `translateY(-${shift}px)`;
    });
  }, []);

  return (
    <section
      id="hero-section"
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{
        height: '100svh',
        backgroundColor: '#0a0a0a',
      }}
    >
      {/* 3D Canvas — fills the section */}
      <CarScene onProgressChange={onProgressChange} />

      {/* Text overlay */}
      <div
        className="relative z-10 flex flex-col items-center justify-center h-full gap-8 md:gap-12 pointer-events-none"
        style={{ paddingTop: '10vh', paddingBottom: '5vh' }}
      >
        {/* Headline */}
        <HeroHeadline letterRefs={letterRefs} />

        {/* Stats */}
        <div className="mt-auto mb-8 w-full flex justify-center">
          <Stats statRefs={statRefs} />
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 opacity-60">
        <span className="text-xs text-gray-500 tracking-widest uppercase">
          Scroll to explore
        </span>
        <div className="w-5 h-8 rounded-full border border-gray-600 flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-gray-500 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
