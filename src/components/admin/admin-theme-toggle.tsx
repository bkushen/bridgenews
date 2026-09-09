"use client";

import { useEffect, useState } from "react";

type AdminTheme = "light" | "dark";

const STORAGE_KEY = "bridgenews-admin-theme";

function applyTheme(theme: AdminTheme) {
  const shell = document.querySelector<HTMLElement>("[data-admin-shell]");
  if (shell) shell.dataset.adminTheme = theme;
}

export function AdminThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<AdminTheme>("light");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial: AdminTheme = saved === "dark" ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggleTheme() {
    const next: AdminTheme = theme === "light" ? "dark" : "light";
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`admin-theme-toggle inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-black transition ${compact ? "min-w-10" : "w-full"}`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} admin theme`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
    >
      <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
      {compact ? null : <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>}
    </button>
  );
}
