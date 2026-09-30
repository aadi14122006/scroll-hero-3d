// app/page.tsx
// Main page — renders the Hero section and a spacer below
// for ScrollTrigger to have scroll room.

import Hero from '@/components/Hero';

export default function Home() {
  return (
    <main>
      <Hero />
      {/* 
        Extra content below the pinned hero.
        This gives ScrollTrigger scroll room (the hero is pinned for 450vh).
        A real site would have more sections here.
      */}
      <section className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-gray-600 text-sm tracking-widest uppercase">
          — End of scroll animation —
        </p>
      </section>
    </main>
  );
}
