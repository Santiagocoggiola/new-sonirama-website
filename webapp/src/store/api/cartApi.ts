import { baseApi } from './baseApi';
import type { CartDto, AddToCartRequest, OrderDto } from '@/types';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<CartDto, void>({
      query: () => '/cart',
      providesTags: ['Cart'],
    }),
    addToCart: builder.mutation<CartDto, AddToCartRequest>({
      query: (body) => ({
        url: '/cart/items',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Cart'],
    }),
    removeFromCart: builder.mutation<
      CartDto,
      { productId: string; quantity?: number }
    >({
      query: ({ productId, quantity }) => ({
        url: `/cart/items/${productId}`,
        method: 'DELETE',
        params: quantity ? { quantity } : undefined,
      }),
      invalidatesTags: ['Cart'],
    }),
    checkout: builder.mutation<OrderDto, void>({
      query: () => ({
        url: '/cart/checkout',
        method: 'POST',
      }),
      invalidatesTags: ['Cart', { type: 'Orders', id: 'LIST' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useRemoveFromCartMutation,
  useCheckoutMutation,
} = cartApi;
