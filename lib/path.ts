// lib/path.ts
// Defines the 3D route curve the car follows, driven by scroll progress 0→1.
// Uses THREE.CatmullRomCurve3 for smooth interpolation through control points.
// The path includes: straight run, left turn, ramp (airborne), curved loop, and final straight.

import * as THREE from 'three';

/**
 * Creates the car's route curve.
 * The curve is defined in world-space coordinates:
 *   x = left/right, y = up/down (height), z = toward/away from camera.
 *
 * Control points are hand-tuned to give a compelling sequence of motions:
 *   1. Initial straight (z-forward)
 *   2. Sweeping right turn
 *   3. Ramp up (car goes airborne)
 *   4. Descent and left curve
 *   5. Looping back around
 *   6. Final straight approach
 */
export function createRouteCurve(): THREE.CatmullRomCurve3 {
  const points = [
    new THREE.Vector3(0, 0, 0),          // Start
    new THREE.Vector3(2, 0, -8),          // Slight right, forward
    new THREE.Vector3(6, 0, -16),         // Right turn deepens
    new THREE.Vector3(10, 0, -22),        // Sweeping right
    new THREE.Vector3(12, 0.5, -28),      // Begin ramp up
    new THREE.Vector3(12, 3, -34),        // Ramp peak (airborne)
    new THREE.Vector3(10, 4, -38),        // Apex – highest point
    new THREE.Vector3(6, 2, -42),         // Descending left
    new THREE.Vector3(0, 0.5, -46),       // Low point of descent
    new THREE.Vector3(-6, 0, -50),        // Left curve
    new THREE.Vector3(-10, 0, -54),       // Deep left
    new THREE.Vector3(-12, 0, -58),       // Loop apex left
    new THREE.Vector3(-10, 0, -64),       // Coming back around
    new THREE.Vector3(-4, 0, -70),        // Straightening out
    new THREE.Vector3(0, 0, -76),         // Final straight
    new THREE.Vector3(2, 0, -82),         // End point
  ];

  // CatmullRom with centripetal parameterisation gives the smoothest
  // interpolation without cusps or overshooting.
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  return curve;
}

/**
 * Camera orbit parameters at different scroll positions.
 * Returns offset from car position and look-at height.
 * The camera transitions between front, side, and rear views
 * as the car traverses the path.
 */
export interface CameraParams {
  offset: THREE.Vector3;   // Camera offset from car position
  lookAtHeight: number;    // Y offset for the look-at target
}

export function getCameraParams(progress: number): CameraParams {
  // Normalised progress 0–1 mapped to different viewing angles
  // This creates the cinematic orbit effect
  const angle = progress * Math.PI * 2.5; // ~2.5 full rotations over the scroll
  const distance = 8 + Math.sin(progress * Math.PI) * 3; // 8–11 distance range
  const height = 3 + Math.sin(progress * Math.PI * 0.7) * 2; // 3–5 height range

  const offset = new THREE.Vector3(
    Math.sin(angle) * distance,
    height,
    Math.cos(angle) * distance
  );

  const lookAtHeight = 1 + Math.sin(progress * Math.PI) * 0.5;

  return { offset, lookAtHeight };
}
