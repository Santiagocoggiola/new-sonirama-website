import { Metadata } from 'next';
import { ProductsPageClient } from '@/app/(dashboard)/products/ProductsPageClient';

export const metadata: Metadata = {
  title: 'Catálogo (vista cliente) - Admin - Sonirama',
  description: 'Vista de catálogo como el cliente, con acceso rápido a edición.',
};

export default function AdminCatalogPreviewPage() {
  return <ProductsPageClient mode="admin-preview" />;
}
