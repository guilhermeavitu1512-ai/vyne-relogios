"use client";

import {
  ContactShadows,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
  useProgress,
} from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import * as THREE from "three";
import "./ModelViewer.css";

type EnvironmentPreset =
  | "apartment"
  | "city"
  | "dawn"
  | "forest"
  | "lobby"
  | "night"
  | "park"
  | "studio"
  | "sunset"
  | "warehouse";

type ModelViewerProps = {
  url: string;
  width?: number | string;
  height?: number | string;
  modelXOffset?: number;
  modelYOffset?: number;
  defaultRotationX?: number;
  defaultRotationY?: number;
  enableMouseParallax?: boolean;
  enableHoverRotation?: boolean;
  enableManualRotation?: boolean;
  enableManualZoom?: boolean;
  environmentPreset?: EnvironmentPreset;
  fadeIn?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  showScreenshotButton?: boolean;
  materialFinish?: "original" | "silver";
  className?: string;
};

type PreparedModelProps = Pick<
  ModelViewerProps,
  | "url"
  | "modelXOffset"
  | "modelYOffset"
  | "defaultRotationX"
  | "defaultRotationY"
  | "enableMouseParallax"
  | "enableHoverRotation"
  | "autoRotate"
  | "autoRotateSpeed"
  | "materialFinish"
> & {
  onReady: () => void;
};

function LoadingIndicator() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="model-viewer-loader" role="status" aria-live="polite">
        <span />
        <small>Preparando o relógio</small>
        <strong>{Math.round(progress)}%</strong>
      </div>
    </Html>
  );
}

function PreparedModel({
  url,
  modelXOffset = 0,
  modelYOffset = 0,
  defaultRotationX = -8,
  defaultRotationY = -12,
  enableMouseParallax = true,
  enableHoverRotation = true,
  autoRotate = false,
  autoRotateSpeed = 0.35,
  materialFinish = "original",
  onReady,
}: PreparedModelProps) {
  const rootRef = useRef<THREE.Group>(null);
  const hoveredRef = useRef(false);
  const { scene } = useGLTF(url);

  const prepared = useMemo(() => {
    const clonedScene = scene.clone(true);

    clonedScene.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;

      node.castShadow = true;
      node.receiveShadow = true;

      const materials = Array.isArray(node.material)
        ? node.material
        : [node.material];

      const clonedMaterials = materials.map((material) => {
        const clonedMaterial = material.clone();
        if (clonedMaterial instanceof THREE.MeshStandardMaterial) {
          const materialName = clonedMaterial.name.toLowerCase();
          const isPlastic = materialName.includes("plastic");
          const shouldUseSilver =
            materialFinish === "silver" &&
            !isPlastic &&
            [
              "gold",
              "metal",
              "carbon fiber",
              "backplate",
              "clasp",
              "bezel",
            ].some((token) => materialName.includes(token));

          if (shouldUseSilver) {
            clonedMaterial.color.set("#d9ddde");
            clonedMaterial.metalness = 0.96;
            clonedMaterial.roughness = 0.24;
            clonedMaterial.envMapIntensity = 1.7;
          } else {
            clonedMaterial.envMapIntensity = 1.35;
          }
        }
        return clonedMaterial;
      });

      node.material = Array.isArray(node.material)
        ? clonedMaterials
        : clonedMaterials[0];
    });

    const bounds = new THREE.Box3().setFromObject(clonedScene);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const longestSide = Math.max(size.x, size.y, size.z) || 1;

    return {
      scene: clonedScene,
      center,
      scale: 2.55 / longestSide,
    };
  }, [materialFinish, scene]);

  useEffect(() => {
    onReady();

    return () => {
      prepared.scene.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        const materials = Array.isArray(node.material)
          ? node.material
          : [node.material];
        materials.forEach((material) => material.dispose());
      });
    };
  }, [onReady, prepared.scene]);

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const damping = 1 - Math.exp(-5.5 * delta);
    const pointerInfluence = hoveredRef.current ? 1 : 0;
    const parallaxX = enableMouseParallax
      ? state.pointer.x * 0.09 * pointerInfluence
      : 0;
    const parallaxY = enableMouseParallax
      ? state.pointer.y * 0.065 * pointerInfluence
      : 0;
    const hoverX = enableHoverRotation
      ? -state.pointer.y * 0.12 * pointerInfluence
      : 0;
    const hoverY = enableHoverRotation
      ? state.pointer.x * 0.2 * pointerInfluence
      : 0;

    root.position.x = THREE.MathUtils.lerp(
      root.position.x,
      modelXOffset + parallaxX,
      damping,
    );
    root.position.y = THREE.MathUtils.lerp(
      root.position.y,
      modelYOffset + parallaxY,
      damping,
    );
    root.rotation.x = THREE.MathUtils.lerp(
      root.rotation.x,
      THREE.MathUtils.degToRad(defaultRotationX) + hoverX,
      damping,
    );

    const baseRotationY =
      THREE.MathUtils.degToRad(defaultRotationY) + hoverY;
    root.rotation.y = autoRotate
      ? root.rotation.y + delta * autoRotateSpeed
      : THREE.MathUtils.lerp(root.rotation.y, baseRotationY, damping);
  });

  const setHovered = useCallback(
    (event: ThreeEvent<PointerEvent>, hovered: boolean) => {
      event.stopPropagation();
      hoveredRef.current = hovered;
    },
    [],
  );

  return (
    <group
      ref={rootRef}
      position={[modelXOffset, modelYOffset, 0]}
      rotation={[
        THREE.MathUtils.degToRad(defaultRotationX),
        THREE.MathUtils.degToRad(defaultRotationY),
        0,
      ]}
      onPointerEnter={(event) => setHovered(event, true)}
      onPointerLeave={(event) => setHovered(event, false)}
    >
      <group scale={prepared.scale}>
        <primitive
          object={prepared.scene}
          position={[
            -prepared.center.x,
            -prepared.center.y,
            -prepared.center.z,
          ]}
        />
      </group>
    </group>
  );
}

