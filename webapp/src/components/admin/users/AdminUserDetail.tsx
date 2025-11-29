'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { InputSwitch } from 'primereact/inputswitch';
import { useGetUserByIdQuery, useUpdateUserMutation, useForcePasswordResetMutation } from '@/store/api/usersApi';
import { formatDateTime } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/toast-service';

interface AdminUserDetailProps {
  userId: string;
  testId?: string;
}

export function AdminUserDetail({ userId, testId = 'admin-user-detail' }: AdminUserDetailProps) {
  const router = useRouter();
  const { data: user, isLoading, isError, refetch } = useGetUserByIdQuery(userId);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [forcePasswordReset, { isLoading: isResetting }] = useForcePasswordResetMutation();

  const handleToggleActive = async () => {
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

  const handleForcePasswordReset = async () => {
    try {
      await forcePasswordReset(userId).unwrap();
      showToast({ severity: 'success', summary: 'Restablecimiento enviado', detail: 'Se envió un correo al usuario para restablecer su contraseña' });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar el correo' });
    }
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
            <div className="flex flex-column gap-3">
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
                <span className="text-color-secondary text-sm">Registrado</span>
                <span className="font-medium">{formatDateTime(user.createdAtUtc)}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-12 lg:col-4">
          <Card title="Acciones">
            <div className="flex flex-column gap-3">
              <div className="flex align-items-center justify-content-between">
                <span className="font-medium">Usuario activo</span>
                <InputSwitch checked={user.isActive} onChange={handleToggleActive} disabled={isUpdating} />
              </div>
              <Button label="Forzar cambio de contraseña" icon="pi pi-key" outlined severity="warning" className="w-full" loading={isResetting} onClick={handleForcePasswordReset} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
