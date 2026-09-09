"use client";

import { useState } from "react";

type SourceLogoProps = {
  name: string;
  src?: string | null;
  className?: string;
  imageClassName?: string;
};

function fallbackMark(name: string) {
  const normalized = name.toLowerCase();
  if (normalized.includes("lankadeepa")) return "ල";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "BN";
}

function shouldSkipRemoteLogo(name: string, src?: string | null) {
  if (!src) return true;
  const normalized = name.toLowerCase();
  return normalized.includes("lankadeepa") && /lankadeepa\.lk\/favicon\.ico/i.test(src);
}

export function SourceLogo({ name, src, className = "h-10 w-10", imageClassName = "p-1" }: SourceLogoProps) {
  const [failed, setFailed] = useState(false);
  const mark = fallbackMark(name);
  const skipRemoteLogo = shouldSkipRemoteLogo(name, src);

  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white text-xs font-black text-gray-500 ${className}`}>
      {src && !failed && !skipRemoteLogo ? (
        <img
          src={src}
          alt={`${name} logo`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`h-full w-full object-contain ${imageClassName}`}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-label={`${name} logo fallback`} className={name.toLowerCase().includes("lankadeepa") ? "text-lg text-red-700" : undefined}>{mark}</span>
      )}
    </div>
  );
}
