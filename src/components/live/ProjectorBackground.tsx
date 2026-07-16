"use client";

import { useMemo } from "react";

const PALETTE = ["#38bdf8", "#fbbf24", "#fb923c", "#34d399", "#f472b6"];
const NODE_COUNT = 16;
const MAX_LINK_DISTANCE = 26; // dalam persen layar

type Node = { x: number; y: number; size: number; color: string; duration: number; delay: number };

// PRNG deterministik (bukan Math.random) supaya posisi node sama persis
// antara render server & client — hindari hydration mismatch.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ProjectorBackground({ seed = 7 }: { seed?: number }) {
  const nodes = useMemo<Node[]>(() => {
    const rand = mulberry32(seed);
    return Array.from({ length: NODE_COUNT }, (_, i) => ({
      x: 4 + rand() * 92,
      y: 4 + rand() * 92,
      size: 5 + rand() * 6,
      color: PALETTE[i % PALETTE.length],
      duration: 9 + rand() * 10,
      delay: rand() * -12,
    }));
  }, [seed]);

  const links = useMemo(() => {
    const result: { a: Node; b: Node }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < MAX_LINK_DISTANCE) {
          result.push({ a: nodes[i], b: nodes[j] });
        }
      }
    }
    return result;
  }, [nodes]);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <svg className="absolute inset-0 h-full w-full">
        {links.map((l, i) => (
          <line
            key={i}
            x1={`${l.a.x}%`}
            y1={`${l.a.y}%`}
            x2={`${l.b.x}%`}
            y2={`${l.b.y}%`}
            stroke={l.a.color}
            strokeWidth={1}
            opacity={0.12}
          />
        ))}
      </svg>
      {nodes.map((n, i) => (
        <span
          key={i}
          className="projector-node absolute rounded-full"
          style={{
            left: `${n.x}%`,
            top: `${n.y}%`,
            width: n.size,
            height: n.size,
            backgroundColor: n.color,
            animationDuration: `${n.duration}s`,
            animationDelay: `${n.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
