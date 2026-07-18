import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "confirm" | "outline" | "commit" | "danger" | "ghost";
type Size = "md" | "lg";

const VARIANT_CLASS: Record<Variant, string> = {
  // Aksi "generate/create" — warna brand utama, jangan diganti maknanya.
  primary: "bg-brand text-white hover:bg-brand/90 shadow-sm",
  // Aksi "Validasi" — sengaja beda warna dari primary supaya guru tidak bingung generate vs validasi.
  confirm: "bg-confirm text-white hover:bg-confirm/90 shadow-sm",
  // Aksi sekunder (Buat Ulang, Batal, Revisi Lagi).
  outline: "border-2 border-brand-dark text-brand-dark hover:bg-brand-cream-alt",
  // Aksi commit/simpan (Selesai Sesi, Simpan Revisi) — netral gelap solid.
  commit: "bg-brand-dark text-white hover:bg-brand-dark/85",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  // Rounded pill hover supaya afforadance-nya jelas, bukan cuma keliatan teks biasa.
  ghost: "rounded-md -mx-2 -my-1 px-2 py-1 text-brand-muted hover:bg-black/5 hover:text-brand-dark",
};

const SIZE_CLASS: Record<Size, string> = {
  lg: "rounded-2xl px-6 py-3 text-base font-bold",
  md: "rounded-lg px-4 py-2 text-sm font-semibold",
};

const BASE_CLASS =
  "cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-50";

export function Button({
  variant = "primary",
  size = "md",
  className,
  disabled,
  ...props
}: {
  variant?: Variant;
  size?: Size;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={disabled}
      className={cn(
        variant !== "ghost" && SIZE_CLASS[size],
        VARIANT_CLASS[variant],
        BASE_CLASS,
        className
      )}
      {...props}
    />
  );
}
