'use client';

import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setCart,
  setCartLoading,
  setCartError,
  clearCart as clearCartAction,
  selectCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  selectCartLoading,
  selectCartError,
  selectCartItemByProductId,
} from '@/store/slices/cartSlice';
import {
  useGetCartQuery,
  useAddToCartMutation,
  useRemoveFromCartMutation,
  useCheckoutMutation,
} from '@/store/api/cartApi';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import type { CartDto } from '@/types';

export function useCart() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Selectors
  const cart = useAppSelector(selectCart);
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);
  const itemCount = useAppSelector(selectCartItemCount);
  const isLoading = useAppSelector(selectCartLoading);
  const error = useAppSelector(selectCartError);

  // RTK Query hooks - only fetch if authenticated
  const {
    data: cartData,
    isLoading: isCartLoading,
    isFetching: isCartFetching,
    refetch: refetchCart,
  } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [addToCartMutation, { isLoading: isAdding }] = useAddToCartMutation();
  const [removeFromCartMutation, { isLoading: isRemoving }] = useRemoveFromCartMutation();
  const [checkoutMutation, { isLoading: isCheckingOut }] = useCheckoutMutation();

  /**
   * Update cart state from API response
   */
  const updateCartFromResponse = useCallback(
    (data: CartDto) => {
      dispatch(setCart(data));
    },
    [dispatch]
  );

  /**
   * Add item to cart
   */
  const addItem = useCallback(
    async (productId: string, quantity: number = 1) => {
      dispatch(setCartLoading(true));
      dispatch(setCartError(null));

      try {
        const result = await addToCartMutation({ productId, quantity }).unwrap();
        updateCartFromResponse(result);
        return { success: true };
      } catch (err) {
        const errorMessage =
          (err as { data?: { error?: string } })?.data?.error ||
          'Error al agregar al carrito';
        dispatch(setCartError(errorMessage));
        return { success: false, error: errorMessage };
      } finally {
        dispatch(setCartLoading(false));
      }
    },
    [addToCartMutation, dispatch, updateCartFromResponse]
  );

  /**
   * Remove item from cart (decrease quantity or remove entirely)
   */
  const removeItem = useCallback(
    async (productId: string, quantity?: number) => {
      dispatch(setCartLoading(true));
      dispatch(setCartError(null));

      try {
        const result = await removeFromCartMutation({ productId, quantity }).unwrap();
        updateCartFromResponse(result);
        return { success: true };
      } catch (err) {
        const errorMessage =
          (err as { data?: { error?: string } })?.data?.error ||
          'Error al remover del carrito';
        dispatch(setCartError(errorMessage));
        return { success: false, error: errorMessage };
      } finally {
        dispatch(setCartLoading(false));
      }
    },
    [removeFromCartMutation, dispatch, updateCartFromResponse]
  );

  /**
   * Update item quantity (set to specific amount)
   */
  const updateQuantity = useCallback(
    async (productId: string, newQuantity: number) => {
      const currentItem = items.find((item) => item.productId === productId);
      if (!currentItem) {
        return addItem(productId, newQuantity);
      }

      const currentQty = currentItem.quantity;
      const diff = newQuantity - currentQty;

      if (diff > 0) {
        // Increase quantity
        return addItem(productId, diff);
      } else if (diff < 0) {
        // Decrease quantity
        return removeItem(productId, Math.abs(diff));
      }

      return { success: true };
    },
    [items, addItem, removeItem]
  );

  /**
   * Checkout - convert cart to order
   */
  const checkout = useCallback(async () => {
    dispatch(setCartLoading(true));
    dispatch(setCartError(null));

    try {
      const order = await checkoutMutation().unwrap();
      dispatch(clearCartAction());
      return { success: true, order };
    } catch (err) {
      const errorMessage =
        (err as { data?: { error?: string } })?.data?.error ||
        'Error al procesar el pedido';
      dispatch(setCartError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setCartLoading(false));
    }
  }, [checkoutMutation, dispatch]);

  /**
   * Clear local cart state
   */
  const clearCart = useCallback(() => {
    dispatch(clearCartAction());
  }, [dispatch]);

  /**
   * Get cart item by product ID
   */
  const getItemByProductId = useCallback(
    (productId: string) => {
      return items.find((item) => item.productId === productId);
    },
    [items]
  );

  /**
   * Check if product is in cart
   */
  const isInCart = useCallback(
    (productId: string): boolean => {
      return items.some((item) => item.productId === productId);
    },
    [items]
  );

  /**
   * Get quantity of a product in cart
   */
  const getQuantity = useCallback(
    (productId: string): number => {
      const item = items.find((item) => item.productId === productId);
      return item?.quantity ?? 0;
    },
    [items]
  );

  // Memoized computed values
  const isEmpty = useMemo(() => items.length === 0, [items]);
  const hasDiscount = useMemo(
    () => items.some((item) => item.discountPercent > 0),
    [items]
  );
  const totalDiscount = useMemo(
    () =>
      items.reduce(
        (acc, item) =>
          acc + (item.unitPriceBase - item.unitPriceWithDiscount) * item.quantity,
        0
      ),
    [items]
  );

  return {
    // State
    cart,
    items,
    total,
    itemCount,
    isEmpty,
    hasDiscount,
    totalDiscount,
    isLoading: isLoading || isCartLoading || isCartFetching,
    isAdding,
    isRemoving,
    isCheckingOut,
    error,
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    checkout,
    clearCart,
    refetchCart,
    // Utilities
    getItemByProductId,
    isInCart,
    getQuantity,
  };
}
