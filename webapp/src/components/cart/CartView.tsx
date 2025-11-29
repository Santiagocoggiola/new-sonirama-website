'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
import { CartItemCard } from './CartItemCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface CartViewProps {
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Shopping cart view component
 */
export function CartView({ testId = 'cart-view' }: CartViewProps) {
  const router = useRouter();
  const { cart, isLoading, clearCart, checkout, isCheckingOut } = useCart();

  const handleCheckout = async () => {
    const result = await checkout();
    if (result.success && result.order) {
      router.push(`/orders/${result.order.id}`);
    }
  };

  const handleContinueShopping = () => {
    router.push('/products');
  };

  if (isLoading) {
    return (
      <div
        id={`${testId}-loading`}
        data-testid={`${testId}-loading`}
        className="flex align-items-center justify-content-center py-8"
      >
        <ProgressSpinner
          style={{ width: '50px', height: '50px' }}
          strokeWidth="4"
        />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        testId={`${testId}-empty`}
        icon="pi pi-shopping-cart"
        title="Tu carrito está vacío"
        message="¡Agregá productos para empezar a comprar!"
        action={{
          label: 'Ver productos',
          onClick: handleContinueShopping,
        }}
      />
    );
  }

  return (
    <div id={testId} data-testid={testId} className="grid">
      {/* Cart items */}
      <div className="col-12 lg:col-8">
        <div className="flex flex-column gap-3">
          {/* Header */}
          <div className="flex align-items-center justify-content-between">
            <span className="text-color-secondary">
              {cart.items.length === 1
                ? '1 producto'
                : `${cart.items.length} productos`}
            </span>
            <Button
              id={`${testId}-clear`}
              data-testid={`${testId}-clear`}
              label="Vaciar carrito"
              icon="pi pi-trash"
              text
              severity="danger"
              size="small"
              onClick={clearCart}
            />
          </div>

          {/* Items */}
          <div
            id={`${testId}-items`}
            data-testid={`${testId}-items`}
            className="flex flex-column gap-3"
          >
            {cart.items.map((item) => (
              <CartItemCard
                key={item.productId}
                item={item}
                testId="cart-item"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Order summary */}
      <div className="col-12 lg:col-4">
        <Card
          id={`${testId}-summary`}
          data-testid={`${testId}-summary`}
          title="Resumen del pedido"
          className="sticky"
          style={{ top: 'calc(var(--header-height) + 1rem)' }}
        >
          <div className="flex flex-column gap-3">
            {/* Total */}
            <div className="flex justify-content-between">
              <span className="text-xl font-bold">Total</span>
              <span
                className="text-xl font-bold text-primary"
                data-testid={`${testId}-total`}
              >
                {formatPrice(cart.total)}
              </span>
            </div>

            <Divider className="my-2" />

            {/* Actions */}
            <Button
              id={`${testId}-checkout`}
              data-testid={`${testId}-checkout`}
              label="Confirmar compra"
              icon="pi pi-check"
              className="w-full"
              loading={isCheckingOut}
              onClick={handleCheckout}
            />

            <Button
              id={`${testId}-continue-shopping`}
              data-testid={`${testId}-continue-shopping`}
              label="Seguir comprando"
              icon="pi pi-arrow-left"
              outlined
              className="w-full"
              onClick={handleContinueShopping}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
