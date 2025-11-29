'use client';

import { Button } from 'primereact/button';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  /** Show as text button instead of icon */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Theme toggle button component
 * Switches between light and dark mode
 */
export function ThemeToggle({
  showLabel = false,
  className = '',
  testId = 'theme-toggle',
}: ThemeToggleProps) {
  const { isDark, toggle, isInitialized } = useTheme();

  // Don't render until theme is initialized to avoid hydration mismatch
  if (!isInitialized) {
    return (
      <Button
        id={testId}
        data-testid={testId}
        type="button"
        icon="pi pi-circle"
        rounded
        text
        severity="secondary"
        aria-label="Cargando tema"
        className={className}
        disabled
      />
    );
  }

  const icon = isDark ? 'pi pi-sun' : 'pi pi-moon';
  const label = isDark ? 'Modo claro' : 'Modo oscuro';
  const tooltip = isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <Button
      id={testId}
      data-testid={testId}
      type="button"
      onClick={toggle}
      icon={icon}
      label={showLabel ? label : undefined}
      rounded={!showLabel}
      text
      severity="secondary"
      aria-label={tooltip}
      tooltip={tooltip}
      tooltipOptions={{ position: 'bottom' }}
      className={className}
    />
  );
}
