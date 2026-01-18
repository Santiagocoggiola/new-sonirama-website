'use client';

import { useEffect, useState, ChangeEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from 'primereact/card';
import { BreadCrumb } from 'primereact/breadcrumb';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Divider } from 'primereact/divider';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { Dialog } from 'primereact/dialog';
import {
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useDeleteProductImageMutation,
  useGetBulkDiscountsQuery,
  useCreateBulkDiscountMutation,
  useUpdateBulkDiscountMutation,
  useDeleteBulkDiscountMutation,
} from '@/store/api/productsApi';
import { useGetCategoriesQuery } from '@/store/api/categoriesApi';
import { productCreateSchema, productUpdateSchema } from '@/schemas/product.schema';
import type { ProductCreateFormValues, ProductUpdateFormValues } from '@/schemas/product.schema';
import type { BulkDiscountDto, CategoryDto } from '@/types';
import { showToast } from '@/components/ui/toast-service';
import { EmptyState } from '@/components/ui/EmptyState';
import { buildAssetUrl } from '@/lib/utils';

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
  const [bulkDiscountDrafts, setBulkDiscountDrafts] = useState<BulkDiscountDto[]>([]);
  const [newBulkDiscount, setNewBulkDiscount] = useState({ minQuantity: 1, discountPercent: 0, isActive: true });
  const [discountToDelete, setDiscountToDelete] = useState<BulkDiscountDto | null>(null);
  const [imageToDelete, setImageToDelete] = useState<{ id: string; fileName?: string } | null>(null);
  const [deleteProductDialogOpen, setDeleteProductDialogOpen] = useState(false);
  const [discountPage, setDiscountPage] = useState(1);
  const [discountRows, setDiscountRows] = useState(10);
  const [discountTotal, setDiscountTotal] = useState(0);

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

  const {
    data: bulkDiscounts,
    isLoading: isLoadingDiscounts,
    isError: isDiscountsError,
  } = useGetBulkDiscountsQuery(
    { productId: productId!, page: discountPage, pageSize: discountRows },
    { skip: !productId }
  );

  // Mutations
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct, { isLoading: isDeletingProduct }] = useDeleteProductMutation();
  const [deleteProductImage, { isLoading: isDeletingImage }] = useDeleteProductImageMutation();
  const [createBulkDiscount, { isLoading: isCreatingDiscount }] = useCreateBulkDiscountMutation();
  const [updateBulkDiscount, { isLoading: isUpdatingDiscount }] = useUpdateBulkDiscountMutation();
  const [deleteBulkDiscount, { isLoading: isDeletingDiscount }] = useDeleteBulkDiscountMutation();

  // Form setup
  const schema = isEditing ? productUpdateSchema : productCreateSchema;
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductCreateFormValues | ProductUpdateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      price: undefined,
      category: '',
      categoryIds: [],
      currency: 'ARS',
      isActive: true,
    },
  });

  const currencyValue = useWatch({ control, name: 'currency' });
  const categoryIdsValue = (useWatch({ control, name: 'categoryIds' }) as string[] | undefined) ?? [];

  const categories = categoriesData?.items ?? [];
  const selectedCategories = useMemo(
    () => categories.filter((cat) => categoryIdsValue.includes(cat.id)),
    [categories, categoryIdsValue]
  );
  const availableCategories = useMemo(
    () => categories.filter((cat) => !categoryIdsValue.includes(cat.id)),
    [categories, categoryIdsValue]
  );

  // Load product data when editing
  useEffect(() => {
    if (product) {
      const categoryValue = product.categories?.[0]?.id
        ?? (product.category && /^[0-9a-fA-F-]{36}$/.test(product.category) ? product.category : '');
      const categoryIds = product.categories?.map((cat) => cat.id)
        ?? (categoryValue ? [categoryValue] : []);
      reset({
        code: product.code,
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: categoryValue,
        categoryIds,
        currency: product.currency || 'ARS',
        isActive: product.isActive,
      });
    }
  }, [product, reset]);

  useEffect(() => {
    if (bulkDiscounts) {
      setBulkDiscountDrafts(bulkDiscounts.items.map((discount) => ({ ...discount })));
      setDiscountTotal(bulkDiscounts.totalCount);
    }
  }, [bulkDiscounts]);

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
        categoryIds: Array.isArray(data.categoryIds) ? data.categoryIds.filter(Boolean) : undefined,
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
            categoryIds: normalized.categoryIds,
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
          category: undefined,
          categoryIds: undefined,
          currency: normalized.currency,
          isActive: normalized.isActive,
          images: undefined,
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

  const handleCreateDiscount = async () => {
    if (!productId) return;
    const minQuantity = Math.max(1, Number(newBulkDiscount.minQuantity || 1));
    const discountPercent = Math.min(100, Math.max(0, Number(newBulkDiscount.discountPercent || 0)));

    if (minQuantity <= 0) {
      showToast({ severity: 'warn', summary: 'Cantidad inválida', detail: 'La cantidad mínima debe ser mayor a 0' });
      return;
    }

    if (discountPercent <= 0 || discountPercent > 100) {
      showToast({ severity: 'warn', summary: 'Descuento inválido', detail: 'El descuento debe estar entre 1 y 100' });
      return;
    }

    try {
      await createBulkDiscount({
        productId,
        body: {
          minQuantity,
          discountPercent,
          isActive: newBulkDiscount.isActive,
        },
      }).unwrap();
      showToast({ severity: 'success', summary: 'Descuento creado' });
      setNewBulkDiscount({ minQuantity: 1, discountPercent: 0, isActive: true });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el descuento' });
    }
  };

  const handleUpdateDiscount = async (discount: BulkDiscountDto) => {
    if (!productId) return;
    if (discount.minQuantity <= 0) {
      showToast({ severity: 'warn', summary: 'Cantidad inválida', detail: 'La cantidad mínima debe ser mayor a 0' });
      return;
    }
    if (discount.discountPercent <= 0 || discount.discountPercent > 100) {
      showToast({ severity: 'warn', summary: 'Descuento inválido', detail: 'El descuento debe estar entre 1 y 100' });
      return;
    }

    try {
      await updateBulkDiscount({
        productId,
        discountId: discount.id,
        body: {
          minQuantity: discount.minQuantity,
          discountPercent: discount.discountPercent,
          isActive: discount.isActive,
        },
      }).unwrap();
      showToast({ severity: 'success', summary: 'Descuento actualizado' });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el descuento' });
    }
  };

  const handleDeleteDiscount = async (discountId: string) => {
    if (!productId) return;
    try {
      await deleteBulkDiscount({ productId, discountId }).unwrap();
      showToast({ severity: 'success', summary: 'Descuento eliminado' });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el descuento' });
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!productId) return;
    try {
      await deleteProductImage({ productId, imageId }).unwrap();
      showToast({ severity: 'success', summary: 'Imagen eliminada' });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la imagen' });
    }
  };

  const handleDeleteProduct = async () => {
    if (!productId) return;
    try {
      await deleteProduct(productId).unwrap();
      showToast({ severity: 'success', summary: 'Producto eliminado' });
      router.push('/admin/products');
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el producto' });
    }
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
      {isEditing && product && (
        <div className="mb-4">
          <BreadCrumb
            home={{ icon: 'pi pi-home', url: '/admin/products' }}
            model={[
              ...(product.category ? [{ label: product.category }] : []),
              { label: `Código ${product.code}` },
              { label: product.name },
            ]}
          />
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-column gap-4">
        {isEditing ? (
          <TabView>
            <TabPanel header="Información principal">
              <div className="flex flex-column gap-4">
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
                        disabled
                      />
                    )}
                  />
                  {errors.code && (
                    <small className="p-error">{errors.code.message}</small>
                  )}
                </div>

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
              </div>
            </TabPanel>

            <TabPanel header="Categorías">
              <div className="flex flex-column gap-3">
                <div className="flex align-items-center justify-content-between">
                  <span className="font-medium">Seleccioná una o más categorías</span>
                  <span className="text-sm text-color-secondary">{categoryIdsValue.length} seleccionadas</span>
                </div>

                {isLoadingCategories && <Skeleton height="6rem" />}
                {!isLoadingCategories && categories.length === 0 && (
                  <small className="text-color-secondary">No hay categorías disponibles.</small>
                )}
                {!isLoadingCategories && categories.length > 0 && (
                  <>
                    <div className="flex flex-column gap-2">
                      <span className="font-medium">Seleccionadas</span>
                      {selectedCategories.length === 0 ? (
                        <small className="text-color-secondary">No hay categorías seleccionadas.</small>
                      ) : (
                        <DataTable
                          value={selectedCategories}
                          dataKey="id"
                          className="surface-card"
                          stripedRows
                          paginator
                          rows={10}
                          rowsPerPageOptions={[10, 25, 50]}
                          responsiveLayout="scroll"
                        >
                          <Column field="name" header="Nombre" />
                          <Column field="description" header="Descripción" body={(row: CategoryDto) => row.description || '-'} />
                          <Column
                            header="Quitar"
                            body={(row: CategoryDto) => (
                              <Button
                                type="button"
                                icon="pi pi-times"
                                text
                                severity="secondary"
                                onClick={() => {
                                  const next = categoryIdsValue.filter((id) => id !== row.id);
                                  setValue('categoryIds', next, { shouldDirty: true });
                                }}
                                tooltip="Quitar categoría"
                                tooltipOptions={{ position: 'top' }}
                              />
                            )}
                          />
                        </DataTable>
                      )}
                    </div>

                    <Divider className="my-2" />

                    <div className="flex flex-column gap-2">
                      <span className="font-medium">Disponibles</span>
                      {availableCategories.length === 0 ? (
                        <small className="text-color-secondary">No hay categorías disponibles para agregar.</small>
                      ) : (
                        <DataTable
                          value={availableCategories}
                          dataKey="id"
                          className="surface-card"
                          stripedRows
                          paginator
                          rows={10}
                          rowsPerPageOptions={[10, 25, 50]}
                          responsiveLayout="scroll"
                        >
                          <Column field="name" header="Nombre" />
                          <Column field="description" header="Descripción" body={(row: CategoryDto) => row.description || '-'} />
                          <Column
                            header="Agregar"
                            body={(row: CategoryDto) => (
                              <Button
                                type="button"
                                icon="pi pi-plus"
                                text
                                severity="secondary"
                                onClick={() => {
                                  const next = [...categoryIdsValue, row.id];
                                  setValue('categoryIds', next, { shouldDirty: true });
                                }}
                                tooltip="Agregar categoría"
                                tooltipOptions={{ position: 'top' }}
                              />
                            )}
                          />
                        </DataTable>
                      )}
                    </div>
                  </>
                )}
              </div>
            </TabPanel>

            <TabPanel header="Imágenes">
              <div className="flex flex-column gap-3">
                <div className="flex flex-column gap-2">
                  <label htmlFor={`${testId}-images`} className="font-medium">
                    Subir nuevas imágenes (JPG, PNG o WEBP) — hasta 10
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
                      Seleccioná imágenes para subirlas al guardar.
                    </small>
                  )}
                </div>

                <Divider className="my-2" />

                <div className="flex flex-column gap-2">
                  <span className="font-medium">Imágenes actuales</span>
                  {product?.images?.length ? (
                    <DataTable
                      value={product.images}
                      dataKey="id"
                      className="surface-card"
                      stripedRows
                      paginator
                      rows={10}
                      rowsPerPageOptions={[10, 25, 50]}
                      responsiveLayout="scroll"
                    >
                      <Column
                        header="Preview"
                        body={(img) => (
                          <img
                            src={buildAssetUrl(img.url)}
                            alt={img.fileName}
                            className="border-round"
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                          />
                        )}
                      />
                      <Column field="fileName" header="Archivo" />
                      <Column
                        header="Acciones"
                        body={(img) => (
                          <Button
                            type="button"
                            icon="pi pi-trash"
                            text
                            severity="danger"
                            loading={isDeletingImage}
                            onClick={() => setImageToDelete({ id: img.id, fileName: img.fileName })}
                          />
                        )}
                      />
                    </DataTable>
                  ) : (
                    <small className="text-color-secondary">No hay imágenes cargadas.</small>
                  )}
                </div>
              </div>
            </TabPanel>

            <TabPanel header="Descuentos">
              <div className="flex flex-column gap-3">
                {isLoadingDiscounts && <Skeleton height="6rem" />}
                {isDiscountsError && (
                  <small className="p-error">No se pudieron cargar los descuentos.</small>
                )}
                {!isLoadingDiscounts && !isDiscountsError && (
                  <>
                    {bulkDiscountDrafts.length === 0 ? (
                      <small className="text-color-secondary">No hay descuentos configurados.</small>
                    ) : (
                      <DataTable
                        value={bulkDiscountDrafts}
                        dataKey="id"
                        className="surface-card"
                        stripedRows
                        paginator
                        lazy
                        first={(discountPage - 1) * discountRows}
                        rows={discountRows}
                        totalRecords={discountTotal}
                        onPage={(event) => {
                          const nextRows = event.rows ?? discountRows;
                          setDiscountRows(nextRows);
                          setDiscountPage((event.page ?? 0) + 1);
                        }}
                        rowsPerPageOptions={[10, 25, 50]}
                        responsiveLayout="scroll"
                      >
                        <Column
                          header="Mínimo"
                          body={(row, { rowIndex }) => (
                            <InputNumber
                              value={row.minQuantity}
                              onValueChange={(e) => {
                                const value = Number(e.value ?? 1);
                                setBulkDiscountDrafts((prev) =>
                                  prev.map((item, idx) =>
                                    idx === rowIndex ? { ...item, minQuantity: value } : item
                                  )
                                );
                              }}
                              min={1}
                            />
                          )}
                        />
                        <Column
                          header="% Descuento"
                          body={(row, { rowIndex }) => (
                            <InputNumber
                              value={row.discountPercent}
                              onValueChange={(e) => {
                                const value = Number(e.value ?? 0);
                                setBulkDiscountDrafts((prev) =>
                                  prev.map((item, idx) =>
                                    idx === rowIndex ? { ...item, discountPercent: value } : item
                                  )
                                );
                              }}
                              min={0}
                              max={100}
                            />
                          )}
                        />
                        <Column
                          header="Activo"
                          body={(row, { rowIndex }) => (
                            <InputSwitch
                              checked={row.isActive}
                              onChange={(e) => {
                                setBulkDiscountDrafts((prev) =>
                                  prev.map((item, idx) =>
                                    idx === rowIndex ? { ...item, isActive: e.value } : item
                                  )
                                );
                              }}
                            />
                          )}
                        />
                        <Column
                          header="Acciones"
                          body={(row) => (
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                icon="pi pi-save"
                                text
                                severity="secondary"
                                loading={isUpdatingDiscount}
                                onClick={() => handleUpdateDiscount(row)}
                              />
                              <Button
                                type="button"
                                icon="pi pi-trash"
                                text
                                severity="danger"
                                loading={isDeletingDiscount}
                                onClick={() => setDiscountToDelete(row)}
                              />
                            </div>
                          )}
                        />
                      </DataTable>
                    )}

                    <Divider className="my-2" />

                    <div className="flex flex-column gap-2">
                      <span className="text-sm text-color-secondary">Nuevo descuento</span>
                      <div className="flex flex-wrap align-items-center gap-2">
                        <InputNumber
                          value={newBulkDiscount.minQuantity}
                          onValueChange={(e) =>
                            setNewBulkDiscount((prev) => ({
                              ...prev,
                              minQuantity: Number(e.value ?? 1),
                            }))
                          }
                          min={1}
                          placeholder="Mínimo"
                          data-testid={`${testId}-bulk-new-min`}
                        />
                        <InputNumber
                          value={newBulkDiscount.discountPercent}
                          onValueChange={(e) =>
                            setNewBulkDiscount((prev) => ({
                              ...prev,
                              discountPercent: Number(e.value ?? 0),
                            }))
                          }
                          min={0}
                          max={100}
                          placeholder="%"
                          data-testid={`${testId}-bulk-new-percent`}
                        />
                        <InputSwitch
                          checked={newBulkDiscount.isActive}
                          onChange={(e) =>
                            setNewBulkDiscount((prev) => ({
                              ...prev,
                              isActive: e.value,
                            }))
                          }
                        />
                        <Button
                          type="button"
                          label="Agregar"
                          icon="pi pi-plus"
                          loading={isCreatingDiscount}
                          onClick={handleCreateDiscount}
                          data-testid={`${testId}-bulk-new-add`}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabPanel>
          </TabView>
        ) : (
          <div className="flex flex-column gap-4">
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
                  />
                )}
              />
              {errors.code && (
                <small className="p-error">{errors.code.message}</small>
              )}
            </div>

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

            <small className="text-color-secondary">
              Podés agregar categorías, imágenes y descuentos después de crear el producto.
            </small>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-content-end mt-4">
          {isEditing && (
            <Button
              type="button"
              label="Eliminar producto"
              icon="pi pi-trash"
              severity="danger"
              outlined
              onClick={() => setDeleteProductDialogOpen(true)}
            />
          )}
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
      <Dialog
        header="Eliminar imagen"
        visible={!!imageToDelete}
        onHide={() => setImageToDelete(null)}
        modal
        className="w-full sm:w-26rem"
        footer={(
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined onClick={() => setImageToDelete(null)} />
            <Button
              label="Aceptar"
              severity="danger"
              loading={isDeletingImage}
              onClick={async () => {
                if (!imageToDelete) return;
                await handleDeleteImage(imageToDelete.id);
                setImageToDelete(null);
              }}
            />
          </div>
        )}
      >
        <p className="m-0">
          ¿Eliminar imagen{imageToDelete?.fileName ? ` "${imageToDelete.fileName}"` : ''}?
        </p>
      </Dialog>

      <Dialog
        header="Eliminar descuento"
        visible={!!discountToDelete}
        onHide={() => setDiscountToDelete(null)}
        modal
        className="w-full sm:w-26rem"
        footer={(
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined onClick={() => setDiscountToDelete(null)} />
            <Button
              label="Aceptar"
              severity="danger"
              loading={isDeletingDiscount}
              onClick={async () => {
                if (!discountToDelete) return;
                await handleDeleteDiscount(discountToDelete.id);
                setDiscountToDelete(null);
              }}
            />
          </div>
        )}
      >
        <p className="m-0">¿Eliminar descuento por cantidad?</p>
      </Dialog>

      <Dialog
        header="Eliminar producto"
        visible={deleteProductDialogOpen}
        onHide={() => setDeleteProductDialogOpen(false)}
        modal
        className="w-full sm:w-26rem"
        footer={(
          <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" outlined onClick={() => setDeleteProductDialogOpen(false)} />
            <Button
              label="Aceptar"
              severity="danger"
              loading={isDeletingProduct}
              onClick={async () => {
                await handleDeleteProduct();
                setDeleteProductDialogOpen(false);
              }}
            />
          </div>
        )}
      >
        <p className="m-0">¿Eliminar este producto? Esta acción no se puede deshacer.</p>
      </Dialog>
    </Card>
  );
}