export default function ModelViewer({
  url,
  width = 400,
  height = 400,
  modelXOffset = 0,
  modelYOffset = 0,
  defaultRotationX = -8,
  defaultRotationY = -12,
  enableMouseParallax = true,
  enableHoverRotation = true,
  enableManualRotation = true,
  enableManualZoom = true,
  environmentPreset = "forest",
  fadeIn = true,
  autoRotate = false,
  autoRotateSpeed = 0.35,
  showScreenshotButton = false,
  materialFinish = "original",
  className = "",
}: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "120px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const handleReady = useCallback(() => setReady(true), []);

  const takeScreenshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "vyne-relogio-3d.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  const rootStyle: CSSProperties = { width, height };

  return (
    <div
      ref={containerRef}
      className={`model-viewer ${ready || !fadeIn ? "is-ready" : ""} ${className}`}
      style={rootStyle}
      role="group"
      aria-label="Visualizador interativo de relógio em três dimensões"
    >
      <Canvas
        aria-label="Relógio 3D interativo"
        camera={{ position: [0.15, 0.12, 4.5], fov: 34, near: 0.1, far: 100 }}
        dpr={[1, 1.65]}
        frameloop={isVisible ? "always" : "never"}
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: showScreenshotButton,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          canvasRef.current = gl.domElement;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
        }}
        shadows
      >
        <ambientLight intensity={0.72} />
        <directionalLight
          castShadow
          intensity={3.25}
          position={[4.5, 6, 5]}
          color="#f3fff7"
        />
        <directionalLight
          intensity={1.45}
          position={[-4, 1.5, 2]}
          color="#4fb981"
        />
        <spotLight
          intensity={2.1}
          angle={0.42}
          penumbra={0.85}
          position={[0, -3, 4]}
          color="#8fd0ad"
        />

        <Suspense fallback={<LoadingIndicator />}>
          <PreparedModel
            url={url}
            modelXOffset={modelXOffset}
            modelYOffset={modelYOffset}
            defaultRotationX={defaultRotationX}
            defaultRotationY={defaultRotationY}
            enableMouseParallax={enableMouseParallax}
            enableHoverRotation={enableHoverRotation}
            autoRotate={autoRotate}
            autoRotateSpeed={autoRotateSpeed}
            materialFinish={materialFinish}
            onReady={handleReady}
          />
          <Environment preset={environmentPreset} />
          <ContactShadows
            opacity={0.4}
            scale={5}
            blur={2.8}
            far={2.6}
            position={[modelXOffset, modelYOffset - 1.28, 0]}
            frames={1}
          />
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={false}
          enableRotate={enableManualRotation}
          enableZoom={enableManualZoom}
          minDistance={3.1}
          maxDistance={6.2}
          minPolarAngle={Math.PI * 0.25}
          maxPolarAngle={Math.PI * 0.75}
          target={[modelXOffset, modelYOffset, 0]}
          dampingFactor={0.07}
          enableDamping
        />
      </Canvas>

      {showScreenshotButton && (
        <button
          className="model-viewer-screenshot"
          type="button"
          onClick={takeScreenshot}
          aria-label="Salvar uma imagem do relógio 3D"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8.4 5.2 9.6 3.5h4.8l1.2 1.7H19a2 2 0 0 1 2 2v10.3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7.2a2 2 0 0 1 2-2h3.4Zm3.6 3a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Zm0 1.7a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5Z" />
          </svg>
          Salvar imagem
        </button>
      )}
    </div>
  );
}
