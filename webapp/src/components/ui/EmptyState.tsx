'use client';

import { Button } from 'primereact/button';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: string;
}

interface EmptyStateProps {
  /** Icon to display (PrimeIcons class) */
  icon?: string;
  /** Main title */
  title: string;
  /** Description text */
  description?: string;
  /** Description text (alias for description) */
  message?: string;
  /** Action button text */
  actionLabel?: string;
  /** Action button click handler */
  onAction?: () => void;
  /** Action object (alternative to actionLabel/onAction) */
  action?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for Playwright */
  testId?: string;
  /** Children to render below description */
  children?: React.ReactNode;
}

/**
 * Empty state component for showing when no data is available
 */
export function EmptyState({
  icon = 'pi pi-inbox',
  title,
  description,
  message,
  actionLabel,
  onAction,
  action,
  className = '',
  testId = 'empty-state',
  children,
}: EmptyStateProps) {
  const displayMessage = description || message;
  const hasAction = (actionLabel && onAction) || action;
  const effectiveAction = action || (actionLabel && onAction ? { label: actionLabel, onClick: onAction } : null);

  return (
    <div
      id={testId}
      data-testid={testId}
      className={`flex flex-column align-items-center justify-content-center text-center p-5 ${className}`}
    >
      <i
        id={`${testId}-icon`}
        data-testid={`${testId}-icon`}
        className={`${icon} text-6xl text-color-secondary mb-4`}
        style={{ opacity: 0.5 }}
      />
      <h3
        id={`${testId}-title`}
        data-testid={`${testId}-title`}
        className="text-xl font-semibold text-color mb-2"
      >
        {title}
      </h3>
      {displayMessage && (
        <p
          id={`${testId}-description`}
          data-testid={`${testId}-description`}
          className="text-color-secondary mb-4 line-height-3"
          style={{ maxWidth: '400px' }}
        >
          {displayMessage}
        </p>
      )}
      {children}
      {hasAction && effectiveAction && (
        <Button
          id={`${testId}-action`}
          data-testid={`${testId}-action`}
          label={effectiveAction.label}
          icon={effectiveAction.icon || 'pi pi-plus'}
          onClick={effectiveAction.onClick}
          className="mt-3"
        />
      )}
    </div>
  );
}
