import { Metadata } from 'next';
import { ProductEditor } from '@/components/admin/products/ProductEditor';

export const metadata: Metadata = {
  title: 'Editar producto - Admin - Sonirama',
  description: 'Editar producto',
};

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Edit product page
 */
export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  return (
    <div id="edit-product-page" data-testid="edit-product-page" className="flex flex-column gap-4">
      <h1 className="text-2xl font-bold m-0 text-color">
        Editar producto
      </h1>
      
      <ProductEditor productId={id} testId="product-editor" />
    </div>
  );
}
