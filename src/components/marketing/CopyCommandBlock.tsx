"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyCommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(command);
        ok = true;
      }
    } catch {
      // lanjut ke fallback legacy di bawah
    }

    if (!ok) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = command;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        ok = document.execCommand("copy");
        textarea.remove();
      } catch {
        ok = false;
      }
    }

    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-black/10 bg-brand-dark px-4 py-3 font-mono text-sm text-white/90 shadow-sm">
      <span className="select-none text-white/40">$</span>
      <code className="flex-1 overflow-x-auto whitespace-nowrap">{command}</code>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Salin perintah"
        className="shrink-0 cursor-pointer rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
      >
        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}
