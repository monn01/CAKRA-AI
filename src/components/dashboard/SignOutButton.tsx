"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="cursor-pointer rounded-md px-2 py-1 -mx-2 -my-1 text-sm font-medium text-brand-muted transition-colors hover:bg-black/5 hover:text-brand-dark"
    >
      Keluar
    </button>
  );
}
