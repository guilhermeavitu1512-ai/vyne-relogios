export const editorialEase = [0.22, 1, 0.36, 1] as const;

export const motionDurations = {
  fast: 0.28,
  content: 0.65,
  image: 0.82,
  section: 0.7,
} as const;

export const revealOffset = 24;

export const staggerDelay = (index: number, step = 0.07) => index * step;
