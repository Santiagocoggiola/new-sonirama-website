'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null] | null>(null);

  const createdFromUtc = dateRange?.[0]
    ? (() => {
        const start = new Date(dateRange[0]);
        start.setHours(0, 0, 0, 0);
        return start.toISOString();
      })()
    : undefined;

  const createdToUtc = dateRange?.[1]
    ? (() => {
        const end = new Date(dateRange[1]);
        end.setHours(23, 59, 59, 999);
        return end.toISOString();
      })()
    : undefined;

  const { data, isLoading, isError } = useGetOrdersQuery({
    pageSize: 50,
    query: searchQuery || undefined,
    createdFromUtc,
    createdToUtc,
  });
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

  return (
    <div id={testId} data-testid={testId}>
      <div className="flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
        <InputText
          id={`${testId}-search`}
          data-testid={`${testId}-search`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar órdenes..."
          className="w-full sm:w-20rem"
        />
        <Calendar
          id={`${testId}-date-range`}
          data-testid={`${testId}-date-range`}
          value={dateRange as unknown as Date[]}
          onChange={(e) => setDateRange(e.value as [Date | null, Date | null] | null)}
          selectionMode="range"
          showIcon
          placeholder="Rango de fechas"
          className="w-full sm:w-18rem"
          dateFormat="dd/mm/yy"
        />
        <Button
          type="button"
          label="Limpiar filtros"
          icon="pi pi-filter-slash"
          outlined
          severity="secondary"
          data-testid={`${testId}-clear-filters`}
          onClick={() => {
            setSearchQuery('');
            setDateRange(null);
          }}
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          testId={`${testId}-empty`}
          icon="pi pi-shopping-cart"
          title="No hay órdenes"
          message="Las órdenes de los clientes aparecerán acá."
        />
      ) : (
        <DataTable value={orders} dataKey="id" paginator rows={10} rowsPerPageOptions={[10, 25, 50]} className="surface-card border-round" stripedRows responsiveLayout="scroll">
          <Column field="number" header="Nº Orden" body={numberTemplate} sortable />
          <Column field="createdAtUtc" header="Fecha" body={dateTemplate} sortable />
          <Column field="total" header="Total" body={totalTemplate} sortable />
          <Column field="status" header="Estado" body={statusTemplate} sortable />
          <Column header="Acciones" body={actionsTemplate} style={{ width: '100px' }} />
        </DataTable>
      )}
    </div>
  );
}
