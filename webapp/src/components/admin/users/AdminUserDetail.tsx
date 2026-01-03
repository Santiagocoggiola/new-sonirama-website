'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { InputSwitch } from 'primereact/inputswitch';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useGetUserByIdQuery, useUpdateUserMutation, useForcePasswordResetMutation, useDeleteUserMutation } from '@/store/api/usersApi';
import { formatDateTime } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/toast-service';

interface AdminUserDetailProps {
  userId: string;
  testId?: string;
}

export function AdminUserDetail({ userId, testId = 'admin-user-detail' }: AdminUserDetailProps) {
  const router = useRouter();
  const [confirmState, setConfirmState] = useState<{ action: 'toggle' | 'reset' | 'delete'; message: string } | null>(null);
  const { data: user, isLoading, isError, refetch } = useGetUserByIdQuery(userId);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [forcePasswordReset, { isLoading: isResetting }] = useForcePasswordResetMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'USER' as UserDto['role'],
  });

  useEffect(() => {
    if (user) {
      setFormValues({
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        phoneNumber: user.phoneNumber ?? '',
        role: user.role,
      });
    }
  }, [user]);

  const performToggleActive = async () => {
    if (!user) return;
    try {
      await updateUser({
        id: userId,
        body: {
          firstName: user.firstName ?? '',
          lastName: user.lastName ?? '',
          phoneNumber: user.phoneNumber ?? undefined,
          role: user.role,
          isActive: !user.isActive,
        },
      }).unwrap();
      showToast({ severity: 'success', summary: user.isActive ? 'Usuario desactivado' : 'Usuario activado' });
      refetch();
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario' });
    }
  };

  const performForcePasswordReset = async () => {
    try {
      await forcePasswordReset(userId).unwrap();
      showToast({ severity: 'success', summary: 'Restablecimiento enviado', detail: 'Se envió un correo al usuario para restablecer su contraseña' });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el correo' });
    }
  };

  const performDelete = async () => {
    try {
      await deleteUser(userId).unwrap();
      showToast({ severity: 'success', summary: 'Usuario eliminado' });
      router.push('/admin/users');
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario' });
    }
  };

  const resetForm = () => {
    if (!user) return;
    setFormValues({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phoneNumber: user.phoneNumber ?? '',
      role: user.role,
    });
  };

  const handleCancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    try {
      await updateUser({
        id: userId,
        body: {
          firstName: formValues.firstName.trim(),
          lastName: formValues.lastName.trim(),
          phoneNumber: formValues.phoneNumber?.trim() || undefined,
          role: formValues.role,
          isActive: user.isActive,
        },
      }).unwrap();
      showToast({ severity: 'success', summary: 'Usuario actualizado' });
      setIsEditing(false);
      refetch();
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario' });
    }
  };

  const handleConfirm = async () => {
    const action = confirmState?.action;
    setConfirmState(null);
    if (action === 'toggle') await performToggleActive();
    if (action === 'reset') await performForcePasswordReset();
    if (action === 'delete') await performDelete();
  };

  if (isLoading) {
    return <Skeleton height="300px" className="border-round" />;
  }

  if (isError || !user) {
    return <EmptyState testId={`${testId}-error`} icon="pi pi-exclamation-circle" title="Error" message="No se pudo cargar el usuario" action={{ label: 'Volver', onClick: () => router.push('/admin/users') }} />;
  }

  return (
    <div id={testId} data-testid={testId}>
      <Button icon="pi pi-arrow-left" label="Volver" text className="mb-4" onClick={() => router.back()} />

      <div className="flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="m-0 text-xl font-bold">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}</h2>
          <span className="text-color-secondary">{user.email}</span>
        </div>
        <div className="flex gap-2">
          <Tag severity={user.role === 'ADMIN' ? 'warning' : 'info'} value={user.role === 'ADMIN' ? 'Admin' : 'Usuario'} />
          <Tag severity={user.isActive ? 'success' : 'danger'} value={user.isActive ? 'Activo' : 'Inactivo'} />
        </div>
      </div>

      <div className="grid">
        <div className="col-12 lg:col-8">
          <Card title="Información">
            {isEditing ? (
              <div className="flex flex-column gap-3">
                <div className="flex flex-column gap-1">
                  <span className="text-color-secondary text-sm">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="grid">
                  <div className="col-12 md:col-6 flex flex-column gap-1">
                    <span className="text-color-secondary text-sm">Nombre</span>
                    <InputText
                      value={formValues.firstName}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div className="col-12 md:col-6 flex flex-column gap-1">
                    <span className="text-color-secondary text-sm">Apellido</span>
                    <InputText
                      value={formValues.lastName}
                      onChange={(e) => setFormValues((prev) => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex flex-column gap-1">
                  <span className="text-color-secondary text-sm">Teléfono</span>
                  <InputText
                    value={formValues.phoneNumber}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </div>
                <div className="flex flex-column gap-1">
                  <span className="text-color-secondary text-sm">Rol</span>
                  <Dropdown
                    value={formValues.role}
                    options={[
                      { label: 'Usuario', value: 'USER' },
                      { label: 'Admin', value: 'ADMIN' },
                    ]}
                    onChange={(e) => setFormValues((prev) => ({ ...prev, role: e.value }))}
                  />
                </div>
                <div className="flex flex-column gap-1">
                  <span className="text-color-secondary text-sm">Registrado</span>
                  <span className="font-medium">{formatDateTime(user.createdAtUtc)}</span>
                </div>
                <div className="flex justify-content-end gap-2 mt-2">
                  <Button type="button" label="Cancelar" outlined severity="secondary" onClick={handleCancelEdit} disabled={isUpdating} />
                  <Button type="button" label="Guardar" icon="pi pi-save" onClick={handleSaveEdit} loading={isUpdating} />
                </div>
              </div>
            ) : (
              <div className="flex flex-column gap-3">
                <div className="flex justify-content-end">
                  <Button type="button" label="Editar" icon="pi pi-pencil" text onClick={() => setIsEditing(true)} />
                </div>
                <div className="flex flex-column gap-1">
                  <span className="text-color-secondary text-sm">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex flex-column gap-1">
                  <span className="text-color-secondary text-sm">Nombre</span>
                  <span className="font-medium">{user.firstName || '-'}</span>
                </div>
                <div className="flex flex-column gap-1">
                  <span className="text-color-secondary text-sm">Apellido</span>
                  <span className="font-medium">{user.lastName || '-'}</span>
                </div>
                <div className="flex flex-column gap-1">
                  <span className="text-color-secondary text-sm">Teléfono</span>
                  <span className="font-medium">{user.phoneNumber || '-'}</span>
                </div>
                <div className="flex flex-column gap-1">
                  <span className="text-color-secondary text-sm">Rol</span>
                  <span className="font-medium">{user.role === 'ADMIN' ? 'Admin' : 'Usuario'}</span>
                </div>
                <div className="flex flex-column gap-1">
                  <span className="text-color-secondary text-sm">Registrado</span>
                  <span className="font-medium">{formatDateTime(user.createdAtUtc)}</span>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div className="col-12 lg:col-4">
          <Card title="Acciones">
            <div className="flex flex-column gap-3">
              <div className="flex align-items-center justify-content-between">
                <span className="font-medium">Usuario activo</span>
                <InputSwitch
                  checked={user.isActive}
                  onChange={() => setConfirmState({
                    action: 'toggle',
                    message: user.isActive
                      ? '¿Seguro que querés desactivar este usuario?'
                      : '¿Seguro que querés activar este usuario?',
                  })}
                  disabled={isUpdating}
                />
              </div>
              <Button
                label="Forzar cambio de contraseña"
                icon="pi pi-key"
                outlined
                severity="warning"
                className="w-full"
                loading={isResetting}
                onClick={() => setConfirmState({ action: 'reset', message: '¿Enviar un email para que el usuario cambie su contraseña?' })}
              />
              <Button
                label="Eliminar usuario"
                icon="pi pi-trash"
                severity="danger"
                className="w-full"
                loading={isDeleting}
                onClick={() => setConfirmState({ action: 'delete', message: '¿Seguro que querés eliminar este usuario?' })}
              />
            </div>
          </Card>
        </div>
      </div>

      <Dialog
        header="Confirmar acción"
        visible={!!confirmState}
        onHide={() => setConfirmState(null)}
        style={{ width: '420px' }}
      >
        <p className="m-0">{confirmState?.message}</p>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button type="button" label="Cancelar" outlined severity="secondary" onClick={() => setConfirmState(null)} />
          <Button type="button" label="Aceptar" icon="pi pi-check" severity="primary" onClick={handleConfirm} />
        </div>
      </Dialog>
    </div>
  );
}
