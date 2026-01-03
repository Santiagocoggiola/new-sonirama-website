'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputSwitch } from 'primereact/inputswitch';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '@/store/api/usersApi';
import { userCreateSchema, type UserCreateFormValues } from '@/schemas/user.schema';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { showToast } from '@/components/ui/toast-service';
import type { UserDto } from '@/types/user';

interface AdminUsersTableProps {
  testId?: string;
}

export function AdminUsersTable({ testId = 'admin-users-table' }: AdminUsersTableProps) {
  const router = useRouter();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, isError } = useGetUsersQuery({ pageSize: 50, query: searchQuery || undefined });
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();
  const users = data?.items ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserCreateFormValues>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'USER',
    },
  });

  const openDialog = () => {
    reset({ email: '', firstName: '', lastName: '', phoneNumber: '', role: 'USER' });
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    reset({ email: '', firstName: '', lastName: '', phoneNumber: '', role: 'USER' });
  };

  const onSubmit = async (data: UserCreateFormValues) => {
    try {
      await createUser({
        email: data.email.trim(),
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phoneNumber: data.phoneNumber?.trim() || undefined,
        role: data.role,
      }).unwrap();
      showToast({ severity: 'success', summary: 'Usuario creado', detail: 'El usuario fue creado correctamente' });
      closeDialog();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'data' in error
        ? (error.data as { message?: string })?.message || 'Error al crear el usuario'
        : 'Error al crear el usuario';
      showToast({ severity: 'error', summary: 'Error', detail: errorMessage });
    }
  };

  const handleEditUser = (user: UserDto) => {
    router.push(`/admin/users/${user.id}`);
  };

  const nameTemplate = (user: UserDto) => (
    <span className="font-medium">
      {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
    </span>
  );

  const roleTemplate = (user: UserDto) => (
    <Tag severity={user.role === 'ADMIN' ? 'warning' : 'info'} value={user.role === 'ADMIN' ? 'Admin' : 'Usuario'} />
  );

  const statusTemplate = (user: UserDto) => (
    <div className="flex align-items-center gap-2">
      <Tag severity={user.isActive ? 'success' : 'danger'} value={user.isActive ? 'Activo' : 'Inactivo'} />
      <InputSwitch
        checked={user.isActive}
        disabled={isUpdating}
        onChange={async (e) => {
          try {
            await updateUser({
              id: user.id,
              body: {
                firstName: user.firstName ?? '',
                lastName: user.lastName ?? '',
                phoneNumber: user.phoneNumber ?? undefined,
                role: user.role,
                isActive: e.value,
              },
            }).unwrap();
            showToast({ severity: 'success', summary: e.value ? 'Usuario activado' : 'Usuario desactivado' });
          } catch {
            showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario' });
          }
        }}
      />
    </div>
  );

  const dateTemplate = (user: UserDto) => formatDate(user.createdAtUtc);

  const actionsTemplate = (user: UserDto) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="secondary"
        onClick={() => handleEditUser(user)}
        tooltip="Editar"
        tooltipOptions={{ position: 'top' }}
      />
      <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => setUserToDelete(user)} tooltip="Eliminar" tooltipOptions={{ position: 'top' }} />
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-content-center py-8"><ProgressSpinner /></div>;
  }

  if (isError) {
    return <EmptyState testId={`${testId}-error`} icon="pi pi-exclamation-circle" title="Error" message="No se pudieron cargar los usuarios" />;
  }
  return (
    <div id={testId} data-testid={testId}>
      <div className="flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
        <InputText
          id={`${testId}-search`}
          data-testid={`${testId}-search`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar usuarios..."
          className="w-full sm:w-20rem"
        />
        <Button label="Nuevo usuario" icon="pi pi-plus" onClick={openDialog} data-testid={`${testId}-create`} />
      </div>

      {users.length === 0 ? (
        <EmptyState
          testId={`${testId}-empty`}
          icon="pi pi-users"
          title="No hay usuarios"
          message="Los usuarios aparecerán acá."
          action={{ label: 'Crear usuario', onClick: openDialog }}
        />
      ) : (
        <DataTable value={users} dataKey="id" paginator rows={10} rowsPerPageOptions={[10, 25, 50]} className="surface-card border-round" stripedRows responsiveLayout="scroll">
          <Column field="email" header="Email" sortable />
          <Column header="Nombre" body={nameTemplate} />
          <Column field="role" header="Rol" body={roleTemplate} />
          <Column field="isActive" header="Estado" body={statusTemplate} />
          <Column field="createdAtUtc" header="Registro" body={dateTemplate} sortable />
          <Column header="Acciones" body={actionsTemplate} style={{ width: '100px' }} />
        </DataTable>
      )}

      <Dialog header="Nuevo usuario" visible={dialogVisible} onHide={closeDialog} style={{ width: '480px' }}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-column gap-3">
          <div className="flex flex-column gap-2">
            <label htmlFor="user-email" className="font-medium">Email *</label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="user-email"
                  className={`w-full ${errors.email ? 'p-invalid' : ''}`}
                />
              )}
            />
            {errors.email && <small className="p-error">{errors.email.message}</small>}
          </div>

          <div className="grid">
            <div className="col-12 md:col-6 flex flex-column gap-2">
              <label htmlFor="user-firstName" className="font-medium">Nombre *</label>
              <Controller
                name="firstName"
                control={control}
                render={({ field }) => (
                  <InputText
                    {...field}
                    id="user-firstName"
                    className={`w-full ${errors.firstName ? 'p-invalid' : ''}`}
                  />
                )}
              />
              {errors.firstName && <small className="p-error">{errors.firstName.message}</small>}
            </div>
            <div className="col-12 md:col-6 flex flex-column gap-2">
              <label htmlFor="user-lastName" className="font-medium">Apellido *</label>
              <Controller
                name="lastName"
                control={control}
                render={({ field }) => (
                  <InputText
                    {...field}
                    id="user-lastName"
                    className={`w-full ${errors.lastName ? 'p-invalid' : ''}`}
                  />
                )}
              />
              {errors.lastName && <small className="p-error">{errors.lastName.message}</small>}
            </div>
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="user-phone" className="font-medium">Teléfono</label>
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <InputText
                  {...field}
                  id="user-phone"
                  className={`w-full ${errors.phoneNumber ? 'p-invalid' : ''}`}
                />
              )}
            />
            {errors.phoneNumber && <small className="p-error">{errors.phoneNumber.message}</small>}
          </div>

          <div className="flex flex-column gap-2">
            <label htmlFor="user-role" className="font-medium">Rol *</label>
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <Dropdown
                  {...field}
                  id="user-role"
                  options={[
                    { label: 'Usuario', value: 'USER' },
                    { label: 'Admin', value: 'ADMIN' },
                  ]}
                  className={`w-full ${errors.role ? 'p-invalid' : ''}`}
                />
              )}
            />
            {errors.role && <small className="p-error">{errors.role.message}</small>}
          </div>

          <div className="flex justify-content-end gap-2 mt-3">
            <Button type="button" label="Cancelar" outlined severity="secondary" onClick={closeDialog} />
            <Button type="submit" label="Crear" loading={isCreating} />
          </div>
        </form>
      </Dialog>

      <Dialog
        header="Confirmar eliminación"
        visible={!!userToDelete}
        onHide={() => setUserToDelete(null)}
        style={{ width: '420px' }}
      >
        <p className="m-0">¿Seguro que querés eliminar el usuario "{userToDelete?.email}"?</p>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button type="button" label="Cancelar" outlined severity="secondary" onClick={() => setUserToDelete(null)} />
          <Button
            type="button"
            label="Aceptar"
            icon="pi pi-trash"
            severity="danger"
            loading={isDeleting}
            onClick={async () => {
              if (!userToDelete) return;
              try {
                await deleteUser(userToDelete.id).unwrap();
                showToast({ severity: 'success', summary: 'Usuario eliminado' });
              } catch {
                showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el usuario' });
              } finally {
                setUserToDelete(null);
              }
            }}
          />
        </div>
      </Dialog>
    </div>
  );
}
