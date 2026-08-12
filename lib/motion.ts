export const editorialEase = [0.22, 1, 0.36, 1] as const;

export const motionDurations = {
  fast: 0.22,
  content: 0.42,
  image: 0.48,
  section: 0.58,
} as const;

export const revealOffset = 18;

export const staggerDelay = (index: number, step = 0.05) => index * step;
