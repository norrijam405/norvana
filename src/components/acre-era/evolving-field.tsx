"use client";

import { motion, useReducedMotion } from "framer-motion";

const seeds = [
  { x: "8%", y: "18%", size: 8, delay: 0 },
  { x: "22%", y: "72%", size: 5, delay: 0.7 },
  { x: "48%", y: "30%", size: 7, delay: 1.1 },
  { x: "72%", y: "62%", size: 6, delay: 1.5 },
  { x: "88%", y: "22%", size: 9, delay: 0.3 },
];

export function EvolvingField() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="acre-contours absolute inset-0 opacity-70" />
      <motion.div
        className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-moss/20 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1, 1.16, 1], x: [0, 34, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-20 bottom-6 h-80 w-80 rounded-full bg-ember/15 blur-3xl"
        animate={reduceMotion ? undefined : { scale: [1.08, 0.94, 1.08], y: [0, -24, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      {seeds.map((seed, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full bg-wheat/70 shadow-[0_0_24px_rgba(232,198,138,.35)]"
          style={{ left: seed.x, top: seed.y, width: seed.size, height: seed.size }}
          animate={
            reduceMotion
              ? undefined
              : {
                  y: [0, -18, 0],
                  opacity: [0.35, 0.95, 0.35],
                  scale: [0.8, 1.25, 0.8],
                }
          }
          transition={{ duration: 5 + index, repeat: Infinity, delay: seed.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
