import { Metadata } from 'next';
import { AdminOrdersTable } from '@/components/admin/orders/AdminOrdersTable';

export const metadata: Metadata = {
  title: 'Órdenes - Admin - Sonirama',
  description: 'Administración de órdenes',
};

/**
 * Admin orders listing page
 */
export default function AdminOrdersPage() {
  return (
    <div id="admin-orders-page" data-testid="admin-orders-page" className="flex flex-column gap-4">
      <div className="flex align-items-center justify-content-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold m-0 text-color">
          Órdenes
        </h1>
      </div>
      
      <AdminOrdersTable testId="admin-orders-table" />
    </div>
  );
}
