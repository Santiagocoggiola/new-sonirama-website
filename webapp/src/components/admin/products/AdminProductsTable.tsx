'use client';

import { useState } from 'react';
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
import { useGetProductsQuery, useDeleteProductMutation, useUpdateProductMutation } from '@/store/api/productsApi';
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
  
  const { data, isLoading, isError } = useGetProductsQuery({
    query: searchQuery || undefined,
    pageSize: 50,
  });
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const products = data?.items ?? [];

  const handleCreateProduct = () => {
    router.push('/admin/products/new');
  };

  const handleEditProduct = (product: ProductDto) => {
    router.push(`/admin/products/${product.id}`);
  };

  // Column templates
  const nameTemplate = (product: ProductDto) => (
    <span className="font-medium" data-testid={`${testId}-product-${product.id}-name`}>
      {product.name}
    </span>
  );

  const categoryTemplate = (product: ProductDto) => (
    <span data-testid={`${testId}-product-${product.id}-category`}>
      {product.category || '-'}
    </span>
  );

  const priceTemplate = (product: ProductDto) => (
    <span data-testid={`${testId}-product-${product.id}-price`}>
      {formatPrice(product.price)}
    </span>
  );

  const statusTemplate = (product: ProductDto) => (
    <div className="flex align-items-center gap-2">
      <Tag
        severity={product.isActive ? 'success' : 'danger'}
        value={product.isActive ? 'Activo' : 'Inactivo'}
        data-testid={`${testId}-product-${product.id}-status`}
      />
      <InputSwitch
        checked={product.isActive}
        onChange={async (e) => {
          try {
            await updateProduct({
              id: product.id,
              body: {
                name: product.name,
                description: product.description || undefined,
                price: product.price,
                currency: product.currency,
                category: product.category || undefined,
                isActive: e.value,
              },
            }).unwrap();
            showToast({ severity: 'success', summary: e.value ? 'Producto activado' : 'Producto desactivado' });
          } catch {
            showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el producto' });
          }
        }}
        disabled={isUpdating}
      />
    </div>
  );

  const actionsTemplate = (product: ProductDto) => (
    <div className="flex gap-2">
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
    </div>
  );

  if (isLoading) {
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
      {products.length === 0 ? (
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
          value={products}
          dataKey="id"
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          className="surface-card border-round"
          stripedRows
          scrollable
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
