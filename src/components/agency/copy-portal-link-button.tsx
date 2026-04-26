"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyPortalLinkButtonProps = {
  url: string;
};

export function CopyPortalLinkButton({ url }: CopyPortalLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
    >
      {copied ? "Link copiado" : "Copiar link del portal"}
    </button>
  );
}
