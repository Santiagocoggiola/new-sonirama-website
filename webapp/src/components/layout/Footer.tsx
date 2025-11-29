'use client';

import Link from 'next/link';

interface FooterProps {
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Footer component
 */
export function Footer({ testId = 'footer' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id={testId}
      data-testid={testId}
      className="surface-card border-top-1 surface-border py-4 px-4"
    >
      <div className="flex flex-column md:flex-row align-items-center justify-content-between gap-3">
        <div className="flex align-items-center gap-4">
          <span
            id={`${testId}-copyright`}
            data-testid={`${testId}-copyright`}
            className="text-color-secondary text-sm"
          >
            © {currentYear} Sonirama. Todos los derechos reservados.
          </span>
        </div>
        <div className="flex align-items-center gap-4">
          <Link
            href="/contact"
            id={`${testId}-contact-link`}
            data-testid={`${testId}-contact-link`}
            className="text-color-secondary text-sm no-underline hover:text-primary"
          >
            Contacto
          </Link>
        </div>
      </div>
    </footer>
  );
}
