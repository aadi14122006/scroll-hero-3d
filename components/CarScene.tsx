// components/CarScene.tsx
// The core 3D scene: three.js canvas with the procedural car,
// scroll-driven animation via GSAP ScrollTrigger, and camera orbiting.
// This component is loaded client-only (dynamic import with ssr: false).

'use client';

import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createCar, type CarInstance } from './CarModel';
import { createRouteCurve, getCameraParams } from '@/lib/path';
import { ACCENT, ANIM } from '@/lib/constants';

gsap.registerPlugin(ScrollTrigger);

/**
 * CarScene — renders a <canvas> with the 3D car scene.
 *
 * Scroll integration:
 *   A scrollProgress ref (0–1) is updated by ScrollTrigger's onUpdate.
 *   The gsap.ticker render loop lerps smoothly toward this target so
 *   motion feels fluid even when scroll events are quantised.
 *
 * The component accepts onProgressChange so the parent (Hero) can
 * use scroll progress to light up headline letters and shift stats.
 */
interface CarSceneProps {
  onProgressChange?: (progress: number) => void;
}

export default function CarScene({ onProgressChange }: CarSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Store refs that persist across the effect
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    car: CarInstance;
    curve: THREE.CatmullRomCurve3;
    ground: THREE.Mesh;
    grid: THREE.GridHelper;
    scrollProgress: { value: number };
    currentProgress: number;
    prevCarPos: THREE.Vector3;
    currentCarQuat: THREE.Quaternion;
  } | null>(null);

  // ── Initialise three.js scene ──────────────────────────────────
  const initScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap at 2
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a0a0a, 30, 90);
    scene.background = null; // Transparent — CSS bg shows through

    // Camera — wider FOV on portrait mobile for better framing
    const aspect = window.innerWidth / window.innerHeight;
    const fov = aspect < 1 ? 75 : 55; // Portrait vs landscape
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
    camera.position.set(5, 4, 10);
    camera.lookAt(0, 0, 0);

    // ── Lights ────────────────────────────────────────────────────
    // Hemisphere light for ambient fill
    const hemiLight = new THREE.HemisphereLight(0x444466, 0x111111, 1.2);
    scene.add(hemiLight);

    // Directional light (sun-like, casts shadows)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 60;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    scene.add(dirLight);

    // Lime accent rim light — attached to car later
    const rimLight = new THREE.PointLight(ACCENT, 2, 15);
    rimLight.position.set(0, 2, -3);
    scene.add(rimLight);

    // ── Ground plane ──────────────────────────────────────────────
    const groundGeo = new THREE.PlaneGeometry(200, 200);
    const groundMat = new THREE.MeshPhongMaterial({
      color: 0x111111,
      specular: 0x222222,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid helper for "endless road" look
    const grid = new THREE.GridHelper(200, 80, 0x222222, 0x1a1a1a);
    grid.position.y = 0;
    scene.add(grid);

    // ── Car ───────────────────────────────────────────────────────
    const car = createCar();
    scene.add(car.group);

    // Attach rim light to car so it follows
    car.group.add(rimLight);

    // ── Route curve ───────────────────────────────────────────────
    const curve = createRouteCurve();

    // Store everything
    sceneRef.current = {
      renderer,
      scene,
      camera,
      car,
      curve,
      ground,
      grid,
      scrollProgress: { value: 0 },
      currentProgress: 0,
      prevCarPos: new THREE.Vector3(0, 0, 0),
      currentCarQuat: new THREE.Quaternion(),
    };

    return { renderer, scene, camera, car, curve, dirLight };
  }, []);

  useEffect(() => {
    // ── Check reduced motion ──────────────────────────────────────
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const setup = initScene();
    if (!setup || !sceneRef.current) return;

    const { renderer, camera } = setup;
    const s = sceneRef.current;

    // ── Static pose for reduced motion ────────────────────────────
    if (prefersReducedMotion) {
      // Show car at 30% of the path, no scroll animation
      const staticPos = s.curve.getPointAt(0.3);
      s.car.group.position.copy(staticPos);
      const camParams = getCameraParams(0.3);
      camera.position.copy(staticPos).add(camParams.offset);
      camera.lookAt(staticPos.x, staticPos.y + camParams.lookAtHeight, staticPos.z);
      renderer.render(s.scene, camera);
      return;
    }

    // ── Camera dolly-in animation (intro, ~2s) ────────────────────
    gsap.fromTo(
      camera.position,
      { x: 20, y: 12, z: 25 },
      {
        x: 5,
        y: 4,
        z: 10,
        duration: ANIM.cameraDolly,
        ease: 'power3.out',
      }
    );

    // ── ScrollTrigger — drives scrollProgress.value from 0 to 1 ──
    const trigger = ScrollTrigger.create({
      trigger: '#hero-section',
      start: 'top top',
      end: ANIM.scrollLength,
      pin: true,
      scrub: ANIM.scrub,
      onUpdate: (self) => {
        s.scrollProgress.value = self.progress;
      },
    });

    // ── Render loop (gsap.ticker) ────────────────────────────────
    // We lerp currentProgress toward scrollProgress.value each frame
    // to add inertia/smoothing on top of ScrollTrigger's scrub.
    const tmpPos = new THREE.Vector3();
    const tmpTangent = new THREE.Vector3();
    const tmpQuat = new THREE.Quaternion();
    const upVec = new THREE.Vector3(0, 1, 0);

    const onTick = () => {
      if (!sceneRef.current) return;
      const sc = sceneRef.current;

      // Lerp progress for fluid motion
      sc.currentProgress +=
        (sc.scrollProgress.value - sc.currentProgress) * ANIM.lerpFactor;

      // Clamp to valid range for getPointAt
      const t = Math.max(0, Math.min(1, sc.currentProgress));

      // ── Car position on curve ──────────────────────────────────
      sc.curve.getPointAt(t, tmpPos);
      sc.car.group.position.copy(tmpPos);

      // ── Car heading (follow tangent) ───────────────────────────
      // getPointAt uses a small epsilon for tangent; we smooth it
      const tNext = Math.min(1, t + 0.001);
      sc.curve.getPointAt(tNext, tmpTangent);
      tmpTangent.sub(tmpPos).normalize();

      // Build a quaternion looking along the tangent
      const lookMatrix = new THREE.Matrix4();
      lookMatrix.lookAt(tmpPos, tmpPos.clone().add(tmpTangent), upVec);
      tmpQuat.setFromRotationMatrix(lookMatrix);

      // Slerp toward target for smoothed rotation (no snapping)
      sc.currentCarQuat.slerp(tmpQuat, 0.15);
      sc.car.group.quaternion.copy(sc.currentCarQuat);

      // ── Banking (lean) in turns ────────────────────────────────
      // Cross-product of tangent with up gives lateral; use the
      // change in tangent direction to approximate curvature.
      // Simple approach: measure yaw change over a small interval
      const tPrev = Math.max(0, t - 0.002);
      const prevTangent = new THREE.Vector3();
      sc.curve.getPointAt(tPrev, prevTangent);
      const nextPt = new THREE.Vector3();
      sc.curve.getPointAt(tNext, nextPt);
      prevTangent.sub(sc.curve.getPointAt(Math.max(0, tPrev - 0.001))).normalize();
      // Compute signed curvature (yaw component)
      const cross = new THREE.Vector3().crossVectors(
        tmpTangent,
        prevTangent
      );
      const bankAngle = THREE.MathUtils.clamp(cross.y * 30, -0.3, 0.3);
      sc.car.group.rotation.z = THREE.MathUtils.lerp(
        sc.car.group.rotation.z,
        -bankAngle,
        0.1
      );

      // ── Pitch on ramp ──────────────────────────────────────────
      // The quaternion from lookAt already includes pitch from the
      // curve's Y component, so no extra work needed.

      // ── Wheel roll ─────────────────────────────────────────────
      const dist = tmpPos.distanceTo(sc.prevCarPos);
      sc.car.rollWheels(dist);
      sc.prevCarPos.copy(tmpPos);

      // ── Ground & grid follow car (endless road illusion) ───────
      sc.ground.position.x = tmpPos.x;
      sc.ground.position.z = tmpPos.z;
      sc.grid.position.x = tmpPos.x;
      sc.grid.position.z = tmpPos.z;

      // ── Camera orbit ───────────────────────────────────────────
      const camParams = getCameraParams(t);
      const targetCamPos = tmpPos.clone().add(camParams.offset);
      camera.position.lerp(targetCamPos, 0.05);
      const lookTarget = new THREE.Vector3(
        tmpPos.x,
        tmpPos.y + camParams.lookAtHeight,
        tmpPos.z
      );
      camera.lookAt(lookTarget);

      // ── Move directional light shadow with car ─────────────────
      // (keeps shadows rendered near the car)

      // ── Report progress to parent ──────────────────────────────
      if (onProgressChange) {
        onProgressChange(t);
      }

      // ── Render ─────────────────────────────────────────────────
      renderer.render(sc.scene, camera);
    };

    gsap.ticker.add(onTick);

    // ── Resize handler ───────────────────────────────────────────
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const aspect = w / h;
      camera.fov = aspect < 1 ? 75 : 55;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Cleanup ──────────────────────────────────────────────────
    return () => {
      gsap.ticker.remove(onTick);
      window.removeEventListener('resize', onResize);
      trigger.kill();
      if (sceneRef.current) {
        sceneRef.current.car.dispose();
        sceneRef.current.renderer.dispose();
        sceneRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initScene]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: 'pan-y' }}
      />
    </div>
  );
}
