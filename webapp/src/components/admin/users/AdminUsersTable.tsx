'use client';

import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useGetUsersQuery } from '@/store/api/usersApi';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import type { UserDto } from '@/types/user';

interface AdminUsersTableProps {
  testId?: string;
}

export function AdminUsersTable({ testId = 'admin-users-table' }: AdminUsersTableProps) {
  const router = useRouter();
  const { data, isLoading, isError } = useGetUsersQuery({ pageSize: 50 });
  const users = data?.items ?? [];

  const handleViewUser = (user: UserDto) => {
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
    <Tag severity={user.isActive ? 'success' : 'danger'} value={user.isActive ? 'Activo' : 'Inactivo'} />
  );

  const dateTemplate = (user: UserDto) => formatDate(user.createdAtUtc);

  const actionsTemplate = (user: UserDto) => (
    <Button icon="pi pi-eye" rounded text severity="secondary" onClick={() => handleViewUser(user)} tooltip="Ver detalle" tooltipOptions={{ position: 'top' }} />
  );

  if (isLoading) {
    return <div className="flex justify-content-center py-8"><ProgressSpinner /></div>;
  }

  if (isError) {
    return <EmptyState testId={`${testId}-error`} icon="pi pi-exclamation-circle" title="Error" message="No se pudieron cargar los usuarios" />;
  }

  if (users.length === 0) {
    return <EmptyState testId={`${testId}-empty`} icon="pi pi-users" title="No hay usuarios" message="Los usuarios aparecerán acá." />;
  }

  return (
    <div id={testId} data-testid={testId}>
      <DataTable value={users} dataKey="id" paginator rows={10} rowsPerPageOptions={[10, 25, 50]} className="surface-card border-round" stripedRows responsiveLayout="scroll">
        <Column field="email" header="Email" sortable />
        <Column header="Nombre" body={nameTemplate} />
        <Column field="role" header="Rol" body={roleTemplate} />
        <Column field="isActive" header="Estado" body={statusTemplate} />
        <Column field="createdAtUtc" header="Registro" body={dateTemplate} sortable />
        <Column header="Acciones" body={actionsTemplate} style={{ width: '100px' }} />
      </DataTable>
    </div>
  );
}
