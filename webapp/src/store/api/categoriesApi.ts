import { baseApi } from './baseApi';
import type {
  CategoryDto,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CategoryListParams,
  PagedResult,
} from '@/types';

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query<PagedResult<CategoryDto>, CategoryListParams | void>(
      {
        query: (params) => ({
          url: '/categories',
          params: params || {},
        }),
        providesTags: (result) =>
          result
            ? [
                ...result.items.map(({ id }) => ({
                  type: 'Category' as const,
                  id,
                })),
                { type: 'Categories', id: 'LIST' },
              ]
            : [{ type: 'Categories', id: 'LIST' }],
      }
    ),
    getCategoryById: builder.query<CategoryDto, string>({
      query: (id) => `/categories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Category', id }],
    }),
    createCategory: builder.mutation<CategoryDto, CategoryCreateRequest>({
      query: (body) => ({
        url: '/categories',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Categories', id: 'LIST' }],
    }),
    updateCategory: builder.mutation<
      CategoryDto,
      { id: string; body: CategoryUpdateRequest }
    >({
      query: ({ id, body }) => ({
        url: `/categories/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Category', id },
        { type: 'Categories', id: 'LIST' },
      ],
    }),
    deleteCategory: builder.mutation<void, string>({
      query: (id) => ({
        url: `/categories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Category', id },
        { type: 'Categories', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;
