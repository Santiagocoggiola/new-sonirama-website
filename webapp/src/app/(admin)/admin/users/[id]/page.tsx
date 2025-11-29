import { Metadata } from 'next';
import { AdminUserDetail } from '@/components/admin/users/AdminUserDetail';

export const metadata: Metadata = {
  title: 'Detalle de usuario - Admin - Sonirama',
  description: 'Detalle del usuario',
};

interface AdminUserPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Admin user detail page
 */
export default async function AdminUserPage({ params }: AdminUserPageProps) {
  const { id } = await params;

  return (
    <div id="admin-user-detail-page" data-testid="admin-user-detail-page">
      <AdminUserDetail userId={id} testId="admin-user-detail" />
    </div>
  );
}
