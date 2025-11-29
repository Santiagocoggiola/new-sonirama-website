import { Metadata } from 'next';
import { ProductEditor } from '@/components/admin/products/ProductEditor';

export const metadata: Metadata = {
  title: 'Nuevo producto - Admin - Sonirama',
  description: 'Crear nuevo producto',
};

/**
 * Create new product page
 */
export default function NewProductPage() {
  return (
    <div id="new-product-page" data-testid="new-product-page" className="flex flex-column gap-4">
      <h1 className="text-2xl font-bold m-0 text-color">
        Nuevo producto
      </h1>
      
      <ProductEditor testId="product-editor" />
    </div>
  );
}
