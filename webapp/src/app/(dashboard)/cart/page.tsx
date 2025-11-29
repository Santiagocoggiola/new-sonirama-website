import { Metadata } from 'next';
import { CartView } from '@/components/cart/CartView';

export const metadata: Metadata = {
  title: 'Carrito - Sonirama',
  description: 'Tu carrito de compras',
};

/**
 * Shopping cart page
 */
export default function CartPage() {
  return (
    <div id="cart-page" data-testid="cart-page" className="flex flex-column gap-4">
      <h1 className="text-2xl font-bold m-0 text-color">
        Carrito de compras
      </h1>
      
      <CartView testId="cart-view" />
    </div>
  );
}
