import { Metadata } from 'next';
import { ProductsPageClient } from './ProductsPageClient';

export const metadata: Metadata = {
  title: 'Productos - Sonirama',
  description: 'Explorá nuestro catálogo de productos de audio profesional',
};

/**
 * Products listing page (main dashboard page for buyers)
 */
export default function ProductsPage() {
  return <ProductsPageClient />;
}
