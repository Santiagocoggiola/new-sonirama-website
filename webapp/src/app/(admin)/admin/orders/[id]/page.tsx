import { Metadata } from 'next';
import { AdminOrderDetail } from '@/components/admin/orders/AdminOrderDetail';

export const metadata: Metadata = {
  title: 'Detalle de orden - Admin - Sonirama',
  description: 'Detalle de la orden',
};

interface AdminOrderPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Admin order detail page
 */
export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const { id } = await params;

  return (
    <div id="admin-order-detail-page" data-testid="admin-order-detail-page">
      <AdminOrderDetail orderId={id} testId="admin-order-detail" />
    </div>
  );
}
