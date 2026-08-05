"use client";

import { m, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";

import { editorialEase, motionDurations } from "@/lib/motion";

export type SectionTone = "black" | "blackGreen" | "darkGreen";
export type SectionTransitionIntensity = "subtle" | "soft";

const toneColors: Record<SectionTone, string> = {
  black: "#050706",
  blackGreen: "#07110d",
  darkGreen: "#08150f",
};

type SectionTransitionProps = {
  from: SectionTone;
  to: SectionTone;
  intensity?: SectionTransitionIntensity;
};

export default function SectionTransition({
  from,
  to,
  intensity = "subtle",
}: SectionTransitionProps) {
  const reduceMotion = useReducedMotion();
  const style = {
    "--transition-from": toneColors[from],
    "--transition-to": toneColors[to],
  } as CSSProperties;

  return (
    <m.div
      className={`section-transition section-transition-${intensity}`}
      style={style}
      aria-hidden="true"
      initial={reduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.05 }}
      transition={{
        duration: reduceMotion ? 0 : motionDurations.section,
        ease: editorialEase,
      }}
    >
      <span className="section-transition-noise" />
      <span className="section-transition-divider" />
    </m.div>
  );
}
