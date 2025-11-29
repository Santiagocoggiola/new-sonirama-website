'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { UserRole } from '@/types/auth';

interface AuthGuardProps {
  /** Content to render when authenticated */
  children: React.ReactNode;
  /** Required roles (if any) */
  allowedRoles?: UserRole[];
  /** Redirect path when not authenticated */
  redirectTo?: string;
  /** Redirect path when not authorized (wrong role) */
  unauthorizedRedirectTo?: string;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Auth guard component that protects routes
 * Redirects unauthenticated users to login
 * Optionally checks for required roles
 */
export function AuthGuard({
  children,
  allowedRoles,
  redirectTo = '/login',
  unauthorizedRedirectTo = '/unauthorized',
  showLoading = true,
  loadingComponent,
  testId = 'auth-guard',
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isInitialized, role, hasRole } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      router.replace(`${redirectTo}?returnUrl=${returnUrl}`);
      return;
    }

    // Check role authorization
    if (allowedRoles && allowedRoles.length > 0) {
      if (!hasRole(allowedRoles)) {
        router.replace(unauthorizedRedirectTo);
        return;
      }
    }

    // All checks passed
    setIsAuthorized(true);
  }, [
    isAuthenticated,
    isInitialized,
    allowedRoles,
    hasRole,
    router,
    pathname,
    redirectTo,
    unauthorizedRedirectTo,
  ]);

  // Show loading while checking auth
  if (!isInitialized || !isAuthorized) {
    if (!showLoading) return null;

    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }

    return (
      <div
        id={testId}
        data-testid={testId}
        className="flex align-items-center justify-content-center"
        style={{ minHeight: '100vh' }}
      >
        <LoadingSpinner size="large" message="Verificando acceso..." />
      </div>
    );
  }

  return <>{children}</>;
}
