import { Metadata } from 'next';
import { OrderDetail } from '@/components/orders/OrderDetail';

export const metadata: Metadata = {
  title: 'Detalle de pedido - Sonirama',
  description: 'Detalle de tu pedido',
};

interface OrderPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Order detail page
 */
export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;

  return (
    <div id="order-detail-page" data-testid="order-detail-page">
      <OrderDetail orderId={id} testId="order-detail" />
    </div>
  );
}
