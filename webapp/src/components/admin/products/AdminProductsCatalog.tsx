'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { InputSwitch } from 'primereact/inputswitch';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Paginator, PaginatorPageChangeEvent } from 'primereact/paginator';
import { useGetProductsQuery, useUpdateProductMutation } from '@/store/api/productsApi';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';
import { buildAssetUrl, formatPrice, isLocalAssetHost } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProductDto } from '@/types/product';

interface AdminProductsCatalogProps {
  testId?: string;
}

export function AdminProductsCatalog({ testId = 'admin-products-catalog' }: AdminProductsCatalogProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ sortBy: 'CreatedAt' | 'Code' | 'Name' | 'Price'; sortDir: 'ASC' | 'DESC' }>(
    { sortBy: 'CreatedAt', sortDir: 'DESC' }
  );
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(12);

  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoriesQuery({ pageSize: 200, isActive: true });
  const categoryOptions = useMemo(
    () => [
      { label: 'Todas las categorías', value: null },
      ...(categoriesData?.items ?? []).map((cat) => ({ label: cat.name, value: cat.id })),
    ],
    [categoriesData]
  );

  const { data, isLoading, isError, isFetching } = useGetProductsQuery({
    query: search || undefined,
    categoryIds: categoryId ? [categoryId] : undefined,
    page,
    pageSize: rows,
    sortBy: sort.sortBy,
    sortDir: sort.sortDir,
  });

  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const products = data?.items ?? [];
  const total = data?.totalCount ?? 0;

  const handleEdit = useCallback((product: ProductDto) => {
    router.push(`/admin/products/${product.id}`);
  }, [router]);

  const handlePage = useCallback((event: { page: number; rows: number }) => {
    setRows(event.rows);
    setPage(event.page + 1);
  }, []);

  const handleToggleActive = useCallback(async (product: ProductDto, value: boolean) => {
    try {
      await updateProduct({
        id: product.id,
        body: {
          name: product.name,
          description: product.description || undefined,
          price: product.price,
          currency: product.currency,
          category: product.category || undefined,
          isActive: value,
        },
      }).unwrap();
    } catch {
      // toast handled globally? keep silent here
    }
  }, [updateProduct]);

  const itemTemplate = useCallback((product: ProductDto) => {
    if (!product) return null;
    const imageSrc = buildAssetUrl(product.images?.[0]?.url);

    return (
      <div className="admin-card-wrapper">
        <Card
          className="h-full shadow-2 border-round-lg overflow-hidden"
          pt={{ content: { className: 'p-0' } }}
        >
          <div className="product-admin-card">
            <div className="product-admin-card__image">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={product.name}
                  width={700}
                  height={600}
                  unoptimized={isLocalAssetHost}
                  className="product-admin-card__img"
                  sizes="(max-width: 768px) 100vw, 400px"
                  style={{ objectFit: 'contain' }}
                />
              ) : (
                <div className="product-image-placeholder"><i className="pi pi-image" /></div>
              )}
              <div className="product-admin-card__badges">
                <Tag value={`Código ${product.code}`} severity="secondary" className="text-xs" />
                <Tag value={product.isActive ? 'Activo' : 'Inactivo'} severity={product.isActive ? 'success' : 'danger'} />
              </div>
            </div>

            <div className="p-3 flex flex-column gap-2">
              <h3 className="m-0 text-base font-semibold line-clamp-2">{product.name}</h3>
              <span className="text-color-secondary text-sm">{product.category || 'Sin categoría'}</span>
              <span className="text-2xl font-bold text-primary">{formatPrice(product.price)}</span>

              <div className="product-admin-card__footer">
                <div className="flex align-items-center gap-2 text-sm text-color-secondary">
                  <span>Visible</span>
                  <InputSwitch
                    inputId={`toggle-${product.id}`}
                    checked={product.isActive}
                    onChange={(e) => handleToggleActive(product, e.value)}
                    disabled={isUpdating}
                  />
                </div>
                <Button
                  type="button"
                  label="Editar"
                  icon="pi pi-pencil"
                  size="small"
                  className="product-admin-card__edit"
                  onClick={() => handleEdit(product)}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }, [handleEdit, handleToggleActive, isUpdating]);

  if (isLoading && !data) {
    return (
      <div className="flex align-items-center justify-content-center py-6" data-testid={`${testId}-loading`}>
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="4" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        testId={`${testId}-error`}
        icon="pi pi-exclamation-circle"
        title="Error"
        message="No se pudieron cargar los productos"
      />
    );
  }

  return (
    <div id={testId} data-testid={testId} className="admin-products-page">
      <div className="admin-header">
        <div className="flex align-items-center justify-content-between gap-3 flex-wrap">
          <div className="flex flex-column">
            <p className="m-0 text-sm text-color-secondary">Catálogo</p>
            <h2 className="m-0 text-2xl font-bold">Productos</h2>
          </div>
          <Button label="Nuevo producto" icon="pi pi-plus" onClick={() => router.push('/admin/products/new')} />
        </div>
      </div>

      <main className="admin-main">
        <Card className="shadow-1 admin-filters" pt={{ content: { className: 'p-3' } }}>
          <div className="filters-grid">
            <div className="flex flex-column gap-2">
              <label className="font-medium">Buscar</label>
              <InputText
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Nombre o código"
                data-testid={`${testId}-search`}
              />
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-medium">Categoría</label>
              <Dropdown
                value={categoryId}
                options={categoryOptions}
                onChange={(e) => { setCategoryId(e.value); setPage(1); }}
                placeholder="Todas"
                loading={isLoadingCategories}
                className="w-full"
                data-testid={`${testId}-category`}
              />
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-medium">Ordenar por</label>
              <Dropdown
                value={sort}
                options={[
                  { label: 'Más recientes', value: { sortBy: 'CreatedAt', sortDir: 'DESC' as const } },
                  { label: 'Precio: menor a mayor', value: { sortBy: 'Price', sortDir: 'ASC' as const } },
                  { label: 'Precio: mayor a menor', value: { sortBy: 'Price', sortDir: 'DESC' as const } },
                  { label: 'Nombre A-Z', value: { sortBy: 'Name', sortDir: 'ASC' as const } },
                  { label: 'Nombre Z-A', value: { sortBy: 'Name', sortDir: 'DESC' as const } },
                  { label: 'Código', value: { sortBy: 'Code', sortDir: 'ASC' as const } },
                ]}
                optionLabel="label"
                onChange={(e) => { setSort(e.value); setPage(1); }}
                className="w-full"
                data-testid={`${testId}-sort`}
              />
            </div>

            <div className="flex align-items-end">
              <Button
                type="button"
                label="Limpiar"
                icon="pi pi-filter-slash"
                outlined
                severity="secondary"
                className="w-full"
                onClick={() => { setSearch(''); setCategoryId(null); setSort({ sortBy: 'CreatedAt', sortDir: 'DESC' }); setPage(1); }}
                data-testid={`${testId}-clear`}
              />
            </div>
          </div>
        </Card>

        {products.length === 0 ? (
          <EmptyState
            testId={`${testId}-empty`}
            icon="pi pi-box"
            title="No hay productos"
            message="Crea tu primer producto o ajusta los filtros."
            action={{ label: 'Nuevo producto', onClick: () => router.push('/admin/products/new') }}
          />
        ) : (
          <>
            <div className="admin-grid" data-testid={`${testId}-grid`}>
              {products.map((product) => itemTemplate(product))}
            </div>
            <div className="flex justify-content-end mt-3">
              <Paginator
                first={(page - 1) * rows}
                rows={rows}
                totalRecords={total}
                rowsPerPageOptions={[12, 24, 48]}
                onPageChange={(e: PaginatorPageChangeEvent) => handlePage({ page: e.page, rows: e.rows })}
                template="PrevPageLink PageLinks NextPageLink RowsPerPageDropdown"
              />
            </div>
          </>
        )}
      </main>

      <style jsx>{`
        .admin-products-page {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
        }

        .admin-header {
          width: 100%;
        }

        .admin-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          width: 100%;
          min-width: 0;
        }

        .admin-filters {
          width: 100%;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          align-items: end;
        }

        .admin-grid {
          display: grid;
          width: 100%;
          grid-template-columns: repeat(auto-fit, minmax(320px, 420px));
          gap: 1.5rem;
        }

        .product-admin-card {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .admin-card-wrapper {
          width: 100%;
          max-width: 420px;
          margin: 0;
        }
        .product-admin-card__image {
          position: relative;
          width: 100%;
          height: 280px;
          max-height: 320px;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: var(--surface-50);
        }
        .product-admin-card__img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }
        .product-admin-card__badges {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .product-admin-card__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-top: 0.75rem;
        }
        .product-admin-card__edit {
          min-width: 7rem;
        }
        .product-image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-color-secondary);
          background: var(--surface-100);
        }

        @media (max-width: 960px) {
          .admin-shell {
            flex-direction: column;
          }

          .admin-sidebar {
            position: static;
            width: 100%;
            margin-left: 0;
            margin-top: 0;
          }
        }
      `}</style>
    </div>
  );
}
