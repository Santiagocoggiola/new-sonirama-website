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
import { ProgressSpinner } from 'primereact/progressspinner';
import { useGetProductsQuery } from '@/store/api/productsApi';
import { formatPrice } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
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
  
  const { data, isLoading, isError } = useGetProductsQuery({
    query: searchQuery || undefined,
    pageSize: 50,
  });

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
    <Tag
      severity={product.isActive ? 'success' : 'danger'}
      value={product.isActive ? 'Activo' : 'Inactivo'}
      data-testid={`${testId}-product-${product.id}-status`}
    />
  );

  const actionsTemplate = (product: ProductDto) => (
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
    </div>
  );
}
