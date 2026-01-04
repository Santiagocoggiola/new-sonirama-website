'use client';

import Link from 'next/link';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { useCart } from '@/hooks/useCart';
import { formatPrice, buildAssetUrl } from '@/lib/utils';
import { useGetProductByIdQuery } from '@/store/api/productsApi';
import type { CartItemDto } from '@/types/cart';

interface CartItemCardProps {
  item: CartItemDto;
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Cart item card component
 */
export function CartItemCard({ item, testId = 'cart-item' }: CartItemCardProps) {
  const { updateQuantity, removeItem, isLoading } = useCart();
  const cardId = `${testId}-${item.productId}`;
  const { data: product } = useGetProductByIdQuery(item.productId);
  const primaryImage = product?.images?.find((img) => (img as { isPrimary?: boolean }).isPrimary) || product?.images?.[0];

  const handleQuantityChange = async (value: number | null) => {
    if (value && value > 0) {
      await updateQuantity(item.productId, value);
    }
  };

  const handleRemove = async () => {
    await removeItem(item.productId);
  };

  return (
    <div
      id={cardId}
      data-testid={cardId}
      className="surface-card border-round p-3 flex gap-3"
    >
      {/* Product placeholder */}
      <Link href={`/products/${item.productId}`} className="flex-shrink-0">
        <div
          className="border-round overflow-hidden flex align-items-center justify-content-center"
          style={{ width: '100px', height: '100px' }}
        >
          {primaryImage?.url ? (
            <img
              src={buildAssetUrl(primaryImage.url)}
              alt={product?.name ?? item.productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="product-image-placeholder w-full h-full flex align-items-center justify-content-center">
              <i className="pi pi-image text-2xl" />
            </div>
          )}
        </div>
      </Link>

      {/* Product info */}
      <div className="flex-1 flex flex-column gap-2">
        <Link
          href={`/products/${item.productId}`}
          className="no-underline"
        >
          <h3
            className="m-0 text-base font-semibold text-color line-clamp-2 hover:text-primary"
            data-testid={`${cardId}-name`}
          >
            {item.productName}
          </h3>
        </Link>
        <span className="text-color-secondary text-sm" data-testid={`${cardId}-code`}>
          Código: {item.productCode}
        </span>

        {/* Price */}
        <div className="flex align-items-center gap-2">
          {item.discountPercent > 0 ? (
            <>
              <span
                className="font-bold text-primary"
                data-testid={`${cardId}-unit-price`}
              >
                {formatPrice(item.unitPriceWithDiscount)}
              </span>
              <span className="text-color-secondary text-sm line-through">
                {formatPrice(item.unitPriceBase)}
              </span>
              <span className="text-green-600 text-sm">
                -{item.discountPercent}%
              </span>
            </>
          ) : (
            <span
              className="font-bold text-primary"
              data-testid={`${cardId}-unit-price`}
            >
              {formatPrice(item.unitPriceBase)}
            </span>
          )}
          <span className="text-color-secondary text-sm">c/u</span>
        </div>

        {/* Quantity and actions */}
        <div className="flex align-items-center gap-3 mt-auto">
          <InputNumber
            id={`${cardId}-quantity`}
            data-testid={`${cardId}-quantity`}
            value={item.quantity}
            onValueChange={(e) => handleQuantityChange(e.value ?? null)}
            min={1}
            max={99}
            showButtons
            buttonLayout="horizontal"
            incrementButtonIcon="pi pi-plus"
            decrementButtonIcon="pi pi-minus"
            disabled={isLoading}
            style={{ width: '7rem' }}
          />

          <Button
            id={`${cardId}-remove`}
            data-testid={`${cardId}-remove`}
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            onClick={handleRemove}
            loading={isLoading}
            aria-label="Eliminar producto"
            tooltip="Eliminar"
            tooltipOptions={{ position: 'top' }}
          />
        </div>
      </div>

      {/* Subtotal */}
      <div className="flex flex-column align-items-end justify-content-between">
        <span
          className="text-lg font-bold text-color"
          data-testid={`${cardId}-subtotal`}
        >
          {formatPrice(item.lineTotal)}
        </span>
      </div>
    </div>
  );
}
