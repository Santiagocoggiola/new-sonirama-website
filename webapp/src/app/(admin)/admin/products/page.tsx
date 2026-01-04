import { Metadata } from 'next';
import { AdminProductsCatalog } from '@/components/admin/products/AdminProductsCatalog';

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
      <AdminProductsCatalog testId="admin-products-catalog" />
    </div>
  );
}
