"use client";

import React, {
  type CSSProperties,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./GradualBlur.css";

type Position = "top" | "bottom" | "left" | "right";
type Curve = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";

export type GradualBlurProps = {
  position?: Position;
  strength?: number;
  height?: string;
  width?: string;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  animated?: boolean | "scroll";
  duration?: string;
  easing?: string;
  opacity?: number;
  curve?: Curve;
  responsive?: boolean;
  mobileHeight?: string;
  tabletHeight?: string;
  desktopHeight?: string;
  mobileWidth?: string;
  tabletWidth?: string;
  desktopWidth?: string;
  preset?:
    | Position
    | "subtle"
    | "intense"
    | "smooth"
    | "sharp"
    | "header"
    | "footer"
    | "sidebar"
    | "page-header"
    | "page-footer";
  gpuOptimized?: boolean;
  hoverIntensity?: number;
  target?: "parent" | "page";
  onAnimationComplete?: () => void;
  className?: string;
  style?: CSSProperties;
};

const DEFAULT_CONFIG: Partial<GradualBlurProps> = {
  position: "bottom",
  strength: 2,
  height: "6rem",
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: "0.3s",
  easing: "ease-out",
  opacity: 1,
  curve: "linear",
  responsive: false,
  gpuOptimized: true,
  target: "parent",
  className: "",
  style: {},
};

const PRESETS: Record<string, Partial<GradualBlurProps>> = {
  top: { position: "top", height: "6rem" },
  bottom: { position: "bottom", height: "6rem" },
  left: { position: "left", height: "6rem" },
  right: { position: "right", height: "6rem" },
  subtle: { height: "4rem", strength: 1, opacity: 0.8, divCount: 3 },
  intense: {
    height: "10rem",
    strength: 4,
    divCount: 8,
    exponential: true,
  },
  smooth: { height: "8rem", curve: "bezier", divCount: 10 },
  sharp: { height: "5rem", curve: "linear", divCount: 4 },
  header: { position: "top", height: "8rem", curve: "ease-out" },
  footer: { position: "bottom", height: "8rem", curve: "ease-out" },
  sidebar: { position: "left", height: "6rem", strength: 2.5 },
  "page-header": {
    position: "top",
    height: "10rem",
    target: "page",
    strength: 3,
  },
  "page-footer": {
    position: "bottom",
    height: "10rem",
    target: "page",
    strength: 3,
  },
};

const CURVE_FUNCTIONS: Record<Curve, (progress: number) => number> = {
  linear: (progress) => progress,
  bezier: (progress) => progress * progress * (3 - 2 * progress),
  "ease-in": (progress) => progress * progress,
  "ease-out": (progress) => 1 - Math.pow(1 - progress, 2),
  "ease-in-out": (progress) =>
    progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2,
};

const getGradientDirection = (position: Position): string => {
  const directions: Record<Position, string> = {
    top: "to top",
    bottom: "to bottom",
    left: "to left",
    right: "to right",
  };

  return directions[position];
};

function useResponsiveDimension(
  responsive: boolean,
  config: Required<GradualBlurProps>,
  dimension: "height" | "width",
) {
  const [value, setValue] = useState<string | undefined>(config[dimension]);

  useEffect(() => {
    if (!responsive) return;

    const calculate = () => {
      const breakpoint =
        window.innerWidth <= 480
          ? "mobile"
          : window.innerWidth <= 768
            ? "tablet"
            : "desktop";
      const key = `${breakpoint}${dimension[0].toUpperCase()}${dimension.slice(1)}` as
        | "mobileHeight"
        | "tabletHeight"
        | "desktopHeight"
        | "mobileWidth"
        | "tabletWidth"
        | "desktopWidth";

      setValue(config[key] || config[dimension]);
    };

    let timeout: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(calculate, 100);
    };

    calculate();
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", onResize);
    };
  }, [config, dimension, responsive]);

  return responsive ? value : config[dimension];
}

