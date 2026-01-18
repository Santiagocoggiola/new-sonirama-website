'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Tag } from 'primereact/tag';
import { InputSwitch } from 'primereact/inputswitch';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useLazyGetProductsQuery, useDeleteProductMutation, useUpdateProductMutation } from '@/store/api/productsApi';
import { formatPrice } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/toast-service';
import type { ProductDto } from '@/types/product';

interface AdminProductsTableProps {
  /** Test ID for Playwright */
  readonly testId?: string;
}

/**
 * Admin products data table
 */
export function AdminProductsTable({ testId = 'admin-products-table' }: AdminProductsTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [productToDelete, setProductToDelete] = useState<ProductDto | null>(null);
  const [items, setItems] = useState<Array<ProductDto | null>>([]);
  const [didLoad, setDidLoad] = useState(false);
  const [rows, setRows] = useState(25);

  const [loadProducts, { isLoading, isFetching, isError }] = useLazyGetProductsQuery();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const ensureItemsLength = useCallback((nextTotal: number) => {
    setItems((prev) => {
      if (prev.length === nextTotal) return prev;
      return Array.from({ length: nextTotal }, (_, idx) => prev[idx] ?? null);
    });
  }, []);

  const loadPage = useCallback(
    async (pageToLoad: number, first: number, pageSize: number) => {
      const result = await loadProducts({
        query: searchQuery || undefined,
        page: pageToLoad,
        pageSize,
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
    [ensureItemsLength, loadProducts, searchQuery]
  );

  const handleCreateProduct = () => {
    router.push('/admin/products/new');
  };

  const handleEditProduct = (product: ProductDto) => {
    router.push(`/admin/products/${product.id}`);
  };

  // Column templates
  const nameTemplate = (product: ProductDto | null) => (
    <span
      className="font-medium"
      data-testid={product ? `${testId}-product-${product.id}-name` : undefined}
    >
      {product?.name || '...'}
    </span>
  );

  const categoryTemplate = (product: ProductDto | null) => (
    <span data-testid={product ? `${testId}-product-${product.id}-category` : undefined}>
      {product?.category || (product ? '-' : '...')}
    </span>
  );

  const priceTemplate = (product: ProductDto | null) => (
    <span data-testid={product ? `${testId}-product-${product.id}-price` : undefined}>
      {product ? formatPrice(product.price) : '...'}
    </span>
  );

  const statusTemplate = (product: ProductDto | null) => (
    <div className="flex align-items-center gap-2">
      {product ? (
        <>
          <Tag
            severity={product.isActive ? 'success' : 'danger'}
            value={product.isActive ? 'Activo' : 'Inactivo'}
            data-testid={`${testId}-product-${product.id}-status`}
          />
          <InputSwitch
            checked={product.isActive}
            onChange={async (e) => {
              const nextValue = e.value;
              setItems((prev) => prev.map((item) => (item?.id === product.id ? { ...item, isActive: nextValue } : item)));
              try {
                await updateProduct({
                  id: product.id,
                  body: {
                    name: product.name,
                    description: product.description || undefined,
                    price: product.price,
                    currency: product.currency,
                    category: product.category || undefined,
                    isActive: nextValue,
                  },
                }).unwrap();
                showToast({ severity: 'success', summary: nextValue ? 'Producto activado' : 'Producto desactivado' });
              } catch {
                setItems((prev) => prev.map((item) => (item?.id === product.id ? { ...item, isActive: product.isActive } : item)));
                showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el producto' });
              }
            }}
            disabled={isUpdating}
          />
        </>
      ) : (
        <span className="text-color-secondary">...</span>
      )}
    </div>
  );

  const actionsTemplate = (product: ProductDto | null) => (
    <div className="flex gap-2">
      {product ? (
        <>
          <Button
            id={`${testId}-product-${product.id}-edit`}
            data-testid={`${testId}-product-${product.id}-edit`}
            icon="pi pi-pencil"
            rounded
            text
            severity="secondary"
            onClick={() => handleEditProduct(product)}
            aria-label="Editar"
            tooltip="Editar"
            tooltipOptions={{ position: 'top' }}
          />
          <Button
            id={`${testId}-product-${product.id}-delete`}
            data-testid={`${testId}-product-${product.id}-delete`}
            icon="pi pi-trash"
            rounded
            text
            severity="danger"
            onClick={() => setProductToDelete(product)}
            aria-label="Eliminar"
            tooltip="Eliminar"
            tooltipOptions={{ position: 'top' }}
          />
        </>
      ) : (
        <span className="text-color-secondary">...</span>
      )}
    </div>
  );

  useEffect(() => {
    setItems([]);
    setDidLoad(false);
    loadPage(1, 0, rows).catch(() => setDidLoad(true));
  }, [loadPage, rows, searchQuery]);

  if (isLoading && !didLoad) {
    return (
      <div
        id={`${testId}-loading`}
        data-testid={`${testId}-loading`}
        className="flex align-items-center justify-content-center py-8"
      >
        <ProgressSpinner
          style={{ width: '50px', height: '50px' }}
          strokeWidth="4"
        />
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
    <div id={testId} data-testid={testId}>
      {/* Header */}
      <div className="flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            id={`${testId}-search`}
            data-testid={`${testId}-search`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos..."
          />
        </IconField>
        <Button
          id={`${testId}-create`}
          data-testid={`${testId}-create`}
          label="Nuevo producto"
          icon="pi pi-plus"
          onClick={handleCreateProduct}
        />
      </div>

      {/* Table */}
      {items.length === 0 && didLoad ? (
        <EmptyState
          testId={`${testId}-empty`}
          icon="pi pi-box"
          title="No hay productos"
          message="Creá tu primer producto para empezar."
          action={{
            label: 'Crear producto',
            onClick: handleCreateProduct,
          }}
        />
      ) : (
        <DataTable
          value={items}
          dataKey="id"
          className="surface-card border-round"
          stripedRows
          scrollable
          lazy
          scrollHeight="600px"
          loading={isFetching}
          virtualScrollerOptions={{
            lazy: true,
            itemSize: 56,
            onLazyLoad: (event) => {
              const first = event.first ?? 0;
              const pageSize = event.rows ?? rows;
              const page = Math.floor(first / pageSize) + 1;
              const isLoaded = items[first] !== null && items[first] !== undefined;
              if (!isLoaded) {
                loadPage(page, first, pageSize).catch(() => undefined);
              }
            },
            showLoader: true,
          }}
        >
          <Column
            field="name"
            header="Nombre"
            body={nameTemplate}
            sortable
          />
          <Column
            field="category"
            header="Categoría"
            body={categoryTemplate}
          />
          <Column
            field="price"
            header="Precio"
            body={priceTemplate}
            sortable
          />
          <Column
            field="isActive"
            header="Estado"
            body={statusTemplate}
          />
          <Column
            header="Acciones"
            body={actionsTemplate}
            style={{ width: '100px' }}
          />
        </DataTable>
      )}

      <Dialog
        header="Confirmar eliminación"
        visible={!!productToDelete}
        onHide={() => setProductToDelete(null)}
        style={{ width: '420px' }}
      >
        <p className="m-0">
          ¿Seguro que querés eliminar el producto "{productToDelete?.name}"?
        </p>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button
            type="button"
            label="Cancelar"
            outlined
            severity="secondary"
            onClick={() => setProductToDelete(null)}
          />
          <Button
            type="button"
            label="Aceptar"
            icon="pi pi-trash"
            severity="danger"
            loading={isDeleting}
            onClick={async () => {
              if (!productToDelete) return;
              try {
                await deleteProduct(productToDelete.id).unwrap();
                setItems((prev) => prev.filter((item) => item?.id !== productToDelete.id));
                showToast({ severity: 'success', summary: 'Producto eliminado' });
              } catch {
                showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto' });
              } finally {
                setProductToDelete(null);
              }
            }}
          />
        </div>
      </Dialog>
    </div>
  );
}
