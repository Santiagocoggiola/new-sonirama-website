import { Metadata } from 'next';
import { AdminProductsTable } from '@/components/admin/products/AdminProductsTable';

export const metadata: Metadata = {
  title: 'Productos - Admin - Sonirama',
  description: 'Administración de productos',
};

/**
 * Admin products listing page
 */
export default function AdminProductsPage() {
  return (
    <div id="admin-products-page" data-testid="admin-products-page" className="flex flex-column gap-4">
      <div className="flex align-items-center justify-content-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold m-0 text-color">
          Productos
        </h1>
      </div>
      
      <AdminProductsTable testId="admin-products-table" />
    </div>
  );
}
