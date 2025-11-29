import { Metadata } from 'next';
import { ProductDetail } from '@/components/products/ProductDetail';

export const metadata: Metadata = {
  title: 'Producto - Sonirama',
  description: 'Detalle del producto',
};

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Product detail page
 */
export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return (
    <div id="product-detail-page" data-testid="product-detail-page">
      <ProductDetail productId={id} testId="product-detail" />
    </div>
  );
}
