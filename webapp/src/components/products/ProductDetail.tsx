'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Galleria } from 'primereact/galleria';
import { Skeleton } from 'primereact/skeleton';
import { Divider } from 'primereact/divider';
import { useGetProductByIdQuery } from '@/store/api/productsApi';
import { useCart } from '@/hooks/useCart';
import { buildAssetUrl, formatPrice, isLocalAssetHost } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ProductImageDto } from '@/types/product';

interface ProductDetailProps {
  productId: string;
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Product detail view component
 */
export function ProductDetail({ productId, testId = 'product-detail' }: ProductDetailProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const { addItem, isLoading: isAddingToCart } = useCart();

  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useGetProductByIdQuery(productId);

  const handleAddToCart = async () => {
    if (product) {
      await addItem(product.id, quantity);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  // Gallery templates
  const itemTemplate = (item: ProductImageDto) => {
    const src = buildAssetUrl(item.url);
    return (
    <div className="relative w-full" style={{ height: '400px' }}>
      {src ? (
        <Image
          src={src}
          unoptimized={isLocalAssetHost}
          alt={product?.name || 'Producto'}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <div className="w-full h-full product-image-placeholder">
          <i className="pi pi-image" />
        </div>
      )}
    </div>
  );
  };

  const thumbnailTemplate = (item: ProductImageDto) => {
    const src = buildAssetUrl(item.url);
    return (
    <div className="relative" style={{ width: '80px', height: '80px' }}>
      {src ? (
        <Image
          src={src}
          unoptimized={isLocalAssetHost}
          alt="Thumbnail"
          fill
          className="object-cover border-round"
          sizes="80px"
        />
      ) : (
        <div className="w-full h-full product-image-placeholder border-round">
          <i className="pi pi-image text-sm" />
        </div>
      )}
    </div>
  );
  };

  if (isLoading) {
    return (
      <div id={`${testId}-loading`} data-testid={`${testId}-loading`}>
        <Button
          icon="pi pi-arrow-left"
          label="Volver"
          text
          className="mb-4"
          disabled
        />
        <div className="grid">
          <div className="col-12 md:col-6">
            <Skeleton height="400px" className="border-round" />
          </div>
          <div className="col-12 md:col-6">
            <Skeleton width="30%" height="1rem" className="mb-2" />
            <Skeleton width="80%" height="2rem" className="mb-4" />
            <Skeleton width="40%" height="1.5rem" className="mb-4" />
            <Skeleton height="100px" className="mb-4" />
            <Skeleton width="50%" height="3rem" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    const errorMessage = error && 'data' in error
      ? (error.data as { message?: string })?.message || 'Producto no encontrado'
      : 'Producto no encontrado';

    return (
      <EmptyState
        testId={`${testId}-error`}
        icon="pi pi-exclamation-circle"
        title="Error"
        message={errorMessage}
        action={{
          label: 'Volver a productos',
          onClick: () => router.push('/products'),
        }}
      />
    );
  }

  const images = product.images?.length
    ? product.images
    : [{ id: 'placeholder', url: '', altText: product.name, isPrimary: true, displayOrder: 0 }];

  return (
    <div id={testId} data-testid={testId}>
      {/* Back button */}
      <Button
        id={`${testId}-back`}
        data-testid={`${testId}-back`}
        icon="pi pi-arrow-left"
        label="Volver"
        text
        className="mb-4"
        onClick={handleGoBack}
      />

      <div className="grid">
        {/* Image gallery */}
        <div className="col-12 md:col-6">
          <div
            id={`${testId}-gallery`}
            data-testid={`${testId}-gallery`}
            className="surface-card border-round p-3"
          >
            <Galleria
              value={images}
              numVisible={4}
              item={itemTemplate}
              thumbnail={thumbnailTemplate}
              showThumbnails={images.length > 1}
              showIndicators={images.length > 1}
              showItemNavigators={images.length > 1}
              className="w-full"
            />
          </div>
        </div>

        {/* Product info */}
        <div className="col-12 md:col-6">
          <div className="surface-card border-round p-4">
            {/* Category */}
            {product.category && (
              <span
                className="text-sm text-color-secondary"
                data-testid={`${testId}-category`}
              >
                {product.category}
              </span>
            )}

            {/* Name */}
            <h1
              className="text-2xl md:text-3xl font-bold m-0 mt-2 text-color"
              data-testid={`${testId}-name`}
            >
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex align-items-center gap-3 mt-4">
              <span
                className="text-3xl font-bold text-primary"
                data-testid={`${testId}-price`}
              >
                {formatPrice(product.price)}
              </span>
            </div>

            <Divider />

            {/* Description */}
            {product.description && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold m-0 mb-2">Descripción</h3>
                <p
                  className="m-0 text-color-secondary line-height-3"
                  data-testid={`${testId}-description`}
                >
                  {product.description}
                </p>
              </div>
            )}

            <Divider />

            {/* Quantity selector and add to cart */}
            <div className="flex flex-column gap-3">
              <div className="flex align-items-center gap-3">
                <label htmlFor={`${testId}-quantity`} className="font-medium">
                  Cantidad:
                </label>
                <InputNumber
                  id={`${testId}-quantity`}
                  data-testid={`${testId}-quantity`}
                  value={quantity}
                  onValueChange={(e) => setQuantity(e.value ?? 1)}
                  min={1}
                  max={99}
                  showButtons
                  buttonLayout="horizontal"
                  incrementButtonIcon="pi pi-plus"
                  decrementButtonIcon="pi pi-minus"
                  style={{ width: '8rem' }}
                />
              </div>

              <Button
                id={`${testId}-add-to-cart`}
                data-testid={`${testId}-add-to-cart`}
                label="Agregar al carrito"
                icon="pi pi-shopping-cart"
                size="large"
                className="w-full"
                loading={isAddingToCart}
                onClick={handleAddToCart}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
