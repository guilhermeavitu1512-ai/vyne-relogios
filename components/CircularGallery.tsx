"use client";

import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";
import { useEffect, useRef } from "react";

import "./CircularGallery.css";

type GalleryItem = {
  image: string;
  text: string;
};

type CircularGalleryProps = {
  items: GalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  scrollSpeed?: number;
  scrollEase?: number;
};

type GL = Renderer["gl"];

type GalleryMedia = {
  extra: number;
  index: number;
  mesh: Mesh;
  program: Program;
  title: Mesh;
  titleAspect: number;
  width: number;
  widthTotal: number;
};

const vertexShader = `
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpeed;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    p.z = (
      sin(p.x * 4.0 + uTime) * 1.5 +
      cos(p.y * 2.0 + uTime) * 1.5
    ) * (0.08 + min(abs(uSpeed), 0.18) * 0.7);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 uImageSizes;
  uniform vec2 uPlaneSizes;
  uniform sampler2D tMap;
  uniform float uBorderRadius;
  varying vec2 vUv;

  float roundedBoxSDF(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b;
    return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
  }

  void main() {
    vec2 ratio = vec2(
      min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
      min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
    );
    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );
    vec4 color = texture2D(tMap, uv);
    color.rgb *= vec3(0.84, 0.92, 0.87);

    float radius = uBorderRadius;
    float distanceToEdge = roundedBoxSDF(
      vUv - 0.5,
      vec2(0.5 - radius),
      radius
    );
    float alpha = 1.0 - smoothstep(-0.002, 0.002, distanceToEdge);
    gl_FragColor = vec4(color.rgb, color.a * alpha);
  }
`;

const titleVertexShader = `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const titleFragmentShader = `
  precision highp float;
  uniform sampler2D tMap;
  varying vec2 vUv;

  void main() {
    vec4 color = texture2D(tMap, vUv);
    if (color.a < 0.08) discard;
    gl_FragColor = color;
  }
