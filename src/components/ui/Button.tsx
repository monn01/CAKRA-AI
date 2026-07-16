import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "confirm" | "outline" | "commit" | "danger" | "ghost";
type Size = "md" | "lg";

const VARIANT_CLASS: Record<Variant, string> = {
  // Aksi "generate/create" — warna yang sudah dikenal di seluruh app, jangan diganti maknanya.
  primary: "bg-success text-white hover:bg-emerald-700 shadow-sm",
  // Aksi "Validasi" — sengaja beda warna dari primary supaya guru tidak bingung generate vs validasi.
  confirm: "bg-primary text-white hover:bg-sky-700 shadow-sm",
  // Aksi sekunder (Generate Ulang, Batal, Revisi Lagi).
  outline:
    "border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800",
  // Aksi commit/simpan (Selesai Sesi, Simpan Revisi) — netral gelap solid.
  commit:
    "bg-neutral-900 text-white hover:bg-neutral-700 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost: "text-neutral-500 hover:underline",
};

const SIZE_CLASS: Record<Size, string> = {
  lg: "rounded-2xl px-6 py-3 text-base font-bold",
  md: "rounded-lg px-4 py-2 text-sm font-semibold",
};

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
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
