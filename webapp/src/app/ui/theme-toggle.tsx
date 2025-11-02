"use client";

import { useMemo } from "react";
import { Button } from "primereact/button";
import { useTheme } from "../theme-provider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const icon = useMemo(() => (isDark ? "pi-sun" : "pi-moon"), [isDark]);

  return (
    <Button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      icon={icon}
      rounded
      text
      severity="secondary"
      tooltip={isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
    />
  );
}
