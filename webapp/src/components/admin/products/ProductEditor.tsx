'use client';

import { useEffect, useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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
      code: '',
      name: '',
      description: '',
      price: undefined,
      category: '',
      currency: 'ARS',
      isActive: true,
    },
  });

  const currencyValue = useWatch({ control, name: 'currency' });

  // Load product data when editing
  useEffect(() => {
    if (product) {
      reset({
        code: product.code,
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category || '',
        currency: product.currency || 'ARS',
        isActive: product.isActive,
      });
    }
  }, [product, reset]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    if (files.length === 0) {
      setSelectedFiles([]);
      return;
    }

    if (files.length > 10) {
      showToast({ severity: 'warn', summary: 'Límite de imágenes', detail: 'Solo podés subir hasta 10 imágenes por vez.' });
      setSelectedFiles(files.slice(0, 10));
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const invalidFile = files.find((f) => !allowed.includes(f.type));
    if (invalidFile) {
      showToast({ severity: 'error', summary: 'Formato no soportado', detail: 'Solo se aceptan JPG, PNG o WEBP.' });
      return;
    }

    setSelectedFiles(files);
  };

  const onSubmit = async (data: ProductCreateFormValues | ProductUpdateFormValues) => {
    try {
      const priceValue = typeof data.price === 'number' ? data.price : Number(data.price);
      const normalized = {
        ...data,
        code: 'code' in data ? data.code.trim() : undefined,
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        category: data.category || undefined,
        currency: (data.currency || 'ARS').toUpperCase(),
        price: priceValue,
      };

      if (!Number.isFinite(normalized.price) || normalized.price <= 0) {
        showToast({ severity: 'error', summary: 'Error', detail: 'El precio debe ser mayor a 0' });
        return;
      }

      if (isEditing) {
        await updateProduct({
          id: productId!,
          body: {
            name: normalized.name,
            description: normalized.description,
            price: normalized.price,
            category: normalized.category,
            currency: normalized.currency,
            isActive: normalized.isActive,
            images: selectedFiles.length ? selectedFiles : undefined,
          },
        }).unwrap();
        showToast({
          severity: 'success',
          summary: 'Producto actualizado',
          detail: 'El producto fue actualizado correctamente',
        });
      } else {
        await createProduct({
          code: normalized.code?.trim() || '',
          name: normalized.name,
          description: normalized.description,
          price: normalized.price,
          category: normalized.category,
          currency: normalized.currency,
          isActive: normalized.isActive,
          images: selectedFiles,
        }).unwrap();
        showToast({
          severity: 'success',
          summary: 'Producto creado',
          detail: 'El producto fue creado correctamente',
        });
      }
      setSelectedFiles([]);
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
        {/* Code */}
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-code`} className="font-medium">
            Código <span className="text-red-500">*</span>
          </label>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                id={`${testId}-code`}
                data-testid={`${testId}-code`}
                className={`w-full ${errors.code ? 'p-invalid' : ''}`}
                disabled={isEditing}
              />
            )}
          />
          {errors.code && (
            <small className="p-error">{errors.code.message}</small>
          )}
        </div>

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
                inputId={`${testId}-price`}
                data-testid={`${testId}-price`}
                value={field.value ?? null}
                onBlur={field.onBlur}
                mode="currency"
                currency={currencyValue || 'ARS'}
                locale="es-AR"
                useGrouping
                minFractionDigits={0}
                maxFractionDigits={2}
                onValueChange={(e) => field.onChange(e.value ?? null)}
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

        {/* Currency */}
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-currency`} className="font-medium">
            Moneda <span className="text-red-500">*</span>
          </label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <InputText
                {...field}
                id={`${testId}-currency`}
                data-testid={`${testId}-currency`}
                maxLength={3}
                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                className={`w-full ${errors.currency ? 'p-invalid' : ''}`}
              />
            )}
          />
          {errors.currency && (
            <small className="p-error">{errors.currency.message}</small>
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

        {/* Images */}
        <div className="flex flex-column gap-2">
          <label htmlFor={`${testId}-images`} className="font-medium">
            Imágenes (JPG, PNG o WEBP) — hasta 10
          </label>
          <input
            id={`${testId}-images`}
            data-testid={`${testId}-images`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
          />
          {selectedFiles.length > 0 ? (
            <small className="text-color-secondary">
              {selectedFiles.length} imagen{selectedFiles.length === 1 ? '' : 'es'} seleccionada{selectedFiles.length === 1 ? '' : 's'}.
            </small>
          ) : (
            <small className="text-color-secondary">
              Podés agregar imágenes ahora o más tarde desde la edición.
            </small>
          )}
          {isEditing && product?.images?.length ? (
            <small className="text-color-secondary">
              Imágenes actuales: {product.images.length}
            </small>
          ) : null}
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
