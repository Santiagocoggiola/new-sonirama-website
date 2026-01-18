'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Timeline } from 'primereact/timeline';
import { Skeleton } from 'primereact/skeleton';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import {
  useGetOrderQuery,
  useConfirmOrderMutation,
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
  const [confirmOrder, { isLoading: isConfirming }] = useConfirmOrderMutation();

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmNote, setConfirmNote] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

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

              {order.discountTotal > 0 && (
                <div className="flex justify-content-between text-green-600">
                  <span>Descuento</span>
                  <span data-testid={`${testId}-discount`}>
                    -{formatPrice(order.discountTotal)}
                  </span>
                </div>
              )}

              {order.userDiscountPercent > 0 && (
                <div className="flex justify-content-between text-color-secondary">
                  <span>Descuento cliente</span>
                  <span data-testid={`${testId}-user-discount`}>
                    {order.userDiscountPercent}%
                  </span>
                </div>
              )}

              {(order.cancellationReason || order.modificationReason || order.rejectionReason || order.adminNotes || order.userNotes) && (
                <div className="flex flex-column gap-2 text-sm surface-50 border-round p-2">
                  {order.cancellationReason && (
                    <div className="flex flex-column">
                      <span className="text-color-secondary">Motivo de cancelación</span>
                      <span>{order.cancellationReason}</span>
                    </div>
                  )}
                  {order.modificationReason && (
                    <div className="flex flex-column">
                      <span className="text-color-secondary">Motivo de modificación</span>
                      <span>{order.modificationReason}</span>
                    </div>
                  )}
                  {order.rejectionReason && (
                    <div className="flex flex-column">
                      <span className="text-color-secondary">Motivo de rechazo</span>
                      <span>{order.rejectionReason}</span>
                    </div>
                  )}
                  {order.adminNotes && (
                    <div className="flex flex-column">
                      <span className="text-color-secondary">Notas admin</span>
                      <span>{order.adminNotes}</span>
                    </div>
                  )}
                  {order.userNotes && (
                    <div className="flex flex-column">
                      <span className="text-color-secondary">Notas del cliente</span>
                      <span>{order.userNotes}</span>
                    </div>
                  )}
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
              onConfirm={async () => {
                setConfirmDialogOpen(true);
              }}
              onAcceptMods={async () => {
                try {
                  await acceptMods({ id: order.id }).unwrap();
                  showToast({ severity: 'success', summary: 'Cambios aceptados' });
                } catch {
                  showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo aceptar los cambios' });
                }
              }}
              onRejectMods={async () => {
                setRejectDialogOpen(true);
              }}
              onCancel={async () => {
                setCancelDialogOpen(true);
              }}
              isConfirming={isConfirming}
              isAccepting={isAccepting}
              isRejecting={isRejecting}
              isCancelling={isCancelling}
            />
          </Card>
        </div>
      </div>

      <Dialog
        header="Confirmar pedido"
        visible={confirmDialogOpen}
        onHide={() => {
          setConfirmDialogOpen(false);
          setConfirmNote('');
        }}
        modal
        className="w-full sm:w-30rem"
        footer={(
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              outlined
              onClick={() => {
                setConfirmDialogOpen(false);
                setConfirmNote('');
              }}
            />
            <Button
              label="Aceptar"
              loading={isConfirming}
              onClick={async () => {
                try {
                  await confirmOrder({ id: order.id, body: confirmNote.trim() ? { note: confirmNote.trim() } : undefined }).unwrap();
                  showToast({ severity: 'success', summary: 'Pedido confirmado' });
                  setConfirmDialogOpen(false);
                  setConfirmNote('');
                } catch {
                  showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo confirmar el pedido' });
                }
              }}
            />
          </div>
        )}
      >
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-confirm-note`} className="text-sm text-color-secondary">
            Nota (opcional)
          </label>
          <InputTextarea
            id={`${testId}-confirm-note`}
            value={confirmNote}
            onChange={(e) => setConfirmNote(e.target.value)}
            autoResize
            rows={3}
          />
        </div>
      </Dialog>

      <Dialog
        header="Rechazar cambios"
        visible={rejectDialogOpen}
        onHide={() => {
          setRejectDialogOpen(false);
          setRejectReason('');
        }}
        modal
        className="w-full sm:w-30rem"
        footer={(
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              outlined
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
              }}
            />
            <Button
              label="Aceptar"
              severity="danger"
              loading={isRejecting}
              onClick={async () => {
                if (!rejectReason.trim()) {
                  showToast({ severity: 'warn', summary: 'Falta motivo', detail: 'Indicá el motivo del rechazo' });
                  return;
                }
                try {
                  await rejectMods({ id: order.id, body: { reason: rejectReason.trim() } }).unwrap();
                  showToast({ severity: 'success', summary: 'Cambios rechazados' });
                  setRejectDialogOpen(false);
                  setRejectReason('');
                } catch {
                  showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo rechazar los cambios' });
                }
              }}
            />
          </div>
        )}
      >
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-reject-reason`} className="text-sm text-color-secondary">
            Motivo
          </label>
          <InputTextarea
            id={`${testId}-reject-reason`}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            autoResize
            rows={3}
          />
        </div>
      </Dialog>

      <Dialog
        header="Cancelar pedido"
        visible={cancelDialogOpen}
        onHide={() => {
          setCancelDialogOpen(false);
          setCancelReason('');
        }}
        modal
        className="w-full sm:w-30rem"
        footer={(
          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancelar"
              outlined
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason('');
              }}
            />
            <Button
              label="Aceptar"
              severity="danger"
              loading={isCancelling}
              onClick={async () => {
                if (!cancelReason.trim()) {
                  showToast({ severity: 'warn', summary: 'Falta motivo', detail: 'Indicá el motivo de la cancelación' });
                  return;
                }
                try {
                  await cancelOrder({ id: order.id, body: { reason: cancelReason.trim() } }).unwrap();
                  showToast({ severity: 'success', summary: 'Pedido cancelado' });
                  setCancelDialogOpen(false);
                  setCancelReason('');
                } catch {
                  showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar el pedido' });
                }
              }}
            />
          </div>
        )}
      >
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-cancel-reason`} className="text-sm text-color-secondary">
            Motivo
          </label>
          <InputTextarea
            id={`${testId}-cancel-reason`}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            autoResize
            rows={3}
          />
        </div>
      </Dialog>
    </div>
  );
}

function OrderActions({
  orderId,
  status,
  onConfirm,
  onAcceptMods,
  onRejectMods,
  onCancel,
  isConfirming,
  isAccepting,
  isRejecting,
  isCancelling,
  testId,
}: {
  orderId: string;
  status: string;
  onConfirm: () => Promise<void>;
  onAcceptMods: () => Promise<void>;
  onRejectMods: () => Promise<void>;
  onCancel: () => Promise<void>;
  isConfirming: boolean;
  isAccepting: boolean;
  isRejecting: boolean;
  isCancelling: boolean;
  testId: string;
}) {
  const isModPending = status === 'ModificationPending';
  const canConfirm = status === 'Approved';
  const canCancel =
    status === 'PendingApproval' || status === 'Approved' || status === 'ModificationPending' || status === 'Confirmed';

  if (!isModPending && !canConfirm && !canCancel) {
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

      {canConfirm && (
        <Button
          id={`${testId}-confirm`}
          data-testid={`${testId}-confirm`}
          label="Confirmar pedido"
          icon="pi pi-check"
          severity="success"
          onClick={onConfirm}
          loading={isConfirming}
        />
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
        className="border-round overflow-hidden flex-shrink-0"
        style={{ width: '80px', height: '80px' }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-full object-cover"
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
            {formatPrice(item.discountPercent > 0 ? item.unitPriceWithDiscount : item.unitPrice)}
          </span>
          {item.discountPercent > 0 && (
            <span className="line-through">{formatPrice(item.unitPrice)}</span>
          )}
          {item.discountPercent > 0 && (
            <span className="text-green-600">-{item.discountPercent}%</span>
          )}
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex align-items-center">
        <span className="font-semibold" data-testid={`${testId}-subtotal`}>
          {formatPrice(item.lineTotal || item.subtotal)}
        </span>
      </div>
    </div>
  );
}
