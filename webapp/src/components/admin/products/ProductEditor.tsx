'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { InputSwitch } from 'primereact/inputswitch';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import {
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
} from '@/store/api/productsApi';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';
import { productCreateSchema, productUpdateSchema } from '@/schemas/product.schema';
import type { ProductCreateFormValues, ProductUpdateFormValues } from '@/schemas/product.schema';
import { showToast } from '@/components/ui/toast-service';
import { EmptyState } from '@/components/ui/EmptyState';

interface ProductEditorProps {
  productId?: string;
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Product create/edit form
 */
export function ProductEditor({ productId, testId = 'product-editor' }: ProductEditorProps) {
  const router = useRouter();
  const isEditing = !!productId;

  // Queries
  const {
    data: product,
    isLoading: isLoadingProduct,
    isError: isProductError,
  } = useGetProductByIdQuery(productId!, { skip: !productId });

  const { data: categoriesData, isLoading: isLoadingCategories } = useGetCategoriesQuery({
    isActive: true,
    pageSize: 100,
  });

  // Mutations
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();

  const categories = categoriesData?.items ?? [];
  const categoryOptions = categories.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  // Form setup
  const schema = isEditing ? productUpdateSchema : productCreateSchema;
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductCreateFormValues | ProductUpdateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      isActive: true,
    },
  });

  // Load product data when editing
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category || '',
        isActive: product.isActive,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: ProductCreateFormValues | ProductUpdateFormValues) => {
    try {
      if (isEditing) {
        await updateProduct({
          id: productId!,
          body: data as ProductUpdateFormValues,
        }).unwrap();
        showToast({
          severity: 'success',
          summary: 'Producto actualizado',
          detail: 'El producto fue actualizado correctamente',
        });
      } else {
        await createProduct(data as ProductCreateFormValues).unwrap();
        showToast({
          severity: 'success',
          summary: 'Producto creado',
          detail: 'El producto fue creado correctamente',
        });
      }
      router.push('/admin/products');
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'data' in error
          ? (error.data as { message?: string })?.message || 'Error al guardar el producto'
          : 'Error al guardar el producto';
      showToast({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
      });
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (isEditing && isLoadingProduct) {
    return (
      <Card>
        <div className="flex flex-column gap-3">
          <Skeleton height="2rem" />
          <Skeleton height="4rem" />
          <Skeleton height="2rem" width="50%" />
          <Skeleton height="2rem" width="50%" />
        </div>
      </Card>
    );
  }

  if (isEditing && isProductError) {
    return (
      <EmptyState
        testId={`${testId}-error`}
        icon="pi pi-exclamation-circle"
        title="Error"
        message="No se pudo cargar el producto"
        action={{
          label: 'Volver',
          onClick: () => router.push('/admin/products'),
        }}
      />
    );
  }

  return (
    <Card id={testId} data-testid={testId}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-column gap-4">
        {/* Name */}
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-name`} className="font-medium">
            Nombre <span className="text-red-500">*</span>
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                id={`${testId}-name`}
                data-testid={`${testId}-name`}
                className={`w-full ${errors.name ? 'p-invalid' : ''}`}
              />
            )}
          />
          {errors.name && (
            <small className="p-error">{errors.name.message}</small>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-description`} className="font-medium">
            Descripción
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <InputTextarea
                {...field}
                id={`${testId}-description`}
                data-testid={`${testId}-description`}
                rows={4}
                autoResize
                className={`w-full ${errors.description ? 'p-invalid' : ''}`}
              />
            )}
          />
          {errors.description && (
            <small className="p-error">{errors.description.message}</small>
          )}
        </div>

        {/* Price */}
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-price`} className="font-medium">
            Precio <span className="text-red-500">*</span>
          </label>
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                id={`${testId}-price`}
                data-testid={`${testId}-price`}
                mode="currency"
                currency="ARS"
                locale="es-AR"
                onValueChange={(e) => field.onChange(e.value)}
                className={`w-full ${errors.price ? 'p-invalid' : ''}`}
              />
            )}
          />
          {errors.price && (
            <small className="p-error">{errors.price.message}</small>
          )}
        </div>

        {/* Category */}
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-category`} className="font-medium">
            Categoría
          </label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Dropdown
                {...field}
                id={`${testId}-category`}
                data-testid={`${testId}-category`}
                options={categoryOptions}
                placeholder="Seleccionar categoría"
                loading={isLoadingCategories}
                className={`w-full ${errors.category ? 'p-invalid' : ''}`}
              />
            )}
          />
          {errors.category && (
            <small className="p-error">{errors.category.message}</small>
          )}
        </div>

        {/* Is Active */}
        <div className="flex align-items-center gap-2">
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <InputSwitch
                inputId={`${testId}-isActive`}
                data-testid={`${testId}-isActive`}
                checked={field.value}
                onChange={(e) => field.onChange(e.value)}
              />
            )}
          />
          <label htmlFor={`${testId}-isActive`} className="font-medium cursor-pointer">
            Producto activo
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-content-end mt-4">
          <Button
            type="button"
            label="Cancelar"
            outlined
            severity="secondary"
            onClick={handleCancel}
          />
          <Button
            id={`${testId}-submit`}
            data-testid={`${testId}-submit`}
            type="submit"
            label={isEditing ? 'Actualizar' : 'Crear'}
            icon={isEditing ? 'pi pi-check' : 'pi pi-plus'}
            loading={isCreating || isUpdating}
          />
        </div>
      </form>
    </Card>
  );
}
