'use client';

import { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '@/store/api/categoriesApi';
import { categoryCreateSchema, type CategoryCreateFormValues } from '@/schemas/category.schema';
import { showToast } from '@/components/ui/toast-service';
import { EmptyState } from '@/components/ui/EmptyState';
import type { CategoryDto } from '@/types/category';

interface AdminCategoriesTableProps {
  testId?: string;
}

export function AdminCategoriesTable({ testId = 'admin-categories-table' }: AdminCategoriesTableProps) {
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);

  const { data, isLoading, isError } = useGetCategoriesQuery({ pageSize: 100 });
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const categories = data?.items ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryCreateFormValues>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: { name: '', slug: '', description: '', isActive: true },
  });

  const openDialog = (category?: CategoryDto) => {
    setEditingCategory(category || null);
    reset(category 
      ? { name: category.name, slug: category.slug, description: category.description || '', isActive: category.isActive } 
      : { name: '', slug: '', description: '', isActive: true }
    );
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setEditingCategory(null);
    reset({ name: '', slug: '', description: '', isActive: true });
  };

  const onSubmit = async (data: CategoryCreateFormValues) => {
    try {
      if (editingCategory) {
        await updateCategory({ id: editingCategory.id, body: data }).unwrap();
        showToast({ severity: 'success', summary: 'Categoría actualizada', detail: 'La categoría fue actualizada correctamente' });
      } else {
        await createCategory(data).unwrap();
        showToast({ severity: 'success', summary: 'Categoría creada', detail: 'La categoría fue creada correctamente' });
      }
      closeDialog();
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'data' in error
        ? (error.data as { message?: string })?.message || 'Error al guardar'
        : 'Error al guardar';
      showToast({ severity: 'error', summary: 'Error', detail: errorMessage });
    }
  };

  const handleDelete = async (category: CategoryDto) => {
    if (confirm(`¿Eliminar la categoría "${category.name}"?`)) {
      try {
        await deleteCategory(category.id).unwrap();
        showToast({ severity: 'success', summary: 'Categoría eliminada' });
      } catch {
        showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la categoría' });
      }
    }
  };

  const statusTemplate = (category: CategoryDto) => (
    <Tag severity={category.isActive ? 'success' : 'danger'} value={category.isActive ? 'Activa' : 'Inactiva'} />
  );

  const actionsTemplate = (category: CategoryDto) => (
    <div className="flex gap-1">
      <Button icon="pi pi-pencil" rounded text severity="secondary" onClick={() => openDialog(category)} />
      <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => handleDelete(category)} />
    </div>
  );

  if (isLoading) {
    return <div className="flex justify-content-center py-8"><ProgressSpinner /></div>;
  }

  if (isError) {
    return <EmptyState testId={`${testId}-error`} icon="pi pi-exclamation-circle" title="Error" message="No se pudieron cargar las categorías" />;
  }

  return (
    <div id={testId} data-testid={testId}>
      <div className="flex justify-content-end mb-4">
        <Button label="Nueva categoría" icon="pi pi-plus" onClick={() => openDialog()} data-testid={`${testId}-create`} />
      </div>

      {categories.length === 0 ? (
        <EmptyState testId={`${testId}-empty`} icon="pi pi-tags" title="No hay categorías" message="Creá tu primera categoría." action={{ label: 'Crear categoría', onClick: () => openDialog() }} />
      ) : (
        <DataTable value={categories} dataKey="id" className="surface-card border-round" stripedRows>
          <Column field="name" header="Nombre" sortable />
          <Column field="description" header="Descripción" />
          <Column field="isActive" header="Estado" body={statusTemplate} />
          <Column header="Acciones" body={actionsTemplate} style={{ width: '120px' }} />
        </DataTable>
      )}

      <Dialog header={editingCategory ? 'Editar categoría' : 'Nueva categoría'} visible={dialogVisible} onHide={closeDialog} style={{ width: '450px' }}>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-column gap-3">
          <div className="flex flex-column gap-2">
            <label htmlFor="category-name" className="font-medium">Nombre *</label>
            <Controller name="name" control={control} render={({ field }) => <InputText {...field} id="category-name" className={`w-full ${errors.name ? 'p-invalid' : ''}`} />} />
            {errors.name && <small className="p-error">{errors.name.message}</small>}
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="category-slug" className="font-medium">Slug *</label>
            <Controller name="slug" control={control} render={({ field }) => <InputText {...field} id="category-slug" className={`w-full ${errors.slug ? 'p-invalid' : ''}`} />} />
            {errors.slug && <small className="p-error">{errors.slug.message}</small>}
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="category-description" className="font-medium">Descripción</label>
            <Controller name="description" control={control} render={({ field }) => <InputText {...field} value={field.value ?? ''} id="category-description" className="w-full" />} />
          </div>
          <div className="flex align-items-center gap-2">
            <Controller name="isActive" control={control} render={({ field }) => (
              <InputSwitch inputId="category-isActive" checked={field.value} onChange={(e) => field.onChange(e.value)} />
            )} />
            <label htmlFor="category-isActive" className="font-medium">Activa</label>
          </div>
          <div className="flex justify-content-end gap-2 mt-3">
            <Button type="button" label="Cancelar" outlined severity="secondary" onClick={closeDialog} />
            <Button type="submit" label={editingCategory ? 'Actualizar' : 'Crear'} loading={isCreating || isUpdating} />
          </div>
        </form>
      </Dialog>
    </div>
  );
}
