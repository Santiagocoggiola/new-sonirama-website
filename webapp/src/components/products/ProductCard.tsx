'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
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
  const { addItem, updateQuantity, getQuantity, isLoading } = useCart();
  const isAdminMode = mode === 'admin-preview';
  const cardId = `${testId}-${product.id}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addItem(product.id, 1);
  };

  const quantityInCart = getQuantity(product.id);

  const adjustQuantity = async (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = Math.max(0, quantityInCart + delta);
    await updateQuantity(product.id, next);
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
    <Link href={href} className="no-underline">
      <article
        id={cardId}
        data-testid={cardId}
        className="product-card surface-card border-round-lg shadow-3 h-full flex flex-column"
      >
        {/* Image */}
        <div className="product-card__image relative">
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

          <div className="product-card__badges">
            <Tag value={`Código ${product.code}`} severity="secondary" className="text-xs" data-testid={`${cardId}-code`} />
            {product.bulkDiscounts && product.bulkDiscounts.length > 0 && (
              <Tag
                severity="success"
                value="Descuento por cantidad"
                className="text-xs"
                data-testid={`${cardId}-bulk-discount`}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-column gap-2 p-3 flex-1">
          <h3 className="m-0 text-base font-semibold text-color line-clamp-2" title={product.name} data-testid={`${cardId}-name`}>
            {product.name}
          </h3>

          <div className="flex align-items-center justify-content-between gap-2">
            <span className="text-2xl font-bold text-primary" data-testid={`${cardId}-price`}>
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-color-secondary">Stock: {product.isActive ? 'Disponible' : 'No disponible'}</span>
          </div>

          <div className="flex align-items-center gap-2 text-sm text-color-secondary">
            <i className="pi pi-truck text-primary" />
            <span>Envío rápido y seguro</span>
          </div>

          {/* Action */}
          {isAdminMode ? (
            <Button
              id={`${cardId}-edit`}
              data-testid={`${cardId}-edit`}
              icon="pi pi-pencil"
              label="Editar"
              size="small"
              className="w-full mt-1"
              severity="secondary"
              onClick={handleEdit}
            />
          ) : quantityInCart > 0 ? (
            <div
              className="flex align-items-center justify-content-between gap-2 mt-2 cart-control"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <div className="flex align-items-center gap-2">
                <Button
                  id={`${cardId}-decrement`}
                  data-testid={`${cardId}-decrement`}
                  icon="pi pi-minus"
                  rounded
                  text
                  severity="secondary"
                  onClick={(e) => adjustQuantity(-1, e)}
                  disabled={isLoading}
                  aria-label="Disminuir"
                />
                <span className="text-sm font-semibold" data-testid={`${cardId}-quantity`}>
                  {quantityInCart} en carrito
                </span>
                <Button
                  id={`${cardId}-increment`}
                  data-testid={`${cardId}-increment`}
                  icon="pi pi-plus"
                  rounded
                  text
                  severity="secondary"
                  onClick={(e) => adjustQuantity(1, e)}
                  disabled={isLoading}
                  aria-label="Aumentar"
                />
              </div>
              <Button
                icon="pi pi-shopping-cart"
                rounded
                text
                severity="primary"
                aria-label="Ir al carrito"
              />
            </div>
          ) : (
            <Button
              id={`${cardId}-add-to-cart`}
              data-testid={`${cardId}-add-to-cart`}
              icon="pi pi-shopping-cart"
              label="Agregar al carrito"
              size="small"
              className="w-full mt-2"
              loading={isLoading}
              onClick={handleAddToCart}
            />
          )}
        </div>
      </article>
      <style jsx>{`
        .product-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid var(--surface-border);
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-4, 0 8px 24px rgba(0,0,0,0.18));
        }
        .product-card__image {
          aspect-ratio: 4 / 3;
          border-top-left-radius: var(--border-radius-lg, 0.75rem);
          border-top-right-radius: var(--border-radius-lg, 0.75rem);
          overflow: hidden;
          background: radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05), transparent 40%),
            radial-gradient(circle at 80% 0%, rgba(255,255,255,0.04), transparent 35%),
            var(--surface-100, #111827);
        }
        .product-card__badges {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .cart-control {
          border: 1px solid var(--surface-border);
          padding: 0.5rem 0.75rem;
          border-radius: 0.75rem;
          background: var(--surface-50);
        }
      `}</style>
    </Link>
  );
}
