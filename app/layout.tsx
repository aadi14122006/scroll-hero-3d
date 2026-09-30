// app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Scroll Hero 3D — Welcome Itz Fizz',
  description:
    'A premium scroll-driven 3D hero section animation built with Next.js, Three.js, GSAP, and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
