'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';
import { useRef } from 'react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

interface NavbarProps {
  /** Whether to show the sidebar toggle button (for admin) */
  readonly showSidebarToggle?: boolean;
  /** Callback when sidebar toggle is clicked */
  readonly onSidebarToggle?: () => void;
  /** Test ID for Playwright */
  readonly testId?: string;
}

/**
 * Main navigation bar component
 */
export function Navbar({
  showSidebarToggle = false,
  onSidebarToggle,
  testId = 'navbar',
}: NavbarProps) {
  const router = useRouter();
  const { user, logout, isAdmin, isInitialized } = useAuth();
  const { itemCount } = useCart();
  const userMenuRef = useRef<Menu>(null);

  const userMenuItems = [
    // Orders/history entry
    {
      label: isAdmin ? 'Órdenes (admin)' : 'Mis pedidos',
      icon: 'pi pi-list',
      command: () => router.push(isAdmin ? '/admin/orders' : '/orders'),
    },
    {
      separator: true,
    },
    {
      label: 'Mi perfil',
      icon: 'pi pi-user',
      command: () => router.push(isAdmin ? '/admin/profile' : '/profile'),
    },
    {
      separator: true,
    },
    {
      label: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      command: () => logout(),
    },
  ];

  // Don't render user-specific content until auth is initialized
  const showUserContent = isInitialized;

  return (
    <header
      id={testId}
      data-testid={testId}
      className="surface-card border-bottom-1 surface-border fixed top-0 left-0 right-0"
      style={{
        height: 'var(--header-height)',
        zIndex: 1000,
      }}
    >
      <div className="flex align-items-center justify-content-between h-full px-3 md:px-4">
        {/* Left section */}
        <div className="flex align-items-center gap-3">
          {showSidebarToggle && (
            <Button
              id={`${testId}-sidebar-toggle`}
              data-testid={`${testId}-sidebar-toggle`}
              icon="pi pi-bars"
              text
              rounded
              severity="secondary"
              onClick={onSidebarToggle}
              aria-label="Toggle sidebar"
            />
          )}
          <Logo
            href={isAdmin ? '/admin/products' : '/products'}
            testId={`${testId}-logo`}
          />
        </div>

        {/* Right section - only show when auth is initialized */}
        {showUserContent && (
          <div className="flex align-items-center gap-2">
            {/* Cart button (not for admin) */}
            {!isAdmin && (
              <Link href="/cart" className="no-underline">
                <Button
                  id={`${testId}-cart`}
                  data-testid={`${testId}-cart`}
                  icon="pi pi-shopping-cart"
                  text
                  rounded
                  severity="secondary"
                  aria-label="Carrito"
                  className="p-overlay-badge"
                >
                  {itemCount > 0 && (
                    <Badge
                      value={itemCount > 99 ? '99+' : itemCount}
                      severity="danger"
                      data-testid={`${testId}-cart-badge`}
                    />
                  )}
                </Button>
              </Link>
            )}

            {/* Notifications */}
            <NotificationBell testId={`${testId}-notifications`} />

            {/* Theme toggle */}
            <ThemeToggle testId={`${testId}-theme-toggle`} />

            {/* User menu */}
            <Menu
              ref={userMenuRef}
              model={userMenuItems}
              popup
              id={`${testId}-user-menu-popup`}
              data-testid={`${testId}-user-menu-popup`}
            />
            <Button
              id={`${testId}-user-menu`}
              data-testid={`${testId}-user-menu`}
              text
              rounded
              onClick={(e) => userMenuRef.current?.toggle(e)}
              aria-haspopup
              aria-controls={`${testId}-user-menu-popup`}
              className="p-button-secondary"
            >
              <div className="flex align-items-center gap-2">
                <span
                  className="flex align-items-center justify-content-center border-circle bg-primary text-white font-bold"
                  style={{ width: '32px', height: '32px', fontSize: '14px' }}
                  data-testid={`${testId}-user-avatar`}
                >
                  {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </span>
                <span className="hidden md:block text-color">
                  {user?.firstName || user?.email?.split('@')[0] || 'Usuario'}
                </span>
                <i className="pi pi-chevron-down text-xs text-color-secondary" />
              </div>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
