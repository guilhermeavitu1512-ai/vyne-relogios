export const editorialEase = [0.22, 1, 0.36, 1] as const;

export const motionDurations = {
  fast: 0.3,
  content: 0.78,
  image: 0.7,
  section: 0.85,
} as const;

export const revealOffset = 24;

export const staggerDelay = (index: number, step = 0.07) => index * step;
