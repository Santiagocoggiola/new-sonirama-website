import { baseApi } from './baseApi';
import type {
  ProductDto,
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductListParams,
  ProductImageDto,
  BulkDiscountDto,
  BulkDiscountCreateRequest,
  BulkDiscountUpdateRequest,
  PagedResult,
} from '@/types';

const buildProductFormData = (
  body: ProductCreateRequest | ProductUpdateRequest,
  includeCode: boolean
) => {
  const formData = new FormData();

  const appendIfPresent = (key: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return;
    formData.append(key, String(value));
  };

  if (includeCode && 'code' in body) {
    appendIfPresent('code', body.code);
  }

  appendIfPresent('name', body.name);
  appendIfPresent('description', body.description);
  appendIfPresent('price', body.price);
  appendIfPresent('currency', body.currency ?? 'ARS');
  appendIfPresent('category', body.category);
  body.categoryIds?.forEach((id) => formData.append('categoryIds', id));
  appendIfPresent('isActive', body.isActive ?? true);

  body.images?.forEach((file) => formData.append('images', file));

  return formData;
};

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PagedResult<ProductDto>, ProductListParams | void>({
      query: (params) => ({
        url: '/products',
        params: params || {},
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Products', id: 'LIST' },
            ]
          : [{ type: 'Products', id: 'LIST' }],
    }),
    getProductById: builder.query<ProductDto, string>({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    getProductByCode: builder.query<ProductDto, string>({
      query: (code) => `/products/code/${code}`,
      providesTags: (result) =>
        result ? [{ type: 'Product', id: result.id }] : [],
    }),
    createProduct: builder.mutation<ProductDto, ProductCreateRequest>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body: buildProductFormData(body, true),
      }),
      invalidatesTags: [{ type: 'Products', id: 'LIST' }],
    }),
    updateProduct: builder.mutation<
      ProductDto,
      { id: string; body: ProductUpdateRequest }
    >({
      query: ({ id, body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: buildProductFormData(body, false),
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Product', id },
        { type: 'Products', id: 'LIST' },
      ],
    }),
    // Product Images
    uploadProductImages: builder.mutation<
      ProductImageDto[],
      { productId: string; files: File[] }
    >({
      query: ({ productId, files }) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        return {
          url: `/products/${productId}/images`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: productId },
      ],
    }),
    deleteProductImage: builder.mutation<void, { productId: string; imageId: string }>(
      {
        query: ({ productId, imageId }) => ({
          url: `/products/${productId}/images/${imageId}`,
          method: 'DELETE',
        }),
        invalidatesTags: (result, error, { productId }) => [
          { type: 'Product', id: productId },
        ],
      }
    ),
    // Bulk Discounts
    getBulkDiscounts: builder.query<PagedResult<BulkDiscountDto>, { productId: string; page?: number; pageSize?: number }>({
      query: ({ productId, page, pageSize }) => ({
        url: `/products/${productId}/discounts`,
        params: { page, pageSize },
      }),
      providesTags: (result, error, { productId }) => [
        { type: 'BulkDiscount', id: productId },
      ],
    }),
    createBulkDiscount: builder.mutation<
      BulkDiscountDto,
      { productId: string; body: BulkDiscountCreateRequest }
    >({
      query: ({ productId, body }) => ({
        url: `/products/${productId}/discounts`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'BulkDiscount', id: productId },
        { type: 'Product', id: productId },
      ],
    }),
    updateBulkDiscount: builder.mutation<
      BulkDiscountDto,
      { productId: string; discountId: string; body: BulkDiscountUpdateRequest }
    >({
      query: ({ productId, discountId, body }) => ({
        url: `/products/${productId}/discounts/${discountId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'BulkDiscount', id: productId },
        { type: 'Product', id: productId },
      ],
    }),
    deleteBulkDiscount: builder.mutation<
      void,
      { productId: string; discountId: string }
    >({
      query: ({ productId, discountId }) => ({
        url: `/products/${productId}/discounts/${discountId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'BulkDiscount', id: productId },
        { type: 'Product', id: productId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetProductByIdQuery,
  useGetProductByCodeQuery,
  useLazyGetProductByIdQuery,
  useLazyGetProductByCodeQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImagesMutation,
  useDeleteProductImageMutation,
  useGetBulkDiscountsQuery,
  useCreateBulkDiscountMutation,
  useUpdateBulkDiscountMutation,
  useDeleteBulkDiscountMutation,
} = productsApi;
