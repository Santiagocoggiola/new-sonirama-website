import { Suspense } from 'react';
import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { Skeleton } from 'primereact/skeleton';

export const metadata: Metadata = {
  title: 'Iniciar sesión - Sonirama',
  description: 'Ingresá a tu cuenta de Sonirama',
};

function LoginFormSkeleton() {
  return (
    <div className="flex flex-column gap-4">
      <Skeleton width="100%" height="2.5rem" />
      <Skeleton width="100%" height="2.5rem" />
      <div className="flex justify-content-between">
        <Skeleton width="30%" height="1.5rem" />
        <Skeleton width="40%" height="1.5rem" />
      </div>
      <Skeleton width="100%" height="2.5rem" />
    </div>
  );
}

/**
 * Login page
 */
export default function LoginPage() {
  return (
    <div id="login-page" data-testid="login-page">
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm testId="login-form" />
      </Suspense>
    </div>
  );
}
