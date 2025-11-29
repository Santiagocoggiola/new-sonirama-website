'use client';

import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useGetMyOrdersQuery } from '@/store/api/ordersApi';
import { formatPrice, formatDate } from '@/lib/utils';
import { getOrderStatusLabel, getOrderStatusSeverity } from '@/types/order';
import { EmptyState } from '@/components/ui/EmptyState';
import type { OrderDto } from '@/types/order';

interface OrdersListProps {
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Orders list component for buyers
 */
export function OrdersList({ testId = 'orders-list' }: OrdersListProps) {
  const router = useRouter();
  
  const { data, isLoading, isError } = useGetMyOrdersQuery({
    pageNumber: 1,
    pageSize: 50,
  });

  const orders = data?.items ?? [];

  const handleViewOrder = (order: OrderDto) => {
    router.push(`/orders/${order.id}`);
  };

  // Column templates
  const orderNumberTemplate = (order: OrderDto) => (
    <span
      className="font-medium"
      data-testid={`${testId}-order-${order.id}-number`}
    >
      #{order.orderNumber}
    </span>
  );

  const dateTemplate = (order: OrderDto) => (
    <span data-testid={`${testId}-order-${order.id}-date`}>
      {formatDate(order.createdAtUtc)}
    </span>
  );

  const totalTemplate = (order: OrderDto) => (
    <span
      className="font-semibold"
      data-testid={`${testId}-order-${order.id}-total`}
    >
      {formatPrice(order.total)}
    </span>
  );

  const statusTemplate = (order: OrderDto) => (
    <Tag
      severity={getOrderStatusSeverity(order.status)}
      value={getOrderStatusLabel(order.status)}
      data-testid={`${testId}-order-${order.id}-status`}
    />
  );

  const actionsTemplate = (order: OrderDto) => (
    <Button
      id={`${testId}-order-${order.id}-view`}
      data-testid={`${testId}-order-${order.id}-view`}
      icon="pi pi-eye"
      rounded
      text
      severity="secondary"
      onClick={() => handleViewOrder(order)}
      aria-label="Ver detalle"
      tooltip="Ver detalle"
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
        message="No se pudieron cargar las órdenes"
      />
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        testId={`${testId}-empty`}
        icon="pi pi-shopping-bag"
        title="No tenés pedidos"
        message="Cuando hagas tu primera compra, aparecerá acá."
        action={{
          label: 'Ver productos',
          onClick: () => router.push('/products'),
        }}
      />
    );
  }

  return (
    <div id={testId} data-testid={testId}>
      <DataTable
        value={orders}
        dataKey="id"
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        className="surface-card border-round"
        stripedRows
        responsiveLayout="scroll"
      >
        <Column
          field="orderNumber"
          header="Nº Orden"
          body={orderNumberTemplate}
          sortable
        />
        <Column
          field="createdAtUtc"
          header="Fecha"
          body={dateTemplate}
          sortable
        />
        <Column
          field="total"
          header="Total"
          body={totalTemplate}
          sortable
        />
        <Column
          field="status"
          header="Estado"
          body={statusTemplate}
          sortable
        />
        <Column
          header="Acciones"
          body={actionsTemplate}
          style={{ width: '100px' }}
        />
      </DataTable>
    </div>
  );
}
