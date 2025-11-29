import { Metadata } from 'next';
import { AdminUsersTable } from '@/components/admin/users/AdminUsersTable';

export const metadata: Metadata = {
  title: 'Usuarios - Admin - Sonirama',
  description: 'Administración de usuarios',
};

/**
 * Admin users listing page
 */
export default function AdminUsersPage() {
  return (
    <div id="admin-users-page" data-testid="admin-users-page" className="flex flex-column gap-4">
      <div className="flex align-items-center justify-content-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold m-0 text-color">
          Usuarios
        </h1>
      </div>
      
      <AdminUsersTable testId="admin-users-table" />
    </div>
  );
}
