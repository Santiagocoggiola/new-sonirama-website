'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Divider } from 'primereact/divider';
import { Password } from 'primereact/password';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateProfileMutation, useChangePasswordMutation } from '@/store/api/usersApi';
import { updateProfileSchema, changePasswordSchema } from '@/schemas/user.schema';
import type { UpdateProfileFormData, ChangePasswordFormData } from '@/schemas/user.schema';
import { showToast } from '@/components/ui/toast-service';

interface ProfileViewProps {
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * User profile view and edit component
 */
export function ProfileView({ testId = 'profile-view' }: ProfileViewProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPwd }] = useChangePasswordMutation();

  // Profile form
  const {
    control: profileControl,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phoneNumber ?? '',
    },
  });

  // Password form
  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onProfileSubmit = async (data: UpdateProfileFormData) => {
    try {
      await updateProfile(data).unwrap();
      showToast({
        severity: 'success',
        summary: 'Perfil actualizado',
        detail: 'Tu perfil fue actualizado correctamente',
      });
      setIsEditing(false);
      // Profile data will update via RTK Query cache invalidation
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'data' in error
          ? (error.data as { message?: string })?.message || 'Error al actualizar el perfil'
          : 'Error al actualizar el perfil';
      showToast({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
      });
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }).unwrap();
      showToast({
        severity: 'success',
        summary: 'Contraseña actualizada',
        detail: 'Tu contraseña fue cambiada correctamente',
      });
      setIsChangingPassword(false);
      resetPassword();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'data' in error
          ? (error.data as { message?: string })?.message || 'Error al cambiar la contraseña'
          : 'Error al cambiar la contraseña';
      showToast({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    resetProfile({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phoneNumber ?? '',
    });
  };

  const handleCancelPassword = () => {
    setIsChangingPassword(false);
    resetPassword();
  };

  if (isAuthLoading) {
    return (
      <div
        id={`${testId}-loading`}
        data-testid={`${testId}-loading`}
        className="flex align-items-center justify-content-center py-8"
      >
        <ProgressSpinner
          style={{ width: '50px', height: '50px' }}
          strokeWidth="4"
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div id={testId} data-testid={testId} className="flex flex-column gap-4">
      {/* Profile info card */}
      <Card
        id={`${testId}-info`}
        data-testid={`${testId}-info`}
        title="Información personal"
      >
        {isEditing ? (
          <form onSubmit={handleProfileSubmit(onProfileSubmit)}>
            <div className="flex flex-column gap-3">
              {/* First name */}
              <div className="flex flex-column gap-2">
                <label htmlFor={`${testId}-firstName`} className="font-medium">
                  Nombre
                </label>
                <Controller
                  name="firstName"
                  control={profileControl}
                  render={({ field }) => (
                    <InputText
                      {...field}
                      id={`${testId}-firstName`}
                      data-testid={`${testId}-firstName`}
                      className={`w-full ${profileErrors.firstName ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                {profileErrors.firstName && (
                  <small className="p-error">{profileErrors.firstName.message}</small>
                )}
              </div>

              {/* Last name */}
              <div className="flex flex-column gap-2">
                <label htmlFor={`${testId}-lastName`} className="font-medium">
                  Apellido
                </label>
                <Controller
                  name="lastName"
                  control={profileControl}
                  render={({ field }) => (
                    <InputText
                      {...field}
                      id={`${testId}-lastName`}
                      data-testid={`${testId}-lastName`}
                      className={`w-full ${profileErrors.lastName ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                {profileErrors.lastName && (
                  <small className="p-error">{profileErrors.lastName.message}</small>
                )}
              </div>

              {/* Phone */}
              <div className="flex flex-column gap-2">
                <label htmlFor={`${testId}-phone`} className="font-medium">
                  Teléfono
                </label>
                <Controller
                  name="phone"
                  control={profileControl}
                  render={({ field }) => (
                    <InputText
                      {...field}
                      id={`${testId}-phone`}
                      data-testid={`${testId}-phone`}
                      value={field.value ?? ''}
                      className={`w-full ${profileErrors.phone ? 'p-invalid' : ''}`}
                    />
                  )}
                />
                {profileErrors.phone && (
                  <small className="p-error">{profileErrors.phone.message}</small>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <Button
                  type="submit"
                  label="Guardar"
                  icon="pi pi-check"
                  loading={isUpdating}
                />
                <Button
                  type="button"
                  label="Cancelar"
                  icon="pi pi-times"
                  outlined
                  severity="secondary"
                  onClick={handleCancelEdit}
                />
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-column gap-3">
            <div className="flex flex-column gap-1">
              <span className="text-color-secondary text-sm">Email</span>
              <span className="font-medium" data-testid={`${testId}-email-value`}>
                {user.email}
              </span>
            </div>

            <div className="flex flex-column gap-1">
              <span className="text-color-secondary text-sm">Nombre</span>
              <span className="font-medium" data-testid={`${testId}-name-value`}>
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : '-'}
              </span>
            </div>

            <div className="flex flex-column gap-1">
              <span className="text-color-secondary text-sm">Teléfono</span>
              <span className="font-medium" data-testid={`${testId}-phone-value`}>
                {user.phoneNumber || '-'}
              </span>
            </div>

            <Button
              id={`${testId}-edit`}
              data-testid={`${testId}-edit`}
              label="Editar perfil"
              icon="pi pi-pencil"
              outlined
              className="w-fit mt-2"
              onClick={() => setIsEditing(true)}
            />
          </div>
        )}
      </Card>

      {/* Change password card */}
      <Card
        id={`${testId}-password`}
        data-testid={`${testId}-password`}
        title="Cambiar contraseña"
      >
        {isChangingPassword ? (
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            <div className="flex flex-column gap-3">
              {/* Current password */}
              <div className="flex flex-column gap-2">
                <label htmlFor={`${testId}-currentPassword`} className="font-medium">
                  Contraseña actual
                </label>
                <Controller
                  name="currentPassword"
                  control={passwordControl}
                  render={({ field }) => (
                    <Password
                      {...field}
                      id={`${testId}-currentPassword`}
                      data-testid={`${testId}-currentPassword`}
                      toggleMask
                      feedback={false}
                      className={`w-full ${passwordErrors.currentPassword ? 'p-invalid' : ''}`}
                      inputClassName="w-full"
                    />
                  )}
                />
                {passwordErrors.currentPassword && (
                  <small className="p-error">{passwordErrors.currentPassword.message}</small>
                )}
              </div>

              {/* New password */}
              <div className="flex flex-column gap-2">
                <label htmlFor={`${testId}-newPassword`} className="font-medium">
                  Nueva contraseña
                </label>
                <Controller
                  name="newPassword"
                  control={passwordControl}
                  render={({ field }) => (
                    <Password
                      {...field}
                      id={`${testId}-newPassword`}
                      data-testid={`${testId}-newPassword`}
                      toggleMask
                      className={`w-full ${passwordErrors.newPassword ? 'p-invalid' : ''}`}
                      inputClassName="w-full"
                    />
                  )}
                />
                {passwordErrors.newPassword && (
                  <small className="p-error">{passwordErrors.newPassword.message}</small>
                )}
              </div>

              {/* Confirm new password */}
              <div className="flex flex-column gap-2">
                <label htmlFor={`${testId}-confirmNewPassword`} className="font-medium">
                  Confirmar nueva contraseña
                </label>
                <Controller
                  name="confirmNewPassword"
                  control={passwordControl}
                  render={({ field }) => (
                    <Password
                      {...field}
                      id={`${testId}-confirmNewPassword`}
                      data-testid={`${testId}-confirmNewPassword`}
                      toggleMask
                      feedback={false}
                      className={`w-full ${passwordErrors.confirmNewPassword ? 'p-invalid' : ''}`}
                      inputClassName="w-full"
                    />
                  )}
                />
                {passwordErrors.confirmNewPassword && (
                  <small className="p-error">{passwordErrors.confirmNewPassword.message}</small>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-2">
                <Button
                  type="submit"
                  label="Cambiar contraseña"
                  icon="pi pi-lock"
                  loading={isChangingPwd}
                />
                <Button
                  type="button"
                  label="Cancelar"
                  icon="pi pi-times"
                  outlined
                  severity="secondary"
                  onClick={handleCancelPassword}
                />
              </div>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-color-secondary m-0 mb-3">
              Para tu seguridad, te recomendamos cambiar tu contraseña periódicamente.
            </p>
            <Button
              id={`${testId}-change-password`}
              data-testid={`${testId}-change-password`}
              label="Cambiar contraseña"
              icon="pi pi-lock"
              outlined
              onClick={() => setIsChangingPassword(true)}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
