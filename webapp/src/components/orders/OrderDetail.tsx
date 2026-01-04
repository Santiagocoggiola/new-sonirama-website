'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Timeline } from 'primereact/timeline';
import { Skeleton } from 'primereact/skeleton';
import {
  useGetOrderQuery,
  useAcceptModificationsMutation,
  useRejectModificationsMutation,
  useCancelOrderMutation,
} from '@/store/api/ordersApi';
import { formatPrice, formatDate, formatDateTime, buildAssetUrl } from '@/lib/utils';
import { getOrderStatusLabel, getOrderStatusSeverity } from '@/types/order';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/toast-service';
import type { OrderItemDto } from '@/types/order';

interface OrderDetailProps {
  orderId: string;
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Order detail view component
 */
export function OrderDetail({ orderId, testId = 'order-detail' }: OrderDetailProps) {
  const router = useRouter();
  
  const {
    data: order,
    isLoading,
    isError,
  } = useGetOrderQuery(orderId);

  const [acceptMods, { isLoading: isAccepting }] = useAcceptModificationsMutation();
  const [rejectMods, { isLoading: isRejecting }] = useRejectModificationsMutation();
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();

  const handleGoBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div id={`${testId}-loading`} data-testid={`${testId}-loading`}>
        <Button
          icon="pi pi-arrow-left"
          label="Volver"
          text
          className="mb-4"
          disabled
        />
        <div className="grid">
          <div className="col-12 md:col-8">
            <Skeleton height="300px" className="border-round mb-4" />
          </div>
          <div className="col-12 md:col-4">
            <Skeleton height="200px" className="border-round" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <EmptyState
        testId={`${testId}-error`}
        icon="pi pi-exclamation-circle"
        title="Error"
        message="No se pudo cargar la orden"
        action={{
          label: 'Volver a pedidos',
          onClick: () => router.push('/orders'),
        }}
      />
    );
  }

  // Order status history for timeline
  const statusHistory = [
    {
      status: 'Creado',
      date: order.createdAtUtc,
      icon: 'pi pi-shopping-cart',
      color: '#3B82F6',
    },
    ...(order.statusHistory || []).map((history) => ({
      status: getOrderStatusLabel(history.status),
      date: history.changedAtUtc,
      icon: 'pi pi-check',
      color: '#22C55E',
    })),
  ];

  return (
    <div id={testId} data-testid={testId}>
      {/* Back button */}
      <Button
        id={`${testId}-back`}
        data-testid={`${testId}-back`}
        icon="pi pi-arrow-left"
        label="Volver"
        text
        className="mb-4"
        onClick={handleGoBack}
      />

      {/* Order header */}
      <div className="flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h2
            className="m-0 text-xl font-bold"
            data-testid={`${testId}-number`}
          >
            Orden #{order.orderNumber}
          </h2>
          <span
            className="text-color-secondary"
            data-testid={`${testId}-date`}
          >
            {formatDateTime(order.createdAtUtc)}
          </span>
        </div>
        <Tag
          severity={getOrderStatusSeverity(order.status)}
          value={getOrderStatusLabel(order.status)}
          className="text-base px-3 py-2"
          data-testid={`${testId}-status`}
        />
      </div>

      <div className="grid">
        {/* Order items */}
        <div className="col-12 lg:col-8">
          <Card
            id={`${testId}-items-card`}
            data-testid={`${testId}-items-card`}
            title="Productos"
            className="mb-4"
          >
            <div className="flex flex-column gap-3">
              {order.items.map((item) => (
                <OrderItemRow
                  key={item.productId}
                  item={item}
                  testId={`${testId}-item-${item.productId}`}
                />
              ))}
            </div>
          </Card>

          {/* Status timeline */}
          {statusHistory.length > 1 && (
            <Card
              id={`${testId}-timeline-card`}
              data-testid={`${testId}-timeline-card`}
              title="Historial"
            >
              <Timeline
                value={statusHistory}
                opposite={(item) => formatDate(item.date)}
                content={(item) => (
                  <span className="font-medium">{item.status}</span>
                )}
                marker={(item) => (
                  <span
                    className="flex align-items-center justify-content-center text-white border-circle"
                    style={{
                      width: '2rem',
                      height: '2rem',
                      backgroundColor: item.color,
                    }}
                  >
                    <i className={item.icon} />
                  </span>
                )}
              />
            </Card>
          )}
        </div>

        {/* Order summary */}
        <div className="col-12 lg:col-4">
          <Card
            id={`${testId}-summary`}
            data-testid={`${testId}-summary`}
            title="Resumen"
          >
            <div className="flex flex-column gap-3">
              <div className="flex justify-content-between">
                <span className="text-color-secondary">Subtotal</span>
                <span data-testid={`${testId}-subtotal`}>
                  {formatPrice(order.subtotal)}
                </span>
              </div>

              {order.bulkDiscountAmount > 0 && (
                <div className="flex justify-content-between text-green-600">
                  <span>Descuento</span>
                  <span data-testid={`${testId}-discount`}>
                    -{formatPrice(order.bulkDiscountAmount)}
                  </span>
                </div>
              )}

              <Divider className="my-2" />

              <div className="flex justify-content-between">
                <span className="text-xl font-bold">Total</span>
                <span
                  className="text-xl font-bold text-primary"
                  data-testid={`${testId}-total`}
                >
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </Card>

          {/* User actions */}
          <Card
            id={`${testId}-actions`}
            data-testid={`${testId}-actions`}
            title="Acciones"
            className="mt-4"
          >
            <OrderActions
              orderId={order.id}
              status={order.status}
              testId={`${testId}-actions`}
              onAcceptMods={async () => {
                try {
                  await acceptMods({ id: order.id }).unwrap();
                  showToast({ severity: 'success', summary: 'Cambios aceptados' });
                } catch {
                  showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo aceptar los cambios' });
                }
              }}
              onRejectMods={async () => {
                const reason = prompt('Motivo del rechazo de cambios:');
                if (!reason) return;
                try {
                  await rejectMods({ id: order.id, body: { reason } }).unwrap();
                  showToast({ severity: 'success', summary: 'Cambios rechazados' });
                } catch {
                  showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar los cambios' });
                }
              }}
              onCancel={async () => {
                const reason = prompt('Motivo de cancelación:');
                if (!reason) return;
                try {
                  await cancelOrder({ id: order.id, body: { reason } }).unwrap();
                  showToast({ severity: 'success', summary: 'Pedido cancelado' });
                } catch {
                  showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar el pedido' });
                }
              }}
              isAccepting={isAccepting}
              isRejecting={isRejecting}
              isCancelling={isCancelling}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function OrderActions({
  orderId,
  status,
  onAcceptMods,
  onRejectMods,
  onCancel,
  isAccepting,
  isRejecting,
  isCancelling,
  testId,
}: {
  orderId: string;
  status: string;
  onAcceptMods: () => Promise<void>;
  onRejectMods: () => Promise<void>;
  onCancel: () => Promise<void>;
  isAccepting: boolean;
  isRejecting: boolean;
  isCancelling: boolean;
  testId: string;
}) {
  const isModPending = status === 'ModificationPending';
  const canCancel =
    status === 'PendingApproval' || status === 'Approved' || status === 'ModificationPending' || status === 'Confirmed';

  if (!isModPending && !canCancel) {
    return <p className="text-color-secondary m-0">No hay acciones disponibles para este pedido.</p>;
  }

  return (
    <div className="flex flex-column gap-2">
      {isModPending && (
        <div className="flex flex-wrap gap-2">
          <Button
            id={`${testId}-accept-mods`}
            data-testid={`${testId}-accept-mods`}
            label="Aceptar cambios"
            icon="pi pi-check"
            severity="success"
            onClick={onAcceptMods}
            loading={isAccepting}
          />
          <Button
            id={`${testId}-reject-mods`}
            data-testid={`${testId}-reject-mods`}
            label="Rechazar cambios"
            icon="pi pi-times"
            severity="danger"
            onClick={onRejectMods}
            loading={isRejecting}
            outlined
          />
        </div>
      )}

      {canCancel && (
        <Button
          id={`${testId}-cancel`}
          data-testid={`${testId}-cancel`}
          label="Cancelar pedido"
          icon="pi pi-ban"
          severity="secondary"
          onClick={onCancel}
          loading={isCancelling}
          outlined
        />
      )}
    </div>
  );
}

/**
 * Order item row component
 */
function OrderItemRow({
  item,
  testId,
}: {
  item: OrderItemDto;
  testId: string;
}) {
  const fallbackImage = item.product?.images?.find((img) => img.isPrimary) || item.product?.images?.[0];
  const normalizedItemImage = item.productImageUrl?.replace(/\\/g, '/');
  const normalizedFallback = fallbackImage?.url?.replace(/\\/g, '/');

  const imageUrl = normalizedItemImage
    ? buildAssetUrl(normalizedItemImage)
    : normalizedFallback
      ? buildAssetUrl(normalizedFallback)
      : null;
  const imageAlt = item.productImageAlt || fallbackImage?.altText || item.productName;

  return (
    <div
      id={testId}
      data-testid={testId}
      className="flex gap-3 p-2 border-round surface-50"
    >
      {/* Image */}
      <div
        className="relative border-round overflow-hidden flex-shrink-0"
        style={{ width: '80px', height: '80px' }}
      >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full product-image-placeholder">
              <i className="pi pi-image" />
            </div>
          )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <h4 className="m-0 font-medium text-color" data-testid={`${testId}-name`}>
          {item.productName}
        </h4>
        <span className="text-color-secondary text-sm" data-testid={`${testId}-code`}>
          Código: {item.productCode}
        </span>
        <div className="flex align-items-center gap-2 mt-1 text-color-secondary text-sm">
          <span data-testid={`${testId}-quantity`}>
            Cantidad: {item.quantity}
          </span>
          <span>×</span>
          <span data-testid={`${testId}-price`}>
            {formatPrice(item.unitPrice)}
          </span>
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex align-items-center">
        <span className="font-semibold" data-testid={`${testId}-subtotal`}>
          {formatPrice(item.subtotal)}
        </span>
      </div>
    </div>
  );
}
