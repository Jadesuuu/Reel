import type { Transition, Variants } from 'motion/react';

export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
export const EASE_IN_OUT: [number, number, number, number] = [0.77, 0, 0.175, 1];

export const quick: Transition = { duration: 0.16, ease: EASE_OUT };
export const standard: Transition = { duration: 0.22, ease: EASE_OUT };
export const move: Transition = { duration: 0.26, ease: EASE_IN_OUT };
export const spring: Transition = { type: 'spring', duration: 0.42, bounce: 0.12 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: standard },
  exit: { opacity: 0, y: 4, transition: quick },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: standard },
  exit: { opacity: 0, transition: quick },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: standard },
  exit: { opacity: 0, scale: 0.98, y: 2, transition: quick },
};

export const listStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
};

export const listItem: Variants = {
  hidden: { opacity: 0, y: 5 },
  visible: { opacity: 1, y: 0, transition: standard },
  exit: { opacity: 0, x: 24, transition: { duration: 0.18, ease: EASE_OUT } },
};

export const sheetFromRight: Variants = {
  hidden: { x: 24, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.26, ease: EASE_OUT } },
  exit: { x: 16, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } },
};

export const sheetFromBottom: Variants = {
  hidden: { y: 32, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.26, ease: EASE_OUT } },
  exit: { y: 24, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } },
};
