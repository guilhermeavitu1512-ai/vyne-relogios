"use client";

import {
  Clock,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";

import "./FloatingLines.css";

const vertexShader = `
precision highp float;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float iTime;
uniform vec3 iResolution;
uniform float animationSpeed;

uniform bool enableTop;
uniform bool enableMiddle;
uniform bool enableBottom;

uniform int topLineCount;
uniform int middleLineCount;
uniform int bottomLineCount;

uniform float topLineDistance;
uniform float middleLineDistance;
uniform float bottomLineDistance;

uniform vec3 topWavePosition;
uniform vec3 middleWavePosition;
uniform vec3 bottomWavePosition;

uniform vec2 iMouse;
uniform bool interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float bendInfluence;

uniform bool parallax;
uniform vec2 parallaxOffset;

uniform vec3 lineGradient[8];
uniform int lineGradientCount;

const vec3 BLACK = vec3(0.0);
const vec3 PINK = vec3(233.0, 71.0, 245.0) / 255.0;
const vec3 BLUE = vec3(47.0, 75.0, 162.0) / 255.0;

mat2 rotate(float radians) {
  return mat2(
    cos(radians),
    sin(radians),
    -sin(radians),
    cos(radians)
  );
}

vec3 backgroundColor(vec2 uv) {
  vec3 color = vec3(0.0);
  float y = sin(uv.x - 0.2) * 0.3 - 0.1;
  float movement = uv.y - y;

  color += mix(BLUE, BLACK, smoothstep(0.0, 1.0, abs(movement)));
  color += mix(PINK, BLACK, smoothstep(0.0, 1.0, abs(movement - 0.8)));
  return color * 0.5;
}

vec3 getLineColor(float progress, vec3 baseColor) {
  if (lineGradientCount <= 0) {
    return baseColor;
  }

  vec3 gradientColor;
  if (lineGradientCount == 1) {
    gradientColor = lineGradient[0];
  } else {
    float clampedProgress = clamp(progress, 0.0, 0.9999);
    float scaled = clampedProgress * float(lineGradientCount - 1);
    int index = int(floor(scaled));
    float interpolation = fract(scaled);
    int nextIndex = min(index + 1, lineGradientCount - 1);

    gradientColor = mix(
      lineGradient[index],
      lineGradient[nextIndex],
      interpolation
    );
  }

  return gradientColor * 0.5;
}

float wave(
  vec2 uv,
  float offset,
  vec2 screenUv,
  vec2 mouseUv,
  bool shouldBend
) {
  float time = iTime * animationSpeed;
  float movement = time * 0.1;
  float amplitude = sin(offset + time * 0.2) * 0.3;
  float y = sin(uv.x + offset + movement) * amplitude;

  if (shouldBend) {
    vec2 delta = screenUv - mouseUv;
    float influence = exp(-dot(delta, delta) * bendRadius);
    float bendOffset =
      (mouseUv.y - screenUv.y) * influence * bendStrength * bendInfluence;
    y += bendOffset;
  }

  float distanceToWave = uv.y - y;
  return 0.0175 / max(abs(distanceToWave) + 0.01, 0.001) + 0.01;
}

void mainImage(out vec4 fragmentColor, in vec2 fragmentCoordinate) {
  vec2 baseUv =
    (2.0 * fragmentCoordinate - iResolution.xy) / iResolution.y;
  baseUv.y *= -1.0;

  if (parallax) {
    baseUv += parallaxOffset;
  }

  vec3 color = vec3(0.0);
  vec3 baseColor =
    lineGradientCount > 0 ? vec3(0.0) : backgroundColor(baseUv);

  vec2 mouseUv = vec2(0.0);
  if (interactive) {
    mouseUv = (2.0 * iMouse - iResolution.xy) / iResolution.y;
    mouseUv.y *= -1.0;
  }

  if (enableBottom) {
    for (int index = 0; index < bottomLineCount; ++index) {
      float lineIndex = float(index);
      float progress =
        lineIndex / max(float(bottomLineCount - 1), 1.0);
      vec3 lineColor = getLineColor(progress, baseColor);
      float angle =
        bottomWavePosition.z * log(length(baseUv) + 1.0);
      vec2 rotatedUv = baseUv * rotate(angle);

      color += lineColor * wave(
        rotatedUv + vec2(
          bottomLineDistance * lineIndex + bottomWavePosition.x,
          bottomWavePosition.y
        ),
        1.5 + 0.2 * lineIndex,
        baseUv,
        mouseUv,
        interactive
      ) * 0.2;
    }
  }

  if (enableMiddle) {
    for (int index = 0; index < middleLineCount; ++index) {
      float lineIndex = float(index);
      float progress =
        lineIndex / max(float(middleLineCount - 1), 1.0);
      vec3 lineColor = getLineColor(progress, baseColor);
      float angle =
        middleWavePosition.z * log(length(baseUv) + 1.0);
      vec2 rotatedUv = baseUv * rotate(angle);

      color += lineColor * wave(
        rotatedUv + vec2(
          middleLineDistance * lineIndex + middleWavePosition.x,
          middleWavePosition.y
        ),
        2.0 + 0.15 * lineIndex,
        baseUv,
        mouseUv,
        interactive
      );
    }
  }

  if (enableTop) {
    for (int index = 0; index < topLineCount; ++index) {
      float lineIndex = float(index);
      float progress = lineIndex / max(float(topLineCount - 1), 1.0);
      vec3 lineColor = getLineColor(progress, baseColor);
      float angle = topWavePosition.z * log(length(baseUv) + 1.0);
      vec2 rotatedUv = baseUv * rotate(angle);
      rotatedUv.x *= -1.0;

      color += lineColor * wave(
        rotatedUv + vec2(
          topLineDistance * lineIndex + topWavePosition.x,
          topWavePosition.y
        ),
        1.0 + 0.2 * lineIndex,
        baseUv,
        mouseUv,
        interactive
      ) * 0.1;
    }
  }

  fragmentColor = vec4(color, 1.0);
}

void main() {
  vec4 color = vec4(0.0);
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}
`;

const MAX_GRADIENT_STOPS = 8;

type Wave = "top" | "middle" | "bottom";

type WavePosition = {
  x: number;
  y: number;
  rotate: number;
};

export type FloatingLinesProps = {
  linesGradient?: string[];
  enabledWaves?: Wave[];
  lineCount?: number | number[];
  lineDistance?: number | number[];
  topWavePosition?: WavePosition;
  middleWavePosition?: WavePosition;
  bottomWavePosition?: WavePosition;
  animationSpeed?: number;
  interactive?: boolean;
  bendRadius?: number;
  bendStrength?: number;
  mouseDamping?: number;
  parallax?: boolean;
  parallaxStrength?: number;
  mixBlendMode?: CSSProperties["mixBlendMode"];
};

function hexToVector(hex: string): Vector3 {
  let value = hex.trim().replace(/^#/, "");
  if (value.length === 3) {
    value = value
      .split("")
      .map((digit) => digit + digit)
      .join("");
  }

  const valid = /^[0-9a-fA-F]{6}$/.test(value) ? value : "ffffff";
  return new Vector3(
    parseInt(valid.slice(0, 2), 16) / 255,
    parseInt(valid.slice(2, 4), 16) / 255,
    parseInt(valid.slice(4, 6), 16) / 255,
  );
}

function FloatingLines({
  linesGradient,
  enabledWaves = ["top", "middle", "bottom"],
  lineCount = [6],
  lineDistance = [5],
  topWavePosition,
  middleWavePosition,
  bottomWavePosition = { x: 2, y: -0.7, rotate: -1 },
  animationSpeed = 1,
  interactive = true,
  bendRadius = 5,
  bendStrength = -0.5,
  mouseDamping = 0.05,
  parallax = true,
  parallaxStrength = 0.2,
  mixBlendMode = "screen",
}: FloatingLinesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const targetMouseRef = useRef(new Vector2(-1000, -1000));
  const currentMouseRef = useRef(new Vector2(-1000, -1000));
  const targetInfluenceRef = useRef(0);
  const currentInfluenceRef = useRef(0);
  const targetParallaxRef = useRef(new Vector2());
  const currentParallaxRef = useRef(new Vector2());

  const waveConfiguration = useMemo(() => {
    const getCount = (wave: Wave) => {
      if (typeof lineCount === "number") return lineCount;
      if (!enabledWaves.includes(wave)) return 0;
      return lineCount[enabledWaves.indexOf(wave)] ?? 6;
    };

    const getDistance = (wave: Wave) => {
      if (typeof lineDistance === "number") return lineDistance;
      if (!enabledWaves.includes(wave)) return 0.1;
      return lineDistance[enabledWaves.indexOf(wave)] ?? 0.1;
    };

    return {
      topCount: enabledWaves.includes("top") ? getCount("top") : 0,
      middleCount: enabledWaves.includes("middle")
        ? getCount("middle")
        : 0,
      bottomCount: enabledWaves.includes("bottom")
        ? getCount("bottom")
        : 0,
      topDistance: enabledWaves.includes("top")
        ? getDistance("top") * 0.01
        : 0.01,
      middleDistance: enabledWaves.includes("middle")
        ? getDistance("middle") * 0.01
        : 0.01,
      bottomDistance: enabledWaves.includes("bottom")
        ? getDistance("bottom") * 0.01
        : 0.01,
    };
  }, [enabledWaves, lineCount, lineDistance]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;
    let visible = true;
    const scene = new Scene();
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    camera.position.z = 1;

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    const uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new Vector3(1, 1, 1) },
      animationSpeed: { value: animationSpeed },
      enableTop: { value: enabledWaves.includes("top") },
      enableMiddle: { value: enabledWaves.includes("middle") },
      enableBottom: { value: enabledWaves.includes("bottom") },
      topLineCount: { value: waveConfiguration.topCount },
      middleLineCount: { value: waveConfiguration.middleCount },
      bottomLineCount: { value: waveConfiguration.bottomCount },
      topLineDistance: { value: waveConfiguration.topDistance },
      middleLineDistance: { value: waveConfiguration.middleDistance },
      bottomLineDistance: { value: waveConfiguration.bottomDistance },
      topWavePosition: {
        value: new Vector3(
          topWavePosition?.x ?? 10,
          topWavePosition?.y ?? 0.5,
          topWavePosition?.rotate ?? -0.4,
        ),
      },
      middleWavePosition: {
        value: new Vector3(
          middleWavePosition?.x ?? 5,
          middleWavePosition?.y ?? 0,
          middleWavePosition?.rotate ?? 0.2,
        ),
      },
      bottomWavePosition: {
        value: new Vector3(
          bottomWavePosition.x,
          bottomWavePosition.y,
          bottomWavePosition.rotate,
        ),
      },
      iMouse: { value: new Vector2(-1000, -1000) },
      interactive: { value: interactive },
      bendRadius: { value: bendRadius },
      bendStrength: { value: bendStrength },
      bendInfluence: { value: 0 },
      parallax: { value: parallax },
      parallaxOffset: { value: new Vector2() },
      lineGradient: {
        value: Array.from(
          { length: MAX_GRADIENT_STOPS },
          () => new Vector3(1, 1, 1),
        ),
      },
      lineGradientCount: { value: 0 },
    };

    if (linesGradient?.length) {
      const stops = linesGradient.slice(0, MAX_GRADIENT_STOPS);
      uniforms.lineGradientCount.value = stops.length;
      stops.forEach((hex, index) => {
        uniforms.lineGradient.value[index].copy(hexToVector(hex));
      });
    }

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });
    const geometry = new PlaneGeometry(2, 2);
    scene.add(new Mesh(geometry, material));

    const clock = new Clock();
    const setSize = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      renderer.setSize(width, height, false);
      uniforms.iResolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
        1,
      );
    };

    setSize();
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(setSize);
    resizeObserver?.observe(container);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.01 },
    );
    intersectionObserver.observe(container);

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();

      const isInside =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;

      if (!isInside) {
        targetInfluenceRef.current = 0;
        return;
      }

      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const pixelRatio = renderer.getPixelRatio();

      targetMouseRef.current.set(
        x * pixelRatio,
        (bounds.height - y) * pixelRatio,
      );
      targetInfluenceRef.current = 1;

      if (parallax) {
        targetParallaxRef.current.set(
          ((x - bounds.width / 2) / bounds.width) * parallaxStrength,
          (-(y - bounds.height / 2) / bounds.height) * parallaxStrength,
        );
      }
    };

    const handlePointerLeave = () => {
      targetInfluenceRef.current = 0;
    };

    if (interactive) {
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      window.addEventListener("pointercancel", handlePointerLeave);
      window.addEventListener("blur", handlePointerLeave);
    }

    let animationFrame = 0;
    const render = () => {
      if (!active) return;

      if (visible && document.visibilityState === "visible") {
        uniforms.iTime.value = clock.getElapsedTime();

        if (interactive) {
          currentMouseRef.current.lerp(
            targetMouseRef.current,
            mouseDamping,
          );
          uniforms.iMouse.value.copy(currentMouseRef.current);
          currentInfluenceRef.current +=
            (targetInfluenceRef.current - currentInfluenceRef.current) *
            mouseDamping;
          uniforms.bendInfluence.value = currentInfluenceRef.current;
        }

        if (parallax) {
          currentParallaxRef.current.lerp(
            targetParallaxRef.current,
            mouseDamping,
          );
          uniforms.parallaxOffset.value.copy(
            currentParallaxRef.current,
          );
        }

        renderer.render(scene, camera);
      }

      animationFrame = requestAnimationFrame(render);
    };
    render();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrame);
      intersectionObserver.disconnect();
      resizeObserver?.disconnect();

      if (interactive) {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointercancel", handlePointerLeave);
        window.removeEventListener("blur", handlePointerLeave);
      }

      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [
    animationSpeed,
    bendRadius,
    bendStrength,
    bottomWavePosition,
    enabledWaves,
    interactive,
    linesGradient,
    middleWavePosition,
    mouseDamping,
    parallax,
    parallaxStrength,
    topWavePosition,
    waveConfiguration,
  ]);

  return (
    <div
      ref={containerRef}
      className="floating-lines-container"
      style={{ mixBlendMode }}
      aria-hidden="true"
    />
  );
}

export default memo(FloatingLines);
