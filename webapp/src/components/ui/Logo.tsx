'use client';

import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  /** Width of the logo in pixels */
  width?: number;
  /** Height of the logo in pixels */
  height?: number;
  /** Whether to show text alongside the logo */
  showText?: boolean;
  /** Link destination (defaults to home) */
  href?: string;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Logo component with optional text
 * Uses a placeholder SVG until a real logo is provided
 */
export function Logo({
  width = 40,
  height = 40,
  showText = true,
  href = '/',
  className = '',
  testId = 'logo',
}: LogoProps) {
  const content = (
    <div 
      id={testId}
      data-testid={testId}
      className={`flex align-items-center gap-2 ${className}`}
    >
      <Image
        id={`${testId}-image`}
        data-testid={`${testId}-image`}
        src="/images/logo-placeholder.svg"
        alt="Sonirama"
        width={width}
        height={height}
        priority
        style={{ objectFit: 'contain' }}
      />
      {showText && (
        <span 
          id={`${testId}-text`}
          data-testid={`${testId}-text`}
          className="font-bold text-xl"
          style={{ color: 'var(--primary-color)' }}
        >
          Sonirama
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link 
        href={href} 
        className="no-underline"
        id={`${testId}-link`}
        data-testid={`${testId}-link`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