function useIntersectionObserver(
  ref: React.RefObject<HTMLDivElement | null>,
  shouldObserve: boolean,
) {
  const [isVisible, setIsVisible] = useState(!shouldObserve);

  useEffect(() => {
    if (!shouldObserve || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, shouldObserve]);

  return isVisible;
}

function GradualBlur(props: PropsWithChildren<GradualBlurProps>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const config = useMemo(() => {
    const presetConfig =
      props.preset && PRESETS[props.preset] ? PRESETS[props.preset] : {};

    return {
      ...DEFAULT_CONFIG,
      ...presetConfig,
      ...props,
    } as Required<GradualBlurProps>;
  }, [props]);

  const responsiveHeight = useResponsiveDimension(
    config.responsive,
    config,
    "height",
  );
  const responsiveWidth = useResponsiveDimension(
    config.responsive,
    config,
    "width",
  );
  const isVisible = useIntersectionObserver(
    containerRef,
    config.animated === "scroll",
  );

  const blurDivs = useMemo(() => {
    const increment = 100 / config.divCount;
    const currentStrength =
      isHovered && config.hoverIntensity
        ? config.strength * config.hoverIntensity
        : config.strength;
    const curveFunction =
      CURVE_FUNCTIONS[config.curve] || CURVE_FUNCTIONS.linear;

    return Array.from({ length: config.divCount }, (_, index) => {
      const layer = index + 1;
      const progress = curveFunction(layer / config.divCount);
      const blurValue = config.exponential
        ? Number(Math.pow(2, progress * 4)) * 0.0625 * currentStrength
        : 0.0625 * (progress * config.divCount + 1) * currentStrength;
      const p1 = Math.round((increment * layer - increment) * 10) / 10;
      const p2 = Math.round(increment * layer * 10) / 10;
      const p3 = Math.round((increment * layer + increment) * 10) / 10;
      const p4 =
        Math.round((increment * layer + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const direction = getGradientDirection(config.position);
      const divStyle: CSSProperties = {
        position: "absolute",
        inset: 0,
        maskImage: `linear-gradient(${direction}, ${gradient})`,
        WebkitMaskImage: `linear-gradient(${direction}, ${gradient})`,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        backgroundColor: "rgba(11, 13, 15, 0.018)",
        opacity: config.opacity,
        transform: config.gpuOptimized ? "translate3d(0, 0, 0)" : undefined,
        willChange: config.gpuOptimized ? "backdrop-filter" : undefined,
        transition:
          config.animated && config.animated !== "scroll"
            ? `backdrop-filter ${config.duration} ${config.easing}`
            : undefined,
      };

      return <div key={layer} style={divStyle} />;
    });
  }, [config, isHovered]);

  const containerStyle = useMemo<CSSProperties>(() => {
    const isVertical = ["top", "bottom"].includes(config.position);
    const isPageTarget = config.target === "page";
    const baseStyle: CSSProperties = {
      position: isPageTarget ? "fixed" : "absolute",
      pointerEvents: config.hoverIntensity ? "auto" : "none",
      opacity: isVisible ? 1 : 0,
      transition: config.animated
        ? `opacity ${config.duration} ${config.easing}`
        : undefined,
      zIndex: isPageTarget ? config.zIndex + 100 : config.zIndex,
      ...config.style,
    };

    if (isVertical) {
      baseStyle.height = responsiveHeight;
      baseStyle.width = responsiveWidth || "100%";
      baseStyle[config.position] = 0;
      baseStyle.left = 0;
      baseStyle.right = 0;
    } else {
      baseStyle.width = responsiveWidth || responsiveHeight;
      baseStyle.height = "100%";
      baseStyle[config.position] = 0;
      baseStyle.top = 0;
      baseStyle.bottom = 0;
    }

    return baseStyle;
  }, [config, isVisible, responsiveHeight, responsiveWidth]);

  useEffect(() => {
    if (
      isVisible &&
      config.animated === "scroll" &&
      config.onAnimationComplete
    ) {
      const timeout = setTimeout(
        config.onAnimationComplete,
        parseFloat(config.duration) * 1000,
      );
      return () => clearTimeout(timeout);
    }
  }, [config, isVisible]);

  return (
    <div
      ref={containerRef}
      className={`gradual-blur gradual-blur-${config.target} ${config.className}`}
      style={containerStyle}
      onMouseEnter={
        config.hoverIntensity ? () => setIsHovered(true) : undefined
      }
      onMouseLeave={
        config.hoverIntensity ? () => setIsHovered(false) : undefined
      }
    >
      <div className="gradual-blur-inner">{blurDivs}</div>
      {props.children ? (
        <div className="gradual-blur-content">{props.children}</div>
      ) : null}
    </div>
  );
}

const GradualBlurMemo = React.memo(GradualBlur);
GradualBlurMemo.displayName = "GradualBlur";

export default GradualBlurMemo;
