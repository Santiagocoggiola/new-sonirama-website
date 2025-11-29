import { Metadata } from 'next';
import { OrdersList } from '@/components/orders/OrdersList';

export const metadata: Metadata = {
  title: 'Mis pedidos - Sonirama',
  description: 'Historial de tus pedidos',
};

/**
 * User orders page
 */
export default function OrdersPage() {
  return (
    <div id="orders-page" data-testid="orders-page" className="flex flex-column gap-4">
      <h1 className="text-2xl font-bold m-0 text-color">
        Mis pedidos
      </h1>
      
      <OrdersList testId="orders-list" />
    </div>
  );
}
