'use client';

import { ProgressSpinner, ProgressSpinnerProps } from 'primereact/progressspinner';

interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show full-page overlay */
  fullPage?: boolean;
  /** Loading message to display */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for Playwright */
  testId?: string;
}

const sizeMap: Record<string, { width: string; height: string }> = {
  small: { width: '24px', height: '24px' },
  medium: { width: '48px', height: '48px' },
  large: { width: '64px', height: '64px' },
};

/**
 * Loading spinner component
 * Can be used inline or as a full-page overlay
 */
export function LoadingSpinner({
  size = 'medium',
  fullPage = false,
  message,
  className = '',
  testId = 'loading-spinner',
}: LoadingSpinnerProps) {
  const dimensions = sizeMap[size];
  const strokeWidth = size === 'small' ? '4' : size === 'medium' ? '3' : '2';

  const spinner = (
    <div
      id={testId}
      data-testid={testId}
      className={`flex flex-column align-items-center justify-content-center gap-3 ${className}`}
    >
      <ProgressSpinner
        style={dimensions}
        strokeWidth={strokeWidth}
        animationDuration=".8s"
        aria-label="Cargando"
      />
      {message && (
        <span 
          id={`${testId}-message`}
          data-testid={`${testId}-message`}
          className="text-color-secondary"
        >
          {message}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div
        id={`${testId}-overlay`}
        data-testid={`${testId}-overlay`}
        className="fixed top-0 left-0 w-full h-full flex align-items-center justify-content-center"
        style={{
          backgroundColor: 'var(--surface-ground)',
          zIndex: 'var(--z-modal)',
        }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
}
