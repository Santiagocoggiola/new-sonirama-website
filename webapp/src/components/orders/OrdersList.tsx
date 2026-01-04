'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { useGetMyOrdersQuery } from '@/store/api/ordersApi';
import { formatPrice, formatDate } from '@/lib/utils';
import { getOrderStatusLabel, getOrderStatusSeverity } from '@/types/order';
import { EmptyState } from '@/components/ui/EmptyState';
import type { OrderStatus, OrderSummaryDto } from '@/types/order';

interface OrdersListProps {
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Orders list component for buyers
 */
export function OrdersList({ testId = 'orders-list' }: OrdersListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null] | null>(null);
  const [specificDate, setSpecificDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);

  const createdFromUtc = useMemo(() => {
    if (specificDate) {
      const start = new Date(specificDate);
      start.setHours(0, 0, 0, 0);
      return start.toISOString();
    }
    if (dateRange?.[0]) {
      const start = new Date(dateRange[0]);
      start.setHours(0, 0, 0, 0);
      return start.toISOString();
    }
    return undefined;
  }, [specificDate, dateRange]);

  const createdToUtc = useMemo(() => {
    if (specificDate) {
      const end = new Date(specificDate);
      end.setHours(23, 59, 59, 999);
      return end.toISOString();
    }
    if (dateRange?.[1]) {
      const end = new Date(dateRange[1]);
      end.setHours(23, 59, 59, 999);
      return end.toISOString();
    }
    return undefined;
  }, [specificDate, dateRange]);

  const { data, isLoading, isError, isFetching } = useGetMyOrdersQuery({
    page,
    pageSize: rows,
    query: searchQuery || undefined,
    status: status || undefined,
    createdFromUtc,
    createdToUtc,
    sortBy: 'CreatedAt',
    sortDir: 'DESC',
  });

  const orders = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;

  const orderStatusOptions: { label: string; value: OrderStatus | '' }[] = [
    { label: 'Todos', value: '' },
    { label: getOrderStatusLabel('PendingApproval'), value: 'PendingApproval' },
    { label: getOrderStatusLabel('Approved'), value: 'Approved' },
    { label: getOrderStatusLabel('Rejected'), value: 'Rejected' },
    { label: getOrderStatusLabel('ModificationPending'), value: 'ModificationPending' },
    { label: getOrderStatusLabel('Confirmed'), value: 'Confirmed' },
    { label: getOrderStatusLabel('ReadyForPickup'), value: 'ReadyForPickup' },
    { label: getOrderStatusLabel('Completed'), value: 'Completed' },
    { label: getOrderStatusLabel('Cancelled'), value: 'Cancelled' },
  ];

  const handleViewOrder = (order: OrderDto) => {
    router.push(`/orders/${order.id}`);
  };

  // Column templates
  const orderNumberTemplate = (order: OrderSummaryDto) => (
    <span
      className="font-medium"
      data-testid={`${testId}-order-${order.id}-number`}
    >
      #{order.orderNumber || order.number}
    </span>
  );

  const dateTemplate = (order: OrderSummaryDto) => (
    <span data-testid={`${testId}-order-${order.id}-date`}>
      {formatDate(order.createdAtUtc)}
    </span>
  );

  const totalTemplate = (order: OrderSummaryDto) => (
    <span
      className="font-semibold"
      data-testid={`${testId}-order-${order.id}-total`}
    >
      {formatPrice(order.total)}
    </span>
  );

  const statusTemplate = (order: OrderSummaryDto) => (
    <Tag
      severity={getOrderStatusSeverity(order.status)}
      value={getOrderStatusLabel(order.status)}
      data-testid={`${testId}-order-${order.id}-status`}
    />
  );

  const actionsTemplate = (order: OrderSummaryDto) => (
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

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatus('');
    setDateRange(null);
    setSpecificDate(null);
    setPage(1);
  }, []);

  const handlePage = useCallback((event: { first: number; rows: number; page: number }) => {
    setRows(event.rows);
    setPage(event.page + 1);
  }, []);

  if (isLoading && !data) {
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
      <div className="flex flex-column gap-3 mb-4">
        <div className="flex flex-wrap gap-3 align-items-center">
          <InputText
            id={`${testId}-search`}
            data-testid={`${testId}-search`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por número o texto"
            className="w-full sm:w-20rem"
          />

          <Dropdown
            id={`${testId}-status`}
            data-testid={`${testId}-status`}
            value={status}
            options={orderStatusOptions}
            onChange={(e) => {
              setStatus(e.value as OrderStatus | '');
              setPage(1);
            }}
            placeholder="Estado"
            className="w-full sm:w-14rem"
            showClear
          />

          <Calendar
            id={`${testId}-date`}
            data-testid={`${testId}-date`}
            value={specificDate as Date | null}
            onChange={(e) => {
              setSpecificDate(e.value as Date | null);
              setDateRange(null);
              setPage(1);
            }}
            showIcon
            placeholder="Fecha específica"
            dateFormat="dd/mm/yy"
            className="w-full sm:w-13rem"
          />

          <Calendar
            id={`${testId}-date-range`}
            data-testid={`${testId}-date-range`}
            value={dateRange as unknown as Date[]}
            onChange={(e) => {
              setDateRange(e.value as [Date | null, Date | null] | null);
              setSpecificDate(null);
              setPage(1);
            }}
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
            onClick={handleClearFilters}
          />
        </div>
      </div>

      <DataTable
        value={orders}
        dataKey="id"
        paginator
        lazy
        first={(page - 1) * rows}
        rows={rows}
        totalRecords={totalCount}
        onPage={handlePage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
        className="surface-card border-round"
        stripedRows
        responsiveLayout="scroll"
        loading={isFetching && !!data}
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
