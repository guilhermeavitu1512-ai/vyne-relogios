"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

import "./MagicRings.css";

const vertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime, uAttenuation, uLineThickness;
uniform float uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap;
uniform float uFadeIn, uFadeOut;
uniform float uMouseInfluence, uHoverAmount, uHoverScale, uParallax, uBurst;
uniform vec2 uResolution, uMouse;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;

const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  p -= uMouse * uMouseInfluence;
  float sc = mix(1.0, uHoverScale, uHoverAmount) + uBurst * 0.3;
  p /= sc;
  vec3 c = vec3(0.0);
  float rcf = max(float(uRingCount) - 1.0, 1.0);

  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec2 pr = p - fi * uParallax * uMouse;
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    c = mix(c, rc, vec3(ring(pr, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px)));
  }

  c *= 1.0 + uBurst * 2.0;
  float n = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (n - 0.5) * uNoiseAmount;
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)) * uOpacity);
}
`;

export interface MagicRingsProps {
  color?: string;
  colorTwo?: string;
  speed?: number;
  ringCount?: number;
  attenuation?: number;
  lineThickness?: number;
  baseRadius?: number;
  radiusStep?: number;
  scaleRate?: number;
  opacity?: number;
  blur?: number;
  noiseAmount?: number;
  rotation?: number;
  ringGap?: number;
  fadeIn?: number;
  fadeOut?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  hoverScale?: number;
  parallax?: number;
  clickBurst?: boolean;
}

export default function MagicRings({
  color = "#fc42ff",
  colorTwo = "#42fcff",
  speed = 1,
  ringCount = 6,
  attenuation = 10,
  lineThickness = 2,
  baseRadius = 0.35,
  radiusStep = 0.1,
  scaleRate = 0.1,
  opacity = 1,
  blur = 0,
  noiseAmount = 0.1,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7,
  fadeOut = 0.5,
  followMouse = false,
  mouseInfluence = 0.2,
  hoverScale = 1.2,
  parallax = 0.05,
  clickBurst = false,
}: MagicRingsProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const currentProps: Required<MagicRingsProps> = {
    color,
    colorTwo,
    speed,
    ringCount,
    attenuation,
    lineThickness,
    baseRadius,
    radiusStep,
    scaleRate,
    opacity,
    blur,
    noiseAmount,
    rotation,
    ringGap,
    fadeIn,
    fadeOut,
    followMouse,
    mouseInfluence,
    hoverScale,
    parallax,
    clickBurst,
  };
  const propsRef = useRef<Required<MagicRingsProps>>(currentProps);
  const mouseRef = useRef([0, 0]);
  const smoothMouseRef = useRef([0, 0]);
  const hoverAmountRef = useRef(0);
  const isHoveredRef = useRef(false);
  const burstRef = useRef(0);

  useEffect(() => {
    propsRef.current = currentProps;
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    if (!renderer.capabilities.isWebGL2) {
      renderer.dispose();
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -0.5,
      0.5,
      0.5,
      -0.5,
      0.1,
      10,
    );
    camera.position.z = 1;

    const uniforms = {
      uTime: { value: 0 },
      uAttenuation: { value: 0 },
      uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color() },
      uColorTwo: { value: new THREE.Color() },
      uLineThickness: { value: 0 },
      uBaseRadius: { value: 0 },
      uRadiusStep: { value: 0 },
      uScaleRate: { value: 0 },
      uRingCount: { value: 0 },
      uOpacity: { value: 1 },
      uNoiseAmount: { value: 0 },
      uRotation: { value: 0 },
      uRingGap: { value: 1.6 },
      uFadeIn: { value: 0.5 },
      uFadeOut: { value: 0.75 },
      uMouse: { value: new THREE.Vector2() },
      uMouseInfluence: { value: 0 },
      uHoverAmount: { value: 0 },
      uHoverScale: { value: 1 },
      uParallax: { value: 0 },
      uBurst: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const geometry = new THREE.PlaneGeometry(1, 1);
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;

      const pixelRatio = Math.min(window.devicePixelRatio, 1.75);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(
        width * pixelRatio,
        height * pixelRatio,
      );
    };

    resize();
    window.addEventListener("resize", resize);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const onMouseMove = (event: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseRef.current[0] = (event.clientX - rect.left) / rect.width - 0.5;
      mouseRef.current[1] =
        -((event.clientY - rect.top) / rect.height - 0.5);
    };
    const onMouseEnter = () => {
      isHoveredRef.current = true;
    };
    const onMouseLeave = () => {
      isHoveredRef.current = false;
      mouseRef.current[0] = 0;
      mouseRef.current[1] = 0;
    };
    const onClick = () => {
      burstRef.current = 1;
    };

    mount.addEventListener("mousemove", onMouseMove);
    mount.addEventListener("mouseenter", onMouseEnter);
    mount.addEventListener("mouseleave", onMouseLeave);
    mount.addEventListener("click", onClick);

    let isInView = true;
    let pageVisible = document.visibilityState === "visible";
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting;
      },
      { rootMargin: "120px" },
    );
    intersectionObserver.observe(mount);

    const onVisibilityChange = () => {
      pageVisible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const renderFrame = (time: number) => {
      const latestProps = propsRef.current;

      smoothMouseRef.current[0] +=
        (mouseRef.current[0] - smoothMouseRef.current[0]) * 0.08;
      smoothMouseRef.current[1] +=
        (mouseRef.current[1] - smoothMouseRef.current[1]) * 0.08;
      hoverAmountRef.current +=
        ((isHoveredRef.current ? 1 : 0) - hoverAmountRef.current) * 0.08;
      burstRef.current *= 0.95;
      if (burstRef.current < 0.001) burstRef.current = 0;

      uniforms.uTime.value =
        (reducedMotion ? 0 : time * 0.001) * latestProps.speed;
      uniforms.uAttenuation.value = latestProps.attenuation;
      uniforms.uColor.value.set(latestProps.color);
      uniforms.uColorTwo.value.set(latestProps.colorTwo);
      uniforms.uLineThickness.value = latestProps.lineThickness;
      uniforms.uBaseRadius.value = latestProps.baseRadius;
      uniforms.uRadiusStep.value = latestProps.radiusStep;
      uniforms.uScaleRate.value = latestProps.scaleRate;
      uniforms.uRingCount.value = Math.min(
        Math.max(latestProps.ringCount, 1),
        10,
      );
      uniforms.uOpacity.value = latestProps.opacity;
      uniforms.uNoiseAmount.value = latestProps.noiseAmount;
      uniforms.uRotation.value =
        (latestProps.rotation * Math.PI) / 180;
      uniforms.uRingGap.value = latestProps.ringGap;
      uniforms.uFadeIn.value = latestProps.fadeIn;
      uniforms.uFadeOut.value = latestProps.fadeOut;
      uniforms.uMouse.value.set(
        smoothMouseRef.current[0],
        smoothMouseRef.current[1],
      );
      uniforms.uMouseInfluence.value = latestProps.followMouse
        ? latestProps.mouseInfluence
        : 0;
      uniforms.uHoverAmount.value = hoverAmountRef.current;
      uniforms.uHoverScale.value = latestProps.hoverScale;
      uniforms.uParallax.value = latestProps.parallax;
      uniforms.uBurst.value = latestProps.clickBurst ? burstRef.current : 0;

      renderer.render(scene, camera);
    };

    let frameId = 0;
    const animate = (time: number) => {
      frameId = requestAnimationFrame(animate);
      if (isInView && pageVisible) renderFrame(time);
    };

    if (reducedMotion) {
      renderFrame(0);
    } else {
      frameId = requestAnimationFrame(animate);
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      mount.removeEventListener("mousemove", onMouseMove);
      mount.removeEventListener("mouseenter", onMouseEnter);
      mount.removeEventListener("mouseleave", onMouseLeave);
      mount.removeEventListener("click", onClick);
      renderer.domElement.remove();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="magic-rings-container"
      style={blur > 0 ? { filter: `blur(${blur}px)` } : undefined}
    />
  );
}
