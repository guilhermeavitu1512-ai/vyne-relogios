export const editorialEase = [0.22, 1, 0.36, 1] as const;

export const motionDurations = {
  fast: 0.18,
  content: 0.32,
  image: 0.4,
  section: 0.5,
} as const;

export const revealOffset = 18;

export const staggerDelay = (index: number, step = 0.05) => Math.min(index * step, 0.28);
