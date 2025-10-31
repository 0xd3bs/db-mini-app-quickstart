"use client";

import { useEffect, useState } from "react";

const KEY = "ahp_theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY) as "light"|"dark"|null;
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        document.documentElement.dataset.theme = saved;
        return;
      }
      const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
      const t = prefersLight ? "light" : "dark";
      setTheme(t);
      document.documentElement.dataset.theme = t;
    } catch {}
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { window.localStorage.setItem(KEY, next); } catch {}
    document.documentElement.dataset.theme = next;
  };

  return (
    <button className="btn ghost" onClick={toggle} aria-label="Cambiar tema claro/oscuro">
      {theme === "dark" ? "Claro" : "Oscuro"}
    </button>
  );
}
