'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Skeleton } from 'primereact/skeleton';
import { useGetOrderByIdQuery, useApproveOrderMutation, useRejectOrderMutation, useMarkOrderReadyMutation, useCompleteOrderMutation } from '@/store/api/ordersApi';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { getOrderStatusLabel, getOrderStatusSeverity } from '@/types/order';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/toast-service';

interface AdminOrderDetailProps {
  orderId: string;
  testId?: string;
}

export function AdminOrderDetail({ orderId, testId = 'admin-order-detail' }: AdminOrderDetailProps) {
  const router = useRouter();
  const { data: order, isLoading, isError } = useGetOrderByIdQuery(orderId);
  const [approveOrder, { isLoading: isApproving }] = useApproveOrderMutation();
  const [rejectOrder, { isLoading: isRejecting }] = useRejectOrderMutation();
  const [markReady, { isLoading: isMarkingReady }] = useMarkOrderReadyMutation();
  const [completeOrder, { isLoading: isCompleting }] = useCompleteOrderMutation();

  const handleApprove = async () => {
    try {
      await approveOrder({ id: orderId }).unwrap();
      showToast({ severity: 'success', summary: 'Orden aprobada' });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo aprobar la orden' });
    }
  };

  const handleReject = async () => {
    const reason = prompt('Motivo del rechazo:');
    if (reason) {
      try {
        await rejectOrder({ id: orderId, body: { reason } }).unwrap();
        showToast({ severity: 'success', summary: 'Orden rechazada' });
      } catch {
        showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar la orden' });
      }
    }
  };

  const handleMarkReady = async () => {
    try {
      await markReady({ id: orderId }).unwrap();
      showToast({ severity: 'success', summary: 'Orden lista para retiro' });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la orden' });
    }
  };

  const handleComplete = async () => {
    try {
      await completeOrder({ id: orderId }).unwrap();
      showToast({ severity: 'success', summary: 'Orden completada' });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo completar la orden' });
    }
  };

  if (isLoading) {
    return <Skeleton height="400px" className="border-round" />;
  }

  if (isError || !order) {
    return <EmptyState testId={`${testId}-error`} icon="pi pi-exclamation-circle" title="Error" message="No se pudo cargar la orden" action={{ label: 'Volver', onClick: () => router.push('/admin/orders') }} />;
  }

  const canApprove = order.status === 'PendingApproval';
  const canMarkReady = order.status === 'Approved' || order.status === 'Confirmed';
  const canComplete = order.status === 'ReadyForPickup';

  return (
    <div id={testId} data-testid={testId}>
      <Button icon="pi pi-arrow-left" label="Volver" text className="mb-4" onClick={() => router.back()} />

      <div className="flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="m-0 text-xl font-bold">Orden #{order.number || order.orderNumber}</h2>
          <span className="text-color-secondary">{formatDateTime(order.createdAtUtc)}</span>
        </div>
        <Tag severity={getOrderStatusSeverity(order.status)} value={getOrderStatusLabel(order.status)} className="text-base px-3 py-2" />
      </div>

      <div className="grid">
        <div className="col-12 lg:col-8">
          <Card title="Productos" className="mb-4">
            <div className="flex flex-column gap-2">
              {order.items.map((item) => (
                <div key={item.productId} className="flex justify-content-between p-2 surface-50 border-round">
                  <div>
                    <span className="font-medium">{item.productName}</span>
                    <span className="text-color-secondary ml-2">x{item.quantity}</span>
                  </div>
                  <span className="font-semibold">{formatPrice(item.lineTotal || item.subtotal)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Admin actions */}
          <Card title="Acciones">
            <div className="flex flex-wrap gap-2">
              {canApprove && (
                <>
                  <Button label="Aprobar" icon="pi pi-check" severity="success" loading={isApproving} onClick={handleApprove} />
                  <Button label="Rechazar" icon="pi pi-times" severity="danger" loading={isRejecting} onClick={handleReject} />
                </>
              )}
              {canMarkReady && (
                <Button label="Marcar lista para retiro" icon="pi pi-box" loading={isMarkingReady} onClick={handleMarkReady} />
              )}
              {canComplete && (
                <Button label="Completar entrega" icon="pi pi-check-circle" severity="success" loading={isCompleting} onClick={handleComplete} />
              )}
              {!canApprove && !canMarkReady && !canComplete && (
                <p className="text-color-secondary m-0">No hay acciones disponibles para esta orden.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="col-12 lg:col-4">
          <Card title="Resumen">
            <div className="flex flex-column gap-3">
              <div className="flex justify-content-between">
                <span className="text-color-secondary">Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {(order.discountTotal > 0 || order.bulkDiscountAmount > 0) && (
                <div className="flex justify-content-between text-green-600">
                  <span>Descuento</span>
                  <span>-{formatPrice(order.discountTotal || order.bulkDiscountAmount)}</span>
                </div>
              )}
              <Divider className="my-2" />
              <div className="flex justify-content-between">
                <span className="text-xl font-bold">Total</span>
                <span className="text-xl font-bold text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
