'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Menu } from 'primereact/menu';
import { Tooltip } from 'primereact/tooltip';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import type { MenuItem } from 'primereact/menuitem';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectFilters, setQuery, setSort, setCategoryIds, setPriceRange, clearFilters } from '@/store/slices/filtersSlice';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';

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
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const isCatalogPreview = pathname.startsWith('/admin/products/catalog');

  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoriesQuery({ pageSize: 200, isActive: true });
  const categoryOptions = [
    { label: 'Todas las categorías', value: null },
    ...(categoriesData?.items ?? []).map((cat) => ({ label: cat.name, value: cat.id })),
  ];

  const sortOptions = [
    { label: 'Más recientes', value: { sortBy: 'CreatedAt', sortDir: 'DESC' as const } },
    { label: 'Precio: menor a mayor', value: { sortBy: 'Price', sortDir: 'ASC' as const } },
    { label: 'Precio: mayor a menor', value: { sortBy: 'Price', sortDir: 'DESC' as const } },
    { label: 'Nombre A-Z', value: { sortBy: 'Name', sortDir: 'ASC' as const } },
    { label: 'Nombre Z-A', value: { sortBy: 'Name', sortDir: 'DESC' as const } },
    { label: 'Código', value: { sortBy: 'Code', sortDir: 'ASC' as const } },
  ];

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
        <div className="px-3 py-2 flex-grow-1 flex flex-column">
          <Menu
            id={`${testId}-menu`}
            data-testid={`${testId}-menu`}
            model={menuItems}
            className="w-full border-none bg-transparent"
          />

          {isCatalogPreview && (
            <div className="mt-3 border-top-1 surface-border pt-3">
              <div className="flex flex-column gap-3">
                <span className="font-semibold text-color">Filtros</span>

                <div className="flex flex-column gap-2">
                  <label className="text-sm">Buscar</label>
                  <InputText
                    value={filters.query}
                    onChange={(e) => dispatch(setQuery(e.target.value))}
                    placeholder="Nombre o código"
                  />
                </div>

                <div className="flex flex-column gap-2">
                  <label className="text-sm">Categoría</label>
                  <Dropdown
                    value={filters.categoryIds[0] ?? null}
                    options={categoryOptions}
                    onChange={(e) => dispatch(setCategoryIds(e.value ? [e.value] : []))}
                    placeholder="Todas"
                    loading={isLoadingCategories}
                    className="w-full"
                  />
                </div>

                <div className="flex flex-column gap-2">
                  <label className="text-sm">Precio</label>
                  <div className="flex gap-2">
                    <InputNumber
                      value={filters.priceMin}
                      onValueChange={(e) => dispatch(setPriceRange({ min: e.value ?? null, max: filters.priceMax }))}
                      mode="currency"
                      currency="ARS"
                      locale="es-AR"
                      placeholder="Mín"
                      className="w-full"
                      inputClassName="w-full"
                    />
                    <InputNumber
                      value={filters.priceMax}
                      onValueChange={(e) => dispatch(setPriceRange({ min: filters.priceMin, max: e.value ?? null }))}
                      mode="currency"
                      currency="ARS"
                      locale="es-AR"
                      placeholder="Máx"
                      className="w-full"
                      inputClassName="w-full"
                    />
                  </div>
                </div>

                <div className="flex flex-column gap-2">
                  <label className="text-sm">Ordenar por</label>
                  <Dropdown
                    value={{ sortBy: filters.sortBy, sortDir: filters.sortDir }}
                    options={sortOptions}
                    optionLabel="label"
                    onChange={(e) => dispatch(setSort(e.value))}
                    className="w-full"
                  />
                </div>

                <Button
                  type="button"
                  label="Limpiar filtros"
                  icon="pi pi-filter-slash"
                  outlined
                  severity="secondary"
                  onClick={() => dispatch(clearFilters())}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
