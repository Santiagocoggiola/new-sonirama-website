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
import { MultiSelect } from 'primereact/multiselect';
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
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryDto | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError } = useGetCategoriesQuery({ pageSize: 100, query: searchQuery || undefined });
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();

  const categories = data?.items ?? [];
  const parentOptions = categories.map((cat) => ({ label: cat.name, value: cat.id }));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryCreateFormValues>({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: { name: '', description: '', isActive: true, parentIds: [] },
  });

  const openDialog = (category?: CategoryDto) => {
    setEditingCategory(category || null);
    reset(category 
      ? { name: category.name, description: category.description || '', isActive: category.isActive, parentIds: category.parentIds?.map((id) => id) ?? [] } 
      : { name: '', description: '', isActive: true, parentIds: [] }
    );
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setEditingCategory(null);
    reset({ name: '', description: '', isActive: true, parentIds: [] });
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

  const handleDeleteConfirmed = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id).unwrap();
      showToast({ severity: 'success', summary: 'Categoría eliminada' });
    } catch {
      showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la categoría' });
    } finally {
      setCategoryToDelete(null);
    }
  };

  const statusTemplate = (category: CategoryDto) => (
    <div className="flex align-items-center gap-2">
      <Tag severity={category.isActive ? 'success' : 'danger'} value={category.isActive ? 'Activa' : 'Inactiva'} />
      <InputSwitch
        checked={category.isActive}
        onChange={async (e) => {
          try {
            await updateCategory({
              id: category.id,
              body: {
                name: category.name,
                description: category.description ?? '',
                isActive: e.value,
                parentIds: category.parentIds ?? [],
              },
            }).unwrap();
            showToast({ severity: 'success', summary: e.value ? 'Categoría activada' : 'Categoría desactivada' });
          } catch {
            showToast({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la categoría' });
          }
        }}
        disabled={isUpdating}
      />
    </div>
  );

  const actionsTemplate = (category: CategoryDto) => (
    <div className="flex gap-1">
      <Button
        icon="pi pi-pencil"
        rounded
        text
        severity="secondary"
        data-testid={`${testId}-category-${category.id}-edit`}
        onClick={() => openDialog(category)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        text
        severity="danger"
        data-testid={`${testId}-category-${category.id}-delete`}
        onClick={() => setCategoryToDelete(category)}
      />
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
      <div className="flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
        <InputText
          id={`${testId}-search`}
          data-testid={`${testId}-search`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar categorías..."
          className="w-full sm:w-20rem"
        />
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
            <label htmlFor="category-description" className="font-medium">Descripción</label>
            <Controller name="description" control={control} render={({ field }) => <InputText {...field} value={field.value ?? ''} id="category-description" className="w-full" />} />
          </div>
          <div className="flex flex-column gap-2">
            <label htmlFor="category-parents" className="font-medium">Categorías padre</label>
            <Controller
              name="parentIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  {...field}
                  value={field.value || []}
                  id="category-parents"
                  data-testid="category-parents"
                  options={parentOptions.filter((opt) => !editingCategory || opt.value !== editingCategory.id)}
                  placeholder="Seleccioná categorías padre"
                  className={`w-full ${errors.parentIds ? 'p-invalid' : ''}`}
                  display="chip"
                />
              )}
            />
            {errors.parentIds && <small className="p-error">{errors.parentIds.message as string}</small>}
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

      <Dialog
        header="Confirmar eliminación"
        visible={!!categoryToDelete}
        onHide={() => setCategoryToDelete(null)}
        style={{ width: '420px' }}
      >
        <p className="m-0">
          ¿Seguro que querés eliminar la categoría "{categoryToDelete?.name}"?
        </p>
        <div className="flex justify-content-end gap-2 mt-4">
          <Button type="button" label="Cancelar" outlined severity="secondary" onClick={() => setCategoryToDelete(null)} />
          <Button type="button" label="Aceptar" icon="pi pi-trash" severity="danger" onClick={handleDeleteConfirmed} />
        </div>
      </Dialog>
    </div>
  );
}
