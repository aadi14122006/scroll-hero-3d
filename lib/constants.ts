// lib/constants.ts
// Central constants for colors, stats data, and animation timings

/** Brand accent color – lime green */
export const ACCENT = '#c8ff3d' as const;

/** Near-black background */
export const BG = '#0a0a0a' as const;

/** Muted grey for secondary text */
export const MUTED = '#666666' as const;

/** Dim grey for headline letters before they light up */
export const DIM = '#333333' as const;

/** Headline text, each character is an element (spaces included) */
export const HEADLINE = 'WELCOME ITZ FIZZ';

/** Impact stats displayed below the headline */
export interface Stat {
  value: string;
  label: string;
  color: string;
}

export const STATS: Stat[] = [
  { value: '58%', label: 'Increase in pick up point use', color: ACCENT },
  { value: '23%', label: 'Decrease in customer phone calls', color: '#6ac9ff' },
  { value: '27%', label: 'Increase in pick up point use', color: '#ffffff' },
  { value: '40%', label: 'Decrease in customer phone calls', color: '#fa7328' },
];

/** Animation timing constants */
export const ANIM = {
  /** Intro headline stagger delay in seconds */
  headlineStagger: 0.06,
  /** Intro stats stagger delay in seconds */
  statsStagger: 0.18,
  /** Camera dolly-in duration in seconds */
  cameraDolly: 2,
  /** ScrollTrigger scrub smoothness (seconds) */
  scrub: 1,
  /** Total scroll length as percentage of viewport height */
  scrollLength: '+=450%',
  /** Lerp factor for smooth interpolation in render loop */
  lerpFactor: 0.1,
} as const;
