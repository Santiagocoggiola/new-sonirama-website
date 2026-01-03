'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Menu } from 'primereact/menu';
import { Tooltip } from 'primereact/tooltip';
import type { MenuItem } from 'primereact/menuitem';

interface AdminSidebarProps {
  /** Whether sidebar is collapsed */
  readonly collapsed?: boolean;
  /** Test ID for Playwright */
  readonly testId?: string;
}

interface NavItem {
  label: string;
  icon: string;
  path: string;
}

/**
 * Admin navigation sidebar
 */
export function AdminSidebar({
  collapsed = false,
  testId = 'admin-sidebar',
}: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  const navItems: NavItem[] = [
    { label: 'Productos', icon: 'pi pi-box', path: '/admin/products' },
    { label: 'Catálogo (vista cliente)', icon: 'pi pi-eye', path: '/admin/products/catalog' },
    { label: 'Categorías', icon: 'pi pi-tags', path: '/admin/categories' },
    { label: 'Órdenes', icon: 'pi pi-shopping-cart', path: '/admin/orders' },
    { label: 'Usuarios', icon: 'pi pi-users', path: '/admin/users' },
  ];

  const secondaryItems: NavItem[] = [
    { label: 'Mi perfil', icon: 'pi pi-user', path: '/admin/profile' },
  ];

  const menuItems: MenuItem[] = [
    ...navItems.map(item => ({
      label: item.label,
      icon: item.icon,
      className: isActive(item.path) ? 'surface-100' : '',
      command: () => router.push(item.path),
    })),
    { separator: true },
    ...secondaryItems.map(item => ({
      label: item.label,
      icon: item.icon,
      className: isActive(item.path) ? 'surface-100' : '',
      command: () => router.push(item.path),
    })),
  ];

  const renderCollapsedItem = (item: NavItem) => {
    const active = isActive(item.path);
    return (
      <button
        key={item.path}
        onClick={() => router.push(item.path)}
        className={`nav-icon-btn w-full border-none cursor-pointer flex align-items-center justify-content-center border-round-lg transition-colors transition-duration-150 ${
          active 
            ? 'bg-primary text-primary-contrast' 
            : 'surface-card text-color-secondary hover:surface-hover hover:text-color'
        }`}
        style={{ height: '44px' }}
        data-pr-tooltip={item.label}
        data-pr-position="right"
      >
        <i className={`${item.icon} text-lg`} />
      </button>
    );
  };

  return (
    <aside
      id={testId}
      data-testid={testId}
      className="surface-card border-right-1 surface-border flex flex-column flex-shrink-0"
      style={{
        width: collapsed ? '64px' : 'var(--sidebar-width)',
        transition: 'width 0.2s ease',
        minWidth: collapsed ? '64px' : 'var(--sidebar-width)',
        height: 'calc(100vh - var(--header-height))',
        position: 'sticky',
        top: 'var(--header-height)',
        overflowY: 'auto',
      }}
    >
      {collapsed ? (
        <>
          <Tooltip target=".nav-icon-btn" />
          <nav className="flex flex-column gap-1 p-2 flex-grow-1">
            {navItems.map(renderCollapsedItem)}
          </nav>
          <div className="border-top-1 surface-border p-2">
            {secondaryItems.map(renderCollapsedItem)}
          </div>
        </>
      ) : (
        <div className="px-3 py-2 flex-grow-1">
          <Menu
            id={`${testId}-menu`}
            data-testid={`${testId}-menu`}
            model={menuItems}
            className="w-full border-none bg-transparent"
          />
        </div>
      )}
    </aside>
  );
}
