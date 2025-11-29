import { Metadata } from 'next';
import { AdminCategoriesTable } from '@/components/admin/categories/AdminCategoriesTable';

export const metadata: Metadata = {
  title: 'Categorías - Admin - Sonirama',
  description: 'Administración de categorías',
};

/**
 * Admin categories listing page
 */
export default function AdminCategoriesPage() {
  return (
    <div id="admin-categories-page" data-testid="admin-categories-page" className="flex flex-column gap-4">
      <div className="flex align-items-center justify-content-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold m-0 text-color">
          Categorías
        </h1>
      </div>
      
      <AdminCategoriesTable testId="admin-categories-table" />
    </div>
  );
}
