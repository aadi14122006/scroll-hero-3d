# 🏎️ Scroll Hero 3D

A premium scroll-driven 3D hero section animation built with **Next.js**, **Three.js**, **GSAP**, and **Tailwind CSS**.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Three.js](https://img.shields.io/badge/Three.js-r170-049EF4?logo=three.js)
![GSAP](https://img.shields.io/badge/GSAP-3.12-88CE02)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

## 🔗 Live Demo

- **GitHub Pages:** [https://aadi14122006.github.io/scroll-hero-3d](https://aadi14122006.github.io/scroll-hero-3d)
- **Vercel:** *(coming soon)*

## ✨ Features

- **Scroll-driven 3D animation** — A procedurally built car follows a CatmullRom spline path as you scroll, moving in all directions: left/right, forward/back, up a ramp, and through curves.
- **Camera orbiting** — The camera smoothly orbits the car (front, side, rear views) with eased distance and height transitions.
- **Car physics** — Heading follows the path tangent, pitch changes on ramps, banking lean in turns, and wheels roll based on distance traveled.
- **Premium intro animation** — Headline letters reveal with stagger (fade + translate), camera dolly-in, stats animate in sequence.
- **Scroll letter lighting** — Headline letters progressively illuminate from dim grey to white as the car travels.
- **Endless road illusion** — Ground plane and grid follow the car so the road appears infinite.
- **Fully responsive** — Adapts to mobile, tablet, and desktop. Wider FOV on portrait mobile.
- **Accessibility** — `aria-label` on headlines, `prefers-reduced-motion` respected (static pose, no animation).
- **Performance** — Only transforms/opacity animated, pixel ratio capped at 2, proper Three.js disposal on unmount, GSAP context cleanup.

## 🏗️ How the Scroll Animation Works

1. **ScrollTrigger** pins the hero section and maps scroll progress (0–1) to a `scrollProgress` ref.
2. **GSAP ticker** (render loop) lerps `currentProgress` toward the scroll target with factor 0.1, adding inertia.
3. **CatmullRomCurve3** provides the car's position at any progress `t` via `getPointAt(t)`.
4. Car **heading** is derived from the curve tangent, smoothed with quaternion slerp.
5. **Banking** is computed from tangent direction change (signed curvature), clamped to ±0.3 rad.
6. **Wheel roll** is proportional to distance traveled per frame.
7. **Camera** orbits using sinusoidal offset from the car position, lerped for smoothness.

## 📁 Project Structure

```
scroll-hero-3d/
├── app/
│   ├── layout.tsx        # Root layout with metadata
│   ├── page.tsx           # Main page (Hero + spacer)
│   └── globals.css        # Base styles, dark theme
├── components/
│   ├── Hero.tsx           # Orchestrates intro + scroll animations
│   ├── HeroHeadline.tsx   # Letter-split headline with refs
│   ├── Stats.tsx          # Impact metric cards
│   ├── CarScene.tsx       # Three.js canvas + GSAP scroll integration
│   └── CarModel.ts        # Procedural car (swap-in GLTF ready)
├── lib/
│   ├── constants.ts       # Colors, stats data, timings
│   └── path.ts            # Route curve + camera orbit params
├── .github/workflows/
│   └── deploy.yml         # GitHub Pages deployment
└── next.config.ts         # Static export + conditional basePath
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
# Clone the repo
git clone https://github.com/aadi14122006/scroll-hero-3d.git
cd scroll-hero-3d

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and scroll!

### Build

```bash
npm run build    # Static export to ./out
npm run lint     # ESLint
```

## 🎨 Customisation

### Swap in a GLTF Car Model

1. Place your model at `/public/models/car.glb`
2. Open `components/CarModel.ts`
3. Uncomment the `GLTFLoader` import and `loadGLTFCar()` function
4. Update the `createCar()` call in `CarScene.tsx` to use `loadGLTFCar()`

### Edit the Route

Modify the control points in `lib/path.ts` — the `CatmullRomCurve3` will interpolate smoothly.

### Change Brand Colors

All colors are in `lib/constants.ts` (`ACCENT`, `BG`, `MUTED`, `DIM`).

## 📄 Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js 16** (App Router) | Framework, SSG static export |
| **React 19** | UI components |
| **TypeScript 5** | Type safety |
| **Three.js** | 3D rendering (WebGL) |
| **GSAP + ScrollTrigger** | Scroll-driven and intro animations |
| **Tailwind CSS 4** | Utility-first styling |

## 📝 Known Limitations

- The car is procedurally built from primitives (boxes, torus, spheres) — swap in a real GLTF model for production quality.
- Shadow quality is kept moderate (1024×1024) for performance.
- No post-processing effects (bloom, DOF) to keep the bundle lean.

## 📜 License

MIT
