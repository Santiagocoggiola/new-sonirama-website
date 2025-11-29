'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { useAuth } from '@/hooks/useAuth';

/**
 * Unauthorized access page
 * Shown when user doesn't have permission to access a resource
 */
export default function UnauthorizedPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();

  const handleGoHome = () => {
    router.push('/products');
  };

  const handleGoLogin = () => {
    router.push('/login');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div
      id="unauthorized-page"
      data-testid="unauthorized-page"
      className="flex align-items-center justify-content-center min-h-screen surface-ground"
    >
      <div className="surface-card p-5 border-round shadow-2 text-center" style={{ maxWidth: '400px' }}>
        <i
          className="pi pi-lock text-6xl text-orange-500 mb-4"
          style={{ display: 'block' }}
        />
        <h1 className="text-2xl font-bold text-color m-0 mb-2">
          Acceso no autorizado
        </h1>
        <p className="text-color-secondary mb-4">
          No tenés permisos para acceder a esta página.
        </p>
        
        <div className="flex flex-column gap-2">
          <Button
            label="Ir al inicio"
            icon="pi pi-home"
            onClick={handleGoHome}
            className="w-full"
          />
          {isAuthenticated ? (
            <Button
              label="Cerrar sesión"
              icon="pi pi-sign-out"
              severity="secondary"
              text
              onClick={handleLogout}
              className="w-full"
            />
          ) : (
            <Button
              label="Iniciar sesión"
              icon="pi pi-sign-in"
              severity="secondary"
              text
              onClick={handleGoLogin}
              className="w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
}
