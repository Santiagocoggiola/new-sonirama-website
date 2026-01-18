'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Divider } from 'primereact/divider';
import { Skeleton } from 'primereact/skeleton';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import {
  useGetOrderByIdQuery,
  useApproveOrderMutation,
  useMarkOrderReadyMutation,
  useCompleteOrderMutation,
  useModifyOrderMutation,
  useCancelOrderAdminMutation,
} from '@/store/api/ordersApi';
import { formatPrice, formatDateTime, buildAssetUrl } from '@/lib/utils';
import { getOrderStatusLabel, getOrderStatusSeverity } from '@/types/order';
import type { OrderItemDto } from '@/types/order';
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
  const [markReady, { isLoading: isMarkingReady }] = useMarkOrderReadyMutation();
  const [completeOrder, { isLoading: isCompleting }] = useCompleteOrderMutation();
  const [modifyOrder, { isLoading: isModifying }] = useModifyOrderMutation();
  const [cancelOrderAdmin, { isLoading: isCancelling }] = useCancelOrderAdminMutation();

  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [draftItems, setDraftItems] = useState<OrderItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const pageSize = 10;

  const resetDraft = useCallback(() => {
    if (!order) return;
    setReason('');
    setAdminNotes('');
    setDraftItems(order.items.map((item) => ({ ...item })));
    setPage(1);
  }, [order]);

  useEffect(() => {
    if (order) {
      resetDraft();
    }
  }, [order, resetDraft]);

  const handleApprove = async () => {
    try {
      await approveOrder({ id: orderId }).unwrap();
      showToast({ severity: 'success', summary: 'Orden aprobada' });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo aprobar la orden' });
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

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      showToast({ severity: 'warn', summary: 'Falta motivo', detail: 'Indicá el motivo de la cancelación' });
      return;
    }

    try {
      await cancelOrderAdmin({ id: orderId, body: { reason: cancelReason.trim() } }).unwrap();
      showToast({ severity: 'success', summary: 'Orden cancelada' });
      setIsCancelDialogOpen(false);
      setCancelReason('');
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo cancelar la orden' });
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
  const canModify = order.status === 'PendingApproval';
  const canCancel = order.status !== 'Cancelled';

  const handleSaveModifications = async () => {
    if (!reason.trim()) {
      showToast({ severity: 'warn', summary: 'Falta motivo', detail: 'Indicá el motivo de la modificación' });
      return;
    }

    try {
      await modifyOrder({
        id: orderId,
        body: {
          reason: reason.trim(),
          adminNotes: adminNotes.trim() || undefined,
          items: draftItems.map((i) => ({ productId: i.productId, newQuantity: i.quantity })),
        },
      }).unwrap();
      showToast({ severity: 'success', summary: 'Pedido modificado' });
      setIsEditing(false);
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo modificar el pedido' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(draftItems.length / pageSize));
  const pagedItems = draftItems.slice((page - 1) * pageSize, page * pageSize);
  const editingMode = isEditing && canModify;
  const itemsToRender = editingMode ? pagedItems : order.items;

  return (
    <>
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
            <Card className="mb-4">
              <div className="flex justify-content-between align-items-center mb-3">
                <h3 className="m-0 text-lg font-bold">Productos</h3>
                {canModify && (
                  <Button
                    label={editingMode ? 'Ocultar edición' : 'Modificar'}
                    icon={editingMode ? 'pi pi-eye-slash' : 'pi pi-pencil'}
                    outlined
                    size="small"
                    severity={editingMode ? 'secondary' : 'info'}
                    onClick={() => {
                      if (editingMode) {
                        resetDraft();
                        setIsEditing(false);
                      } else {
                        setIsEditing(true);
                      }
                    }}
                  />
                )}
              </div>
              <div className="flex flex-column gap-2">
                {itemsToRender.map((item, idx) => {
                  const fallbackImage = item.product?.images?.find((img) => img.isPrimary) ?? item.product?.images?.[0];
                  const imageUrl = item.productImageUrl
                    ? buildAssetUrl(item.productImageUrl)
                    : fallbackImage?.url
                      ? buildAssetUrl(fallbackImage.url)
                      : null;
                  const imageAlt = item.productImageAlt || fallbackImage?.altText || item.productName;

                  return (
                    <div key={`${item.productId}-${idx}`} className="flex justify-content-between align-items-center gap-3 p-2 surface-50 border-round">
                      <div className="flex align-items-center gap-3">
                        {imageUrl ? (
                          <img src={imageUrl} alt={imageAlt} className="w-4rem h-4rem border-round object-cover" />
                        ) : (
                          <div className="w-4rem h-4rem border-round surface-200 flex align-items-center justify-content-center text-color-secondary text-sm">Sin imagen</div>
                        )}
                        <div className="flex flex-column">
                          <span className="font-medium">{item.productName}</span>
                          <span className="text-color-secondary">Código: {item.productCode || item.productId}</span>
                        </div>
                      </div>
                      {editingMode ? (
                        <div className="flex align-items-center gap-2">
                          <span className="text-color-secondary">Qty</span>
                          <InputNumber
                            value={item.quantity}
                            onValueChange={(e) => {
                              const val = Number(e.value ?? 0);
                              const pageIndex = (page - 1) * pageSize + idx;
                              setDraftItems((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, quantity: val < 0 ? 0 : val } : p)));
                            }}
                            min={0}
                            showButtons
                            buttonLayout="horizontal"
                            decrementButtonClassName="p-button-text"
                            incrementButtonClassName="p-button-text"
                            decrementButtonIcon="pi pi-minus"
                            incrementButtonIcon="pi pi-plus"
                            data-testid={`${testId}-modify-qty-${item.productId}`}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-column align-items-end">
                          <span className="text-sm text-color-secondary">Cant: {item.quantity}</span>
                          <span className="font-semibold">{formatPrice(item.lineTotal || item.subtotal)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {editingMode && totalPages > 1 && (
                <div className="flex justify-content-end gap-2 mt-3">
                  <Button text disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    Anterior
                  </Button>
                  <span className="text-sm text-color-secondary">Página {page} de {totalPages}</span>
                  <Button text disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                    Siguiente
                  </Button>
                </div>
              )}
            </Card>

            {/* Admin actions */}
            <Card title="Acciones">
              <div className="flex flex-column gap-3">
                {editingMode && (
                  <div className="flex flex-column gap-2">
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-column gap-1">
                        <span className="text-sm text-color-secondary">Motivo *</span>
                        <InputText
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Ej: Stock insuficiente"
                          data-testid={`${testId}-modify-reason`}
                        />
                      </div>
                      <div className="flex-1 flex flex-column gap-1">
                        <span className="text-sm text-color-secondary">Notas admin (opcional)</span>
                        <InputText
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Notas internas"
                          data-testid={`${testId}-modify-notes`}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        label="Guardar cambios"
                        icon="pi pi-save"
                        loading={isModifying}
                        onClick={handleSaveModifications}
                        severity="secondary"
                      />
                      <Button
                        label="Reiniciar cambios"
                        text
                        onClick={resetDraft}
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {canApprove && (
                    <Button label="Aprobar" icon="pi pi-check" severity="success" loading={isApproving} onClick={handleApprove} />
                  )}
                  {canMarkReady && (
                    <Button label="Marcar lista para retiro" icon="pi pi-box" loading={isMarkingReady} onClick={handleMarkReady} />
                  )}
                  {canComplete && (
                    <Button label="Completar entrega" icon="pi pi-check-circle" severity="success" loading={isCompleting} onClick={handleComplete} />
                  )}
                  <Button
                    label="Cancelar"
                    icon="pi pi-ban"
                    severity="danger"
                    loading={isCancelling}
                    disabled={!canCancel}
                    onClick={() => setIsCancelDialogOpen(true)}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="col-12 lg:col-4">
            <Card title="Contacto" className="mb-4">
              <div className="flex flex-column gap-2">
                <div className="flex justify-content-between">
                  <span className="text-color-secondary">Teléfono</span>
                  <span>{order.userPhoneNumber || 'No informado'}</span>
                </div>
              </div>
            </Card>
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
                  <span className="text-xl font-bold text-primary">{formatPrice(order.total)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        header="Motivo de cancelación"
        visible={isCancelDialogOpen}
        onHide={() => {
          setIsCancelDialogOpen(false);
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
                setIsCancelDialogOpen(false);
                setCancelReason('');
              }}
            />
            <Button
              label="Aceptar"
              severity="danger"
              loading={isCancelling}
              onClick={handleCancelOrder}
            />
          </div>
        )}
      >
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-cancel-reason`} className="text-sm text-color-secondary">
            Motivo
          </label>
          <InputText
            id={`${testId}-cancel-reason`}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ej: Stock insuficiente"
            autoFocus
          />
        </div>
      </Dialog>
    </>
  );
}