`;

function createTitleTexture(gl: GL, text: string, color: string) {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível criar o título da galeria.");

  const fontSize = 28 * scale;
  context.font = `600 ${fontSize}px Manrope, Arial, sans-serif`;
  const textWidth = Math.ceil(context.measureText(text).width);
  canvas.width = textWidth + 40 * scale;
  canvas.height = 66 * scale;

  context.font = `600 ${fontSize}px Manrope, Arial, sans-serif`;
  context.fillStyle = color;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return {
    texture,
    aspect: canvas.width / canvas.height,
  };
}

export default function CircularGallery({
  items,
  bend = 2.7,
  textColor = "#f1efe8",
  borderRadius = 0.055,
  scrollSpeed = 2,
  scrollEase = 0.065,
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.canvas.setAttribute("aria-hidden", "true");
    container.appendChild(gl.canvas);

    const camera = new Camera(gl);
    camera.fov = 45;
    camera.position.z = 20;
    const scene = new Transform();
    const geometry = new Plane(gl, {
      heightSegments: 36,
      widthSegments: 64,
    });
    const repeatedItems = items.concat(items);

    let screen = {
      width: Math.max(container.clientWidth, 1),
      height: Math.max(container.clientHeight, 1),
    };
    let viewport = { width: 1, height: 1 };

    const setViewport = () => {
      screen = {
        width: Math.max(container.clientWidth, 1),
        height: Math.max(container.clientHeight, 1),
      };
      renderer.setSize(screen.width, screen.height);
      camera.perspective({ aspect: screen.width / screen.height });
      const fov = (camera.fov * Math.PI) / 180;
      const height = 2 * Math.tan(fov / 2) * camera.position.z;
      viewport = { width: height * camera.aspect, height };
    };

    setViewport();

    const medias: GalleryMedia[] = repeatedItems.map((item, index) => {
      const texture = new Texture(gl, { generateMipmaps: true });
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.src = item.image;

      const program = new Program(gl, {
        depthTest: false,
        depthWrite: false,
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          tMap: { value: texture },
          uPlaneSizes: { value: [0, 0] },
          uImageSizes: { value: [1, 1] },
          uSpeed: { value: 0 },
          uTime: { value: Math.random() * 100 },
          uBorderRadius: { value: borderRadius },
        },
        transparent: true,
      });

      image.onload = () => {
        texture.image = image;
        program.uniforms.uImageSizes.value = [
          image.naturalWidth,
          image.naturalHeight,
        ];
      };

      const mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);

      const { texture: titleTexture, aspect: titleAspect } =
        createTitleTexture(gl, item.text, textColor);
      const titleProgram = new Program(gl, {
        depthTest: false,
        depthWrite: false,
        vertex: titleVertexShader,
        fragment: titleFragmentShader,
        uniforms: { tMap: { value: titleTexture } },
        transparent: true,
      });
      const title = new Mesh(gl, {
        geometry: new Plane(gl),
        program: titleProgram,
      });
      title.setParent(mesh);

      return {
        extra: 0,
        index,
        mesh,
        program,
        title,
        titleAspect,
        width: 1,
        widthTotal: 1,
      };
    });

    const layout = () => {
      setViewport();
      const scale = screen.height / 1500;

      medias.forEach((media) => {
        media.mesh.scale.y =
          (viewport.height * (860 * scale)) / screen.height;
        media.mesh.scale.x =
          (viewport.width * (680 * scale)) / screen.width;
        media.program.uniforms.uPlaneSizes.value = [
          media.mesh.scale.x,
          media.mesh.scale.y,
        ];

        const titleHeight = media.mesh.scale.y * 0.135;
        media.title.scale.set(
          titleHeight * media.titleAspect,
          titleHeight,
          1,
        );
        media.title.position.y =
          -media.mesh.scale.y * 0.5 - titleHeight * 0.72;

        media.width = media.mesh.scale.x + 1.85;
        media.widthTotal = media.width * medias.length;
      });
    };

    layout();

    const scroll = {
      current: 0,
      target: 0,
      last: 0,
    };
    let pointerDown = false;
    let startX = 0;
    let startTarget = 0;
    let animationFrame = 0;
    let isRunning = false;

    const snap = () => {
      const width = medias[0]?.width;
      if (!width) return;
      scroll.target = Math.round(scroll.target / width) * width;
    };

    const updateMedia = (media: GalleryMedia, direction: "left" | "right") => {
      const x = media.width * media.index - scroll.current - media.extra;
      media.mesh.position.x = x;

      if (bend === 0) {
        media.mesh.position.y = 0;
        media.mesh.rotation.z = 0;
      } else {
        const halfViewport = viewport.width / 2;
        const absoluteBend = Math.abs(bend);
        const radius =
          (halfViewport * halfViewport + absoluteBend * absoluteBend) /
          (2 * absoluteBend);
        const effectiveX = Math.min(Math.abs(x), halfViewport);
        const arc =
          radius -
          Math.sqrt(Math.max(radius * radius - effectiveX * effectiveX, 0));

        media.mesh.position.y = bend > 0 ? -arc : arc;
        media.mesh.rotation.z =
          (bend > 0 ? -1 : 1) *
          Math.sign(x) *
          Math.asin(Math.min(effectiveX / radius, 1));
      }

      const speed = scroll.current - scroll.last;
      media.program.uniforms.uTime.value += 0.035;
      media.program.uniforms.uSpeed.value = speed;

      const planeOffset = media.mesh.scale.x / 2;
      const viewportOffset = viewport.width / 2;
      const isBefore = media.mesh.position.x + planeOffset < -viewportOffset;
      const isAfter = media.mesh.position.x - planeOffset > viewportOffset;

      if (direction === "right" && isBefore) {
        media.extra -= media.widthTotal;
      }
      if (direction === "left" && isAfter) {
        media.extra += media.widthTotal;
      }
    };

    const render = () => {
      if (!isRunning) return;
      scroll.current +=
        (scroll.target - scroll.current) * Math.min(scrollEase, 0.2);
      const direction = scroll.current > scroll.last ? "right" : "left";
      medias.forEach((media) => updateMedia(media, direction));
      renderer.render({ scene, camera });
      scroll.last = scroll.current;
      animationFrame = window.requestAnimationFrame(render);
    };

    const startRendering = () => {
      if (isRunning) return;
      isRunning = true;
      animationFrame = window.requestAnimationFrame(render);
    };

    const stopRendering = () => {
      isRunning = false;
      window.cancelAnimationFrame(animationFrame);
    };

    const handlePointerDown = (event: PointerEvent) => {
      pointerDown = true;
      startX = event.clientX;
      startTarget = scroll.target;
      container.setPointerCapture(event.pointerId);
      container.dataset.dragging = "true";
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerDown) return;
      const distance = (startX - event.clientX) * scrollSpeed * 0.012;
      scroll.target = startTarget + distance;
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!pointerDown) return;
      pointerDown = false;
      if (container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
      delete container.dataset.dragging;
      snap();
    };

    const handleWheel = (event: WheelEvent) => {
      const horizontalDelta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.shiftKey
            ? event.deltaY
            : 0;
      if (horizontalDelta === 0) return;
      event.preventDefault();
      scroll.target += Math.sign(horizontalDelta) * scrollSpeed * 0.85;
      snap();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      scroll.target += direction * (medias[0]?.width ?? 1);
      snap();
    };

    const resizeObserver = new ResizeObserver(layout);
    resizeObserver.observe(container);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startRendering();
        else stopRendering();
      },
      { rootMargin: "220px 0px" },
    );
    visibilityObserver.observe(container);

    container.addEventListener("pointerdown", handlePointerDown);
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerup", handlePointerUp);
    container.addEventListener("pointercancel", handlePointerUp);
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("keydown", handleKeyDown);

    return () => {
      stopRendering();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      container.removeEventListener("pointerdown", handlePointerDown);
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerup", handlePointerUp);
      container.removeEventListener("pointercancel", handlePointerUp);
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("keydown", handleKeyDown);
      if (gl.canvas.parentNode === container) {
        container.removeChild(gl.canvas);
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [
    bend,
    borderRadius,
    items,
    scrollEase,
    scrollSpeed,
    textColor,
  ]);

  return (
    <div
      className="circular-gallery"
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Galeria circular de relógios disponíveis. Arraste horizontalmente ou use as setas esquerda e direita."
    />
  );
}
