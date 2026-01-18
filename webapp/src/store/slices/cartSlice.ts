import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { CartDto, CartItemDto } from '@/types';

interface CartState {
  id: string | null;
  items: CartItemDto[];
  subtotal: number;
  discountTotal: number;
  userDiscountPercent: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  updatedAtUtc: string | null;
}

const initialState: CartState = {
  id: null,
  items: [],
  subtotal: 0,
  discountTotal: 0,
  userDiscountPercent: 0,
  total: 0,
  isLoading: false,
  error: null,
  updatedAtUtc: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action: PayloadAction<CartDto>) => {
      state.id = action.payload.id;
      state.items = [...action.payload.items].sort((a, b) => (a.productCode || '').localeCompare(b.productCode || ''));
      state.subtotal = action.payload.subtotal;
      state.discountTotal = action.payload.discountTotal;
      state.userDiscountPercent = action.payload.userDiscountPercent;
      state.total = action.payload.total;
      state.updatedAtUtc = action.payload.updatedAtUtc;
      state.error = null;
    },
    setCartLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCartError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearCart: (state) => {
      state.id = null;
      state.items = [];
      state.subtotal = 0;
      state.discountTotal = 0;
      state.userDiscountPercent = 0;
      state.total = 0;
      state.updatedAtUtc = null;
      state.error = null;
    },
    updateCartItem: (state, action: PayloadAction<CartItemDto>) => {
      const index = state.items.findIndex(
        (item) => item.productId === action.payload.productId
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      } else {
        state.items.push(action.payload);
      }
      // Recalculate total
      state.subtotal = state.items.reduce((sum, item) => sum + item.unitPriceBase * item.quantity, 0);
      state.total = state.items.reduce((sum, item) => sum + item.lineTotal, 0);
      state.discountTotal = state.subtotal - state.total;
    },
    removeCartItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
      // Recalculate total
      state.subtotal = state.items.reduce((sum, item) => sum + item.unitPriceBase * item.quantity, 0);
      state.total = state.items.reduce((sum, item) => sum + item.lineTotal, 0);
      state.discountTotal = state.subtotal - state.total;
    },
  },
});

export const {
  setCart,
  setCartLoading,
  setCartError,
  clearCart,
  updateCartItem,
  removeCartItem,
} = cartSlice.actions;

// Selectors
export const selectCart = (state: { cart: CartState }) => state.cart;
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.total;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.items.reduce((count, item) => count + item.quantity, 0);
export const selectCartLoading = (state: { cart: CartState }) =>
  state.cart.isLoading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;
export const selectCartItemByProductId =
  (productId: string) => (state: { cart: CartState }) =>
    state.cart.items.find((item) => item.productId === productId);

export default cartSlice.reducer;
