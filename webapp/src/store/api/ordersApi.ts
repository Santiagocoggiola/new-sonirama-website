import { baseApi } from './baseApi';
import type {
  OrderDto,
  OrderSummaryDto,
  OrderListParams,
  OrderConfirmRequest,
  OrderCancelRequest,
  OrderApproveRequest,
  OrderRejectRequest,
  OrderReadyRequest,
  OrderCompleteRequest,
  OrderModifyRequest,
  OrderAcceptModificationsRequest,
  OrderRejectModificationsRequest,
  PagedResult,
} from '@/types';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query<PagedResult<OrderSummaryDto>, OrderListParams | void>({
      query: (params) => ({
        url: '/orders',
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Order' as const, id })),
              { type: 'Orders', id: 'LIST' },
            ]
          : [{ type: 'Orders', id: 'LIST' }],
    }),
    getMyOrders: builder.query<PagedResult<OrderSummaryDto>, OrderListParams | void>({
      query: (params) => ({
        url: '/orders/my',
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Order' as const, id })),
              { type: 'Orders', id: 'MY_LIST' },
            ]
          : [{ type: 'Orders', id: 'MY_LIST' }],
    }),
    getOrderById: builder.query<OrderDto, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    getOrder: builder.query<OrderDto, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),
    // User actions
    confirmOrder: builder.mutation<OrderDto, { id: string; body?: OrderConfirmRequest }>(
      {
        query: ({ id, body }) => ({
          url: `/orders/${id}/confirm`,
          method: 'POST',
          body: body || {},
        }),
        invalidatesTags: (result, error, { id }) => [
          { type: 'Order', id },
          { type: 'Orders', id: 'LIST' },
        ],
      }
    ),
    cancelOrder: builder.mutation<OrderDto, { id: string; body: OrderCancelRequest }>({
      query: ({ id, body }) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    acceptModifications: builder.mutation<
      OrderDto,
      { id: string; body?: OrderAcceptModificationsRequest }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}/accept-modifications`,
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    rejectModifications: builder.mutation<
      OrderDto,
      { id: string; body: OrderRejectModificationsRequest }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}/reject-modifications`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    // Admin actions
    approveOrder: builder.mutation<
      OrderDto,
      { id: string; body?: OrderApproveRequest }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}/approve`,
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    rejectOrder: builder.mutation<OrderDto, { id: string; body: OrderRejectRequest }>({
      query: ({ id, body }) => ({
        url: `/orders/${id}/reject`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    markOrderReady: builder.mutation<
      OrderDto,
      { id: string; body?: OrderReadyRequest }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}/ready`,
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    completeOrder: builder.mutation<
      OrderDto,
      { id: string; body?: OrderCompleteRequest }
    >({
      query: ({ id, body }) => ({
        url: `/orders/${id}/complete`,
        method: 'POST',
        body: body || {},
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    modifyOrder: builder.mutation<OrderDto, { id: string; body: OrderModifyRequest }>({
      query: ({ id, body }) => ({
        url: `/orders/${id}/modify`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Order', id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOrdersQuery,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useGetOrderQuery,
  useLazyGetOrderByIdQuery,
  useConfirmOrderMutation,
  useCancelOrderMutation,
  useAcceptModificationsMutation,
  useRejectModificationsMutation,
  useApproveOrderMutation,
  useRejectOrderMutation,
  useMarkOrderReadyMutation,
  useCompleteOrderMutation,
  useModifyOrderMutation,
} = ordersApi;
