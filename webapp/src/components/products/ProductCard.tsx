'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useCart } from '@/hooks/useCart';
import { buildAssetUrl, formatPrice, isLocalAssetHost } from '@/lib/utils';
import type { ProductDto } from '@/types/product';

interface ProductCardProps {
  product: ProductDto;
  /** Test ID for Playwright */
  testId?: string;
  /** Presentation mode */
  mode?: 'user' | 'admin-preview';
}

/**
 * Product card component for grid display
 */
export function ProductCard({ product, testId = 'product-card', mode = 'user' }: ProductCardProps) {
  const router = useRouter();
  const { addItem, isLoading } = useCart();
  const isAdminMode = mode === 'admin-preview';
  const cardId = `${testId}-${product.id}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addItem(product.id, 1);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/admin/products/${product.id}`);
  };

  const primaryImage = product.images?.[0];
  const imageSrc = buildAssetUrl(primaryImage?.url);
  const href = isAdminMode ? `/admin/products/${product.id}` : `/products/${product.id}`;

  return (
    <Link
      href={href}
      className="no-underline"
    >
      <Card
        id={cardId}
        data-testid={cardId}
        className="h-full card-hover cursor-pointer"
        pt={{
          body: { className: 'p-3' },
          content: { className: 'p-0' },
        }}
      >
        {/* Image */}
        <div
          className="relative w-full border-round-top overflow-hidden bg-surface-100"
          style={{ aspectRatio: '1/1' }}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              loading="eager"
              priority
              unoptimized={isLocalAssetHost}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 576px) 100vw, (max-width: 768px) 50vw, (max-width: 992px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full product-image-placeholder">
              <i className="pi pi-image" />
            </div>
          )}
          
          {/* Bulk discount badge */}
          {product.bulkDiscounts && product.bulkDiscounts.length > 0 && (
            <Tag
              severity="success"
              value="Descuento por cantidad"
              className="absolute top-0 right-0 m-2"
              data-testid={`${cardId}-bulk-discount`}
            />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-column gap-2 mt-3">
          {/* Category */}
          {product.category && (
            <span
              className="text-xs text-color-secondary"
              data-testid={`${cardId}-category`}
            >
              {product.category}
            </span>
          )}

          {/* Name */}
          <h3
            className="m-0 text-base font-semibold text-color line-clamp-2"
            title={product.name}
            data-testid={`${cardId}-name`}
          >
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex align-items-center gap-2">
            <span
              className="text-lg font-bold text-primary"
              data-testid={`${cardId}-price`}
            >
              {formatPrice(product.price)}
            </span>
          </div>

          {/* Action */}
          {isAdminMode ? (
            <Button
              id={`${cardId}-edit`}
              data-testid={`${cardId}-edit`}
              icon="pi pi-pencil"
              label="Editar"
              size="small"
              className="w-full mt-2"
              severity="secondary"
              onClick={handleEdit}
            />
          ) : (
            <Button
              id={`${cardId}-add-to-cart`}
              data-testid={`${cardId}-add-to-cart`}
              icon="pi pi-shopping-cart"
              label="Agregar"
              size="small"
              className="w-full mt-2"
              loading={isLoading}
              onClick={handleAddToCart}
            />
          )}
        </div>
      </Card>
    </Link>
  );
}
