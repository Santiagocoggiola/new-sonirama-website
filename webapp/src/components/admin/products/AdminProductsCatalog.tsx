'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { InputSwitch } from 'primereact/inputswitch';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Dialog } from 'primereact/dialog';
import { VirtualScroller, type VirtualScrollerLazyEvent } from 'primereact/virtualscroller';
import { useLazyGetProductsQuery, useUpdateProductMutation, useDeleteProductMutation } from '@/store/api/productsApi';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';
import { buildAssetUrl, formatPrice, isLocalAssetHost } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProductDto } from '@/types/product';

interface AdminProductsCatalogProps {
  testId?: string;
}

export function AdminProductsCatalog({ testId = 'admin-products-catalog' }: Readonly<AdminProductsCatalogProps>) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<{ sortBy: 'CreatedAt' | 'Code' | 'Name' | 'Price'; sortDir: 'ASC' | 'DESC' }>(
    { sortBy: 'CreatedAt', sortDir: 'DESC' }
  );
  const [rows, setRows] = useState(12);
  const [items, setItems] = useState<Array<ProductDto | null>>([]);
  const [didLoad, setDidLoad] = useState(false);
  const [columns, setColumns] = useState(3);
  const [productToDelete, setProductToDelete] = useState<ProductDto | null>(null);

  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoriesQuery({ pageSize: 200, isActive: true });
  const categoryOptions = useMemo(
    () => [
      { label: 'Todas las categorías', value: null },
      ...(categoriesData?.items ?? []).map((cat) => ({ label: cat.name, value: cat.id })),
    ],
    [categoriesData]
  );

  const [loadProducts, { isLoading, isFetching, isError }] = useLazyGetProductsQuery();

  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const ensureItemsLength = useCallback((nextTotal: number) => {
    setItems((prev) => {
      if (prev.length === nextTotal) return prev;
      return Array.from({ length: nextTotal }, (_, idx) => prev[idx] ?? null);
    });
  }, []);

  const loadPage = useCallback(
    async (pageToLoad: number, first: number, pageSize: number) => {
      const result = await loadProducts({
        query: search || undefined,
        categoryIds: categoryId ? [categoryId] : undefined,
        page: pageToLoad,
        pageSize,
        sortBy: sort.sortBy,
        sortDir: sort.sortDir,
      }).unwrap();

      setRows(result.pageSize);
      ensureItemsLength(result.totalCount);
      setItems((prev) => {
        const next = prev.length === result.totalCount ? [...prev] : Array(result.totalCount).fill(null);
        result.items.forEach((item, index) => {
          next[first + index] = item;
        });
        return next;
      });
      setDidLoad(true);
    },
    [categoryId, ensureItemsLength, loadProducts, search, sort.sortBy, sort.sortDir]
  );

  const handleEdit = useCallback((product: ProductDto) => {
    router.push(`/admin/products/${product.id}`);
  }, [router]);


  const handleToggleActive = useCallback(async (product: ProductDto, value: boolean) => {
    setItems((prev) => prev.map((item) => (item?.id === product.id ? { ...item, isActive: value } : item)));
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
      setItems((prev) => prev.map((item) => (item?.id === product.id ? { ...item, isActive: product.isActive } : item)));
      // toast handled globally? keep silent here
    }
  }, [updateProduct]);

  const itemTemplate = useCallback((product: ProductDto, index: number) => {
    if (!product) return null;
    const imageSrc = buildAssetUrl(product.images?.[0]?.url);
    const isAboveTheFold = index < 3;
    const categories = product.categories && product.categories.length > 0
      ? product.categories.map((cat) => cat.name)
      : product.category && !/^[0-9a-fA-F-]{36}$/.test(product.category)
        ? [product.category]
        : [];

    return (
      <div className="admin-card-wrapper" key={product.id}>
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
                  unoptimized={isLocalAssetHost}
                  className="product-admin-card__img"
                  sizes="(max-width: 768px) 100vw, 400px"
                  fill
                  loading={isAboveTheFold ? 'eager' : 'lazy'}
                  fetchPriority={isAboveTheFold ? 'high' : 'auto'}
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
              {categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Tag key={`${product.id}-${category}`} value={category} severity="info" className="text-xs" />
                  ))}
                </div>
              ) : (
                <span className="text-color-secondary text-sm">Sin categoría</span>
              )}
              {product.description && (
                <p className="m-0 text-color-secondary text-sm line-clamp-2">
                  {product.description}
                </p>
              )}
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
                  <div className="flex align-items-center gap-2">
                    <Button
                      type="button"
                      label="Editar"
                      icon="pi pi-pencil"
                      size="small"
                      className="product-admin-card__edit"
                      onClick={() => handleEdit(product)}
                    />
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      text
                      severity="danger"
                      onClick={() => setProductToDelete(product)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }, [handleEdit, handleToggleActive, isUpdating]);

  useEffect(() => {
    setItems([]);
    setDidLoad(false);
    loadPage(1, 0, rows).catch(() => setDidLoad(true));
  }, [categoryId, loadPage, rows, search, sort.sortBy, sort.sortDir]);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setColumns(1);
      } else if (width < 960) {
        setColumns(2);
      } else if (width < 1280) {
        setColumns(3);
      } else {
        setColumns(4);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  if (isLoading && !didLoad) {
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
              <label className="font-medium" htmlFor={`${testId}-search-input`}>Buscar</label>
              <InputText
                id={`${testId}-search-input`}
                value={search}
                onChange={(e) => { setSearch(e.target.value); }}
                placeholder="Nombre o código"
                data-testid={`${testId}-search`}
              />
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-medium" htmlFor={`${testId}-category-input`}>Categoría</label>
              <Dropdown
                value={categoryId}
                options={categoryOptions}
                onChange={(e) => { setCategoryId(e.value); }}
                placeholder="Todas"
                loading={isLoadingCategories}
                className="w-full"
                inputId={`${testId}-category-input`}
                data-testid={`${testId}-category`}
              />
            </div>

            <div className="flex flex-column gap-2">
              <label className="font-medium" htmlFor={`${testId}-sort-input`}>Ordenar por</label>
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
                onChange={(e) => { setSort(e.value); }}
                className="w-full"
                inputId={`${testId}-sort-input`}
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
                onClick={() => { setSearch(''); setCategoryId(null); setSort({ sortBy: 'CreatedAt', sortDir: 'DESC' }); }}
                data-testid={`${testId}-clear`}
              />
            </div>
          </div>
        </Card>

        {items.length === 0 && didLoad ? (
          <EmptyState
            testId={`${testId}-empty`}
            icon="pi pi-box"
            title="No hay productos"
            message="Crea tu primer producto o ajusta los filtros."
            action={{ label: 'Nuevo producto', onClick: () => router.push('/admin/products/new') }}
          />
        ) : (
          <>
            <div
              className="admin-virtual-grid"
              style={{ ['--grid-columns' as string]: String(columns) }}
            >
              <VirtualScroller
                id={`${testId}-grid`}
                data-testid={`${testId}-grid`}
                items={items}
                itemSize={340}
                lazy
                onLazyLoad={(event: VirtualScrollerLazyEvent) => {
                  const first = event.first ?? 0;
                  const pageSize = event.rows ?? rows;
                  const page = Math.floor(first / pageSize) + 1;
                  const isLoaded = items[first] !== null && items[first] !== undefined;
                  if (!isLoaded) {
                    loadPage(page, first, pageSize).catch(() => undefined);
                  }
                }}
                className="w-full admin-virtual-grid__scroller"
                style={{ height: '70vh' }}
                itemTemplate={(product, options) => {
                  if (!product) {
                    return (
                      <div className="admin-card-wrapper">
                        <Card className="h-full shadow-2 border-round-lg overflow-hidden" pt={{ content: { className: 'p-4' } }}>
                          <div className="product-image-placeholder" style={{ height: 200, borderRadius: '10px' }} />
                          <div className="mt-3 h-1rem surface-200 border-round" />
                          <div className="mt-2 h-1rem surface-200 border-round w-6" />
                        </Card>
                      </div>
                    );
                  }

                  return itemTemplate(product, options.index);
                }}
              />
            </div>

            {isFetching && didLoad && (
              <div className="flex align-items-center justify-content-center py-4" data-testid={`${testId}-loading-more`}>
                <ProgressSpinner style={{ width: '30px', height: '30px' }} strokeWidth="4" />
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        .admin-virtual-grid__scroller .p-virtualscroller-content {
          display: grid;
          grid-template-columns: repeat(var(--grid-columns), minmax(320px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }
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
          height: auto;
          min-height: 240px;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: var(--surface-50);
        }
        .product-admin-card__img {
          object-fit: contain;
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
          flex-wrap: wrap;
          margin-top: 0.75rem;
        }
        .product-admin-card__edit {
          min-width: 7rem;
        }

        @media (max-width: 420px) {
          .product-admin-card__edit {
            width: 100%;
          }
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

      <Dialog
        header="Eliminar producto"
        visible={!!productToDelete}
        onHide={() => setProductToDelete(null)}
        modal
        className="w-full sm:w-26rem"
        footer={(
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined onClick={() => setProductToDelete(null)} />
            <Button
              label="Aceptar"
              severity="danger"
              loading={isDeleting}
              onClick={async () => {
                if (!productToDelete) return;
                try {
                  await deleteProduct(productToDelete.id).unwrap();
                  setItems((prev) => prev.filter((item) => item?.id !== productToDelete.id));
                  setDidLoad(false);
                  await loadPage(1, 0, rows);
                } finally {
                  setProductToDelete(null);
                }
              }}
            />
          </div>
        )}
      >
        <p className="m-0">¿Seguro que querés eliminar el producto "{productToDelete?.name}"?</p>
      </Dialog>
    </div>
  );
}
