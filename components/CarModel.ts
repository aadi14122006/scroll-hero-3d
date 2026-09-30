// components/CarModel.ts
// Procedurally built car from three.js primitives.
// Structured so a .glb model can be swapped in later via GLTFLoader.
//
// To use a real GLTF model instead:
//   1. Place your model at /public/models/car.glb
//   2. Uncomment the GLTFLoader import and loadGLTFCar() function below
//   3. Change createCar() to call loadGLTFCar() instead of buildProceduralCar()

import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
// Colors are applied in CarScene.tsx where lights are configured

/** The car group + its four wheel meshes so we can spin them independently */
export interface CarInstance {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  /** Call this each frame with the distance delta to rotate wheels */
  rollWheels: (distanceDelta: number) => void;
  /** Dispose all geometries and materials */
  dispose: () => void;
}

/**
 * Creates the procedural car and returns a CarInstance.
 * The car faces -Z (three.js convention: forward = -Z).
 */
export function createCar(): CarInstance {
  const group = new THREE.Group();
  group.name = 'Car';

  // ── Body ──────────────────────────────────────────────────────
  // Extruded profile for a sporty low-slung shape
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-1.8, 0);
  bodyShape.lineTo(-1.8, 0.4);
  bodyShape.lineTo(-1.5, 0.5);
  bodyShape.lineTo(-0.8, 0.9);
  bodyShape.lineTo(0.3, 0.9);
  bodyShape.lineTo(1.0, 0.7);
  bodyShape.lineTo(1.8, 0.5);
  bodyShape.lineTo(1.8, 0);
  bodyShape.lineTo(-1.8, 0);

  const bodyExtrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: 1.6,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 3,
  };

  const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, bodyExtrudeSettings);
  bodyGeometry.center();
  const bodyMaterial = new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,
    specular: 0x444444,
    shininess: 80,
  });
  const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
  bodyMesh.position.y = 0.35;
  bodyMesh.castShadow = true;
  group.add(bodyMesh);

  // ── Glass (windshield) ────────────────────────────────────────
  const glassGeometry = new THREE.BoxGeometry(1.4, 0.35, 0.7);
  const glassMaterial = new THREE.MeshPhongMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.4,
    specular: 0xffffff,
    shininess: 100,
  });
  const glass = new THREE.Mesh(glassGeometry, glassMaterial);
  glass.position.set(-0.15, 0.85, 0);
  group.add(glass);

  // ── Headlights ────────────────────────────────────────────────
  const headlightGeo = new THREE.SphereGeometry(0.1, 8, 8);
  const headlightMat = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    emissive: 0xffffcc,
    emissiveIntensity: 1,
  });
  const leftHeadlight = new THREE.Mesh(headlightGeo, headlightMat);
  leftHeadlight.position.set(1.75, 0.5, 0.5);
  group.add(leftHeadlight);

  const rightHeadlight = new THREE.Mesh(headlightGeo, headlightMat.clone());
  rightHeadlight.position.set(1.75, 0.5, -0.5);
  group.add(rightHeadlight);

  // ── Taillights ────────────────────────────────────────────────
  const tailGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const tailMat = new THREE.MeshPhongMaterial({
    color: 0xff2200,
    emissive: 0xff2200,
    emissiveIntensity: 0.8,
  });
  const leftTail = new THREE.Mesh(tailGeo, tailMat);
  leftTail.position.set(-1.75, 0.5, 0.5);
  group.add(leftTail);

  const rightTail = new THREE.Mesh(tailGeo, tailMat.clone());
  rightTail.position.set(-1.75, 0.5, -0.5);
  group.add(rightTail);

  // ── Wheels ────────────────────────────────────────────────────
  const wheels: THREE.Mesh[] = [];
  const wheelPositions = [
    { x: 1.1, y: 0.2, z: 0.9 },   // Front-right
    { x: 1.1, y: 0.2, z: -0.9 },  // Front-left
    { x: -1.1, y: 0.2, z: 0.9 },  // Rear-right
    { x: -1.1, y: 0.2, z: -0.9 }, // Rear-left
  ];

  wheelPositions.forEach((pos) => {
    const wheelGroup = new THREE.Group();

    // Tyre
    const tyreGeo = new THREE.TorusGeometry(0.2, 0.08, 8, 16);
    const tyreMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
    const tyre = new THREE.Mesh(tyreGeo, tyreMat);
    tyre.rotation.y = Math.PI / 2;
    wheelGroup.add(tyre);

    // Rim / hub
    const rimGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.06, 12);
    const rimMat = new THREE.MeshPhongMaterial({
      color: 0x888888,
      specular: 0xffffff,
      shininess: 120,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    wheelGroup.add(rim);

    // Spokes (4 per wheel)
    for (let s = 0; s < 4; s++) {
      const spokeGeo = new THREE.BoxGeometry(0.02, 0.22, 0.02);
      const spokeMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
      const spoke = new THREE.Mesh(spokeGeo, spokeMat);
      spoke.rotation.z = (s * Math.PI) / 4;
      wheelGroup.add(spoke);
    }

    wheelGroup.position.set(pos.x, pos.y, pos.z);
    group.add(wheelGroup);

    // We treat the wheelGroup as a Mesh for the wheels array
    // (cast is fine — we just need to call rotation on it)
    wheels.push(wheelGroup as unknown as THREE.Mesh);
  });

  // ── Wheel rolling function ────────────────────────────────────
  const wheelRadius = 0.2;
  function rollWheels(distanceDelta: number) {
    const rotationDelta = distanceDelta / wheelRadius;
    wheels.forEach((w) => {
      // Wheels rotate around the X axis (they're oriented along Z)
      w.rotation.x += rotationDelta;
    });
  }

  // ── Dispose function ──────────────────────────────────────────
  function dispose() {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  return { group, wheels, rollWheels, dispose };
}

/*
 * ── GLTF Loader (swap-in for production) ──────────────────────
 * Uncomment and call this instead of createCar() to use a real model.
 *
 * Place your model at: /public/models/car.glb
 *
 * export async function loadGLTFCar(): Promise<CarInstance> {
 *   const loader = new GLTFLoader();
 *   const gltf = await loader.loadAsync('/models/car.glb');
 *   const group = gltf.scene;
 *   group.name = 'Car';
 *
 *   // Find wheel meshes by name convention: 'wheel_FL', 'wheel_FR', etc.
 *   const wheels: THREE.Mesh[] = [];
 *   group.traverse((child) => {
 *     if (child instanceof THREE.Mesh && child.name.startsWith('wheel_')) {
 *       wheels.push(child);
 *     }
 *   });
 *
 *   const wheelRadius = 0.3; // Adjust to your model
 *   function rollWheels(distanceDelta: number) {
 *     const rotationDelta = distanceDelta / wheelRadius;
 *     wheels.forEach((w) => { w.rotation.x += rotationDelta; });
 *   }
 *
 *   function dispose() {
 *     group.traverse((child) => {
 *       if (child instanceof THREE.Mesh) {
 *         child.geometry.dispose();
 *         if (Array.isArray(child.material)) {
 *           child.material.forEach((m) => m.dispose());
 *         } else {
 *           child.material.dispose();
 *         }
 *       }
 *     });
 *   }
 *
 *   return { group, wheels, rollWheels, dispose };
 * }
 */
