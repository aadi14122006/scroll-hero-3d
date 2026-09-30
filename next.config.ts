import type { NextConfig } from "next";

/**
 * Next.js configuration for scroll-hero-3d.
 *
 * Static export:
 *   When GITHUB_PAGES=true (set in the GitHub Actions workflow),
 *   the build outputs a static site with basePath and assetPrefix
 *   set to "/scroll-hero-3d" so assets resolve correctly on GitHub Pages.
 *
 *   For Vercel and local dev, these are unset (no basePath needed).
 */
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  ...(isGitHubPages && {
    basePath: '/scroll-hero-3d',
    assetPrefix: '/scroll-hero-3d/',
  }),
};

export default nextConfig;
