'use client';

import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useGetOrdersQuery } from '@/store/api/ordersApi';
import { formatPrice, formatDate } from '@/lib/utils';
import { getOrderStatusLabel, getOrderStatusSeverity } from '@/types/order';
import { EmptyState } from '@/components/ui/EmptyState';
import type { OrderSummaryDto } from '@/types/order';

interface AdminOrdersTableProps {
  testId?: string;
}

export function AdminOrdersTable({ testId = 'admin-orders-table' }: AdminOrdersTableProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useGetOrdersQuery({ pageSize: 50 });
  const orders = data?.items ?? [];

  const handleViewOrder = (order: OrderSummaryDto) => {
    router.push(`/admin/orders/${order.id}`);
  };

  const numberTemplate = (order: OrderSummaryDto) => (
    <span className="font-medium">#{order.number}</span>
  );

  const dateTemplate = (order: OrderSummaryDto) => formatDate(order.createdAtUtc);

  const totalTemplate = (order: OrderSummaryDto) => (
    <span className="font-semibold">{formatPrice(order.total)}</span>
  );

  const statusTemplate = (order: OrderSummaryDto) => (
    <Tag severity={getOrderStatusSeverity(order.status)} value={getOrderStatusLabel(order.status)} />
  );

  const actionsTemplate = (order: OrderSummaryDto) => (
    <Button icon="pi pi-eye" rounded text severity="secondary" onClick={() => handleViewOrder(order)} tooltip="Ver detalle" tooltipOptions={{ position: 'top' }} />
  );

  if (isLoading) {
    return <div className="flex justify-content-center py-8"><ProgressSpinner /></div>;
  }

  if (isError) {
    return <EmptyState testId={`${testId}-error`} icon="pi pi-exclamation-circle" title="Error" message="No se pudieron cargar las órdenes" />;
  }

  if (orders.length === 0) {
    return <EmptyState testId={`${testId}-empty`} icon="pi pi-shopping-cart" title="No hay órdenes" message="Las órdenes de los clientes aparecerán acá." />;
  }

  return (
    <div id={testId} data-testid={testId}>
      <DataTable value={orders} dataKey="id" paginator rows={10} rowsPerPageOptions={[10, 25, 50]} className="surface-card border-round" stripedRows responsiveLayout="scroll">
        <Column field="number" header="Nº Orden" body={numberTemplate} sortable />
        <Column field="createdAtUtc" header="Fecha" body={dateTemplate} sortable />
        <Column field="total" header="Total" body={totalTemplate} sortable />
        <Column field="status" header="Estado" body={statusTemplate} sortable />
        <Column header="Acciones" body={actionsTemplate} style={{ width: '100px' }} />
      </DataTable>
    </div>
  );
}
