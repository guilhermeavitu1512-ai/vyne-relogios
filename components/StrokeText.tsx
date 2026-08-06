"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./StrokeText.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type StrokeTextTrigger = "mount" | "scroll" | "hover" | "loop";
type StrokeTextFillMode = "wipe" | "fade" | "none";

type StrokeTextProps = {
  text: string;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  drawDuration?: number;
  fillDelay?: number;
  stagger?: number;
  ease?: string;
  trigger?: StrokeTextTrigger;
  fillMode?: StrokeTextFillMode;
  fontSize?: number;
  fontWeight?: CSSProperties["fontWeight"];
  letterSpacing?: number;
  reverse?: boolean;
  startDelay?: number;
  height?: string;
  className?: string;
  style?: CSSProperties;
  ariaHidden?: boolean;
};

type TextBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function StrokeText({
  text,
  strokeColor = "#a3fb06",
  fillColor = "#ffffff",
  strokeWidth = 1.2,
  drawDuration = 1.35,
  fillDelay = 0.08,
  stagger = 0.025,
  ease = "power2.out",
  trigger = "mount",
  fillMode = "wipe",
  fontSize = 118,
  fontWeight = 400,
  letterSpacing = -4,
  reverse = false,
  startDelay = 0,
  height,
  className = "",
  style = {},
  ariaHidden = false,
}: StrokeTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const strokeTextRef = useRef<SVGTextElement>(null);
  const wipeRectRef = useRef<SVGRectElement>(null);
  const [box, setBox] = useState<TextBox | null>(null);

  const rawId = useId();
  const wipeId = `stroke-text-wipe-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const characters = useMemo(() => Array.from(String(text ?? "")), [text]);
  const dash = Math.max(fontSize * 7, 200);
  const fontStyle = useMemo<CSSProperties>(
    () => ({
      fontSize: `${fontSize}px`,
      fontWeight,
      letterSpacing: `${letterSpacing}px`,
    }),
    [fontSize, fontWeight, letterSpacing],
  );

  useLayoutEffect(() => {
    const node = strokeTextRef.current;
    if (!node) return;

    let cancelled = false;
    const measure = () => {
      if (cancelled || !strokeTextRef.current) return;

      let bounds: DOMRect;
      try {
        bounds = strokeTextRef.current.getBBox();
      } catch {
        return;
      }

      if (!bounds.width) return;
      const padding = Math.max(Number(strokeWidth) || 1, fontSize * 0.1);
      const nextBox = {
        x: bounds.x - padding,
        y: bounds.y - padding,
        width: bounds.width + padding * 2,
        height: bounds.height + padding * 2,
      };

      setBox((current) =>
        current &&
        Math.abs(current.x - nextBox.x) < 0.5 &&
        Math.abs(current.y - nextBox.y) < 0.5 &&
        Math.abs(current.width - nextBox.width) < 0.5
          ? current
          : nextBox,
      );
    };

    measure();
    document.fonts?.ready.then(measure).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [characters, fontSize, fontWeight, letterSpacing, strokeWidth]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !box) return;

    const strokes = gsap.utils.toArray<SVGElement>(root.querySelectorAll("[data-stroke-char]"));
    const fills = gsap.utils.toArray<SVGElement>(root.querySelectorAll("[data-fill-char]"));
    const wipe = wipeRectRef.current;
    if (!strokes.length) return;

    const fillEnabled = fillMode !== "none";
    const useWipe = fillEnabled && fillMode === "wipe";
    const fillDuration = Math.max(0.4, drawDuration * 0.5);
    const staggerConfig = reverse ? { each: stagger, from: "end" as const } : stagger;
    const targets = [...strokes, ...fills, wipe].filter(Boolean);

    const setStart = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: dash });
      gsap.set(fills, { opacity: useWipe ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: 0 } });
    };

    const setEnd = () => {
      gsap.killTweensOf(targets);
      gsap.set(strokes, { strokeDasharray: dash, strokeDashoffset: 0 });
      gsap.set(fills, { opacity: fillEnabled ? 1 : 0 });
      if (wipe) gsap.set(wipe, { attr: { width: fillEnabled ? box.width : 0 } });
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEnd();
      return () => gsap.killTweensOf(targets);
    }

    const buildTimeline = () => {
      setStart();
      const timeline = gsap.timeline({
        paused: true,
        delay: startDelay,
        repeat: trigger === "loop" ? -1 : 0,
        repeatDelay: trigger === "loop" ? 0.9 : 0,
        defaults: { overwrite: "auto" },
      });

      timeline.to(
        strokes,
        { strokeDashoffset: 0, duration: drawDuration, ease, stagger: staggerConfig },
        0,
      );

      if (useWipe && wipe) {
        timeline.to(
          wipe,
          { attr: { width: box.width }, duration: fillDuration, ease: "power2.inOut" },
          drawDuration + fillDelay,
        );
      } else if (fillEnabled) {
        timeline.to(
          fills,
          { opacity: 1, duration: fillDuration, ease: "power2.out", stagger: staggerConfig },
          drawDuration + fillDelay,
        );
      }

      return timeline;
    };

    let timeline: gsap.core.Timeline | null = null;
    let scrollTrigger: ScrollTrigger | null = null;
    let removeHover: (() => void) | null = null;

    if (trigger === "hover") {
      setEnd();
      const play = () => {
        timeline?.kill();
        timeline = buildTimeline();
        timeline.play(0);
      };
      root.addEventListener("pointerenter", play);
      removeHover = () => root.removeEventListener("pointerenter", play);
    } else {
      timeline = buildTimeline();
      if (trigger === "scroll") {
        scrollTrigger = ScrollTrigger.create({
          trigger: root,
          start: "top 82%",
          once: true,
          onEnter: () => timeline?.play(0),
        });
      } else {
        timeline.play(0);
      }
    }

    return () => {
      removeHover?.();
      scrollTrigger?.kill();
      timeline?.kill();
      gsap.killTweensOf(targets);
    };
  }, [box, dash, drawDuration, ease, fillDelay, fillMode, reverse, stagger, startDelay, trigger]);

  const viewBox = box
    ? `${box.x} ${box.y} ${box.width} ${box.height}`
    : `0 ${-fontSize} 600 ${fontSize * 1.3}`;
  const rootStyle = {
    "--stroke-text-height": height ?? `${Math.round(fontSize * 1.3)}px`,
    ...style,
  } as CSSProperties;

  return (
    <span
      ref={rootRef}
      className={`stroke-text ${trigger === "hover" ? "stroke-text--hover" : ""} ${className}`.trim()}
      style={rootStyle}
      role={ariaHidden ? undefined : "img"}
      aria-label={ariaHidden ? undefined : text}
      aria-hidden={ariaHidden || undefined}
    >
      <svg
        className="stroke-text__svg"
        viewBox={viewBox}
        preserveAspectRatio="xMinYMid meet"
        aria-hidden="true"
      >
        {fillMode === "wipe" && box && (
          <defs>
            <clipPath id={wipeId} clipPathUnits="userSpaceOnUse">
              <rect ref={wipeRectRef} x={box.x} y={box.y} width="0" height={box.height} />
            </clipPath>
          </defs>
        )}

        <text
          ref={strokeTextRef}
          className="stroke-text__stroke"
          x="0"
          y="0"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={fontStyle}
        >
          {characters.map((character, index) => (
            <tspan data-stroke-char key={`stroke-${index}`}>
              {character}
            </tspan>
          ))}
        </text>

        <text
          className="stroke-text__fill"
          x="0"
          y="0"
          fill={fillColor}
          stroke="none"
          style={fontStyle}
          clipPath={fillMode === "wipe" && box ? `url(#${wipeId})` : undefined}
        >
          {characters.map((character, index) => (
            <tspan data-fill-char key={`fill-${index}`}>
              {character}
            </tspan>
          ))}
        </text>
      </svg>
    </span>
  );
}
