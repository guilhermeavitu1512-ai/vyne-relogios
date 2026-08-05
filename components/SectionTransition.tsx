import type { CSSProperties } from "react";

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
  const style = {
    "--transition-from": toneColors[from],
    "--transition-to": toneColors[to],
  } as CSSProperties;

  return (
    <div
      className={`section-transition section-transition-${intensity}`}
      style={style}
      aria-hidden="true"
    >
      <span className="section-transition-noise" />
      <span className="section-transition-divider" />
    </div>
  );
}
