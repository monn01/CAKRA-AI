"use client";

import { useMemo } from "react";

const PALETTE = ["#38bdf8", "#fbbf24", "#fb923c", "#34d399", "#f472b6"];
const NODE_COUNT = 16;
const MAX_LINK_DISTANCE = 26; // dalam persen layar

// Mode siang: warna blob pastel + doodle mengambang biar gak putih polosan.
// Teks (caption maupun transkrip penuh) selalu ada di kolom tengah yang
// dibatasi lebar (max-w-4xl/5xl mx-auto), tapi tingginya bisa macam-macam
// (caption nempel di bawah, transkrip penuh bisa sepanjang layar & discroll)
// — makanya dekorasi ditaruh di margin kiri-kanan aja, bukan atas-bawah,
// supaya di kondisi apapun gak numpuk sama teks.
const LIGHT_BLOB_COLORS = ["#7dd3fc", "#fde68a", "#f9a8d4", "#6ee7b7", "#c4b5fd"];
const LIGHT_DOODLES = ["☁️", "⭐", "🌈", "✨", "☁️", "🎈", "🌟"];

type Node = { x: number; y: number; size: number; color: string; duration: number; delay: number };
type Blob = { x: number; y: number; size: number; color: string; duration: number; delay: number };
type Doodle = { x: number; y: number; size: number; char: string; duration: number; delay: number };

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

export function ProjectorBackground({ seed = 7, light = false }: { seed?: number; light?: boolean }) {
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

  const blobs = useMemo<Blob[]>(() => {
    const rand = mulberry32(seed + 100);
    return LIGHT_BLOB_COLORS.map((color, i) => {
      const onLeft = i % 2 === 0;
      return {
        color,
        x: onLeft ? 1 + rand() * 13 : 86 + rand() * 13,
        y: 4 + rand() * 90,
        size: 22 + rand() * 14,
        duration: 16 + rand() * 12,
        delay: rand() * -18,
      };
    });
  }, [seed]);

  const doodles = useMemo<Doodle[]>(() => {
    const rand = mulberry32(seed + 200);
    return LIGHT_DOODLES.map((char, i) => {
      const onLeft = i % 2 === 0;
      return {
        char,
        x: onLeft ? 1 + rand() * 11 : 88 + rand() * 11,
        y: 3 + rand() * 90,
        size: 26 + rand() * 18,
        duration: 7 + rand() * 7,
        delay: rand() * -10,
      };
    });
  }, [seed]);

  if (light) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {blobs.map((b, i) => (
          <span
            key={i}
            className="projector-blob absolute rounded-full blur-3xl"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: `${b.size}vmin`,
              height: `${b.size}vmin`,
              backgroundColor: b.color,
              opacity: 0.35,
              animationDuration: `${b.duration}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        ))}
        {doodles.map((d, i) => (
          <span
            key={i}
            className="projector-doodle absolute select-none"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              fontSize: `${d.size}px`,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
            }}
          >
            {d.char}
          </span>
        ))}
      </div>
    );
  }

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
