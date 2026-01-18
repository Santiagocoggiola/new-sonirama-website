'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { loginSchema, type LoginFormValues } from '@/schemas/auth.schema';
import { toastSuccess, toastError } from '@/components/ui/toast-service';

interface LoginFormProps {
  /** Callback after successful login */
  onSuccess?: () => void;
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Login form component with validation
 */
export function LoginForm({ onSuccess, testId = 'login-form' }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    const result = await login(values.email, values.password, values.remember);

    if (result.success) {
      toastSuccess('Bienvenido', `Ingresaste correctamente`);

      // Redirect based on role, with returnUrl as hint
      const returnUrl = searchParams.get('returnUrl');
      const decodedReturnUrl = returnUrl ? decodeURIComponent(returnUrl) : null;
      const isAdmin = String(result.role).toUpperCase() === 'ADMIN';
      const isAdminReturnUrl = !!decodedReturnUrl && decodedReturnUrl.startsWith('/admin');
      
      let targetUrl: string;
      if (isAdmin) {
        // Admin users: use returnUrl only if it's an admin route, otherwise go to admin/products
        if (decodedReturnUrl && isAdminReturnUrl) {
          targetUrl = decodedReturnUrl;
        } else {
          targetUrl = '/admin/products';
        }
      } else {
        // Regular users: ignore admin returnUrl and fall back to products
        if (decodedReturnUrl && !isAdminReturnUrl) {
          targetUrl = decodedReturnUrl;
        } else {
          targetUrl = '/products';
        }
      }
      
      console.log('Login redirect - isAdmin:', isAdmin, 'returnUrl:', returnUrl, 'targetUrl:', targetUrl);
      
      // Use window.location for hard redirect to ensure it works
      window.location.href = targetUrl;

      onSuccess?.();
    } else {
      setServerError(result.error || 'Error al iniciar sesión');
      toastError('Error', result.error);
    }
  });

  return (
    <form
      id={testId}
      data-testid={testId}
      onSubmit={onSubmit}
      className="flex flex-column gap-3"
    >
      {/* Server error message */}
      {serverError && (
        <Message
          id={`${testId}-server-error`}
          data-testid={`${testId}-server-error`}
          severity="error"
          text={serverError}
          className="w-full mb-2"
        />
      )}

      {/* Email field */}
      <div className="flex flex-column gap-1">
        <label htmlFor={`${testId}-email`} className="text-sm font-medium text-color">
          Email
        </label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <InputText
              id={`${testId}-email`}
              data-testid={`${testId}-email`}
              {...field}
              placeholder="tu@email.com"
              className={`w-full p-inputtext-sm ${errors.email ? 'p-invalid' : ''}`}
              autoComplete="email"
              aria-describedby={`${testId}-email-error`}
            />
          )}
        />
        {errors.email && (
          <small
            id={`${testId}-email-error`}
            data-testid={`${testId}-email-error`}
            className="p-error text-xs"
          >
            {errors.email.message}
          </small>
        )}
      </div>

      {/* Password field */}
      <div className="flex flex-column gap-1">
        <label htmlFor={`${testId}-password-input`} className="text-sm font-medium text-color">
          Contraseña
        </label>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Password
              id={`${testId}-password`}
              data-testid={`${testId}-password`}
              inputId={`${testId}-password-input`}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder="Tu contraseña"
              className={`w-full ${errors.password ? 'p-invalid' : ''}`}
              inputClassName="w-full p-inputtext-sm"
              toggleMask
              feedback={false}
              autoComplete="current-password"
              aria-describedby={`${testId}-password-error`}
            />
          )}
        />
        {errors.password && (
          <small
            id={`${testId}-password-error`}
            data-testid={`${testId}-password-error`}
            className="p-error text-xs"
          >
            {errors.password.message}
          </small>
        )}
      </div>

      {/* Remember me and forgot password */}
      <div className="flex align-items-center justify-content-between mt-1">
        <div className="flex align-items-center gap-2">
          <Controller
            name="remember"
            control={control}
            render={({ field }) => (
              <Checkbox
                inputId={`${testId}-remember`}
                data-testid={`${testId}-remember`}
                checked={!!field.value}
                onChange={(e) => field.onChange(!!e.checked)}
              />
            )}
          />
          <label
            htmlFor={`${testId}-remember`}
            className="cursor-pointer text-color-secondary text-sm"
          >
            Recordarme
          </label>
        </div>
        <Link 
          href="/forgot-password" 
          className="text-primary text-sm no-underline hover:underline"
          data-testid={`${testId}-forgot-password-link`}
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      {/* Submit button */}
      <Button
        id={`${testId}-submit`}
        data-testid={`${testId}-submit`}
        type="submit"
        label={isLoading ? 'Ingresando...' : 'Ingresar'}
        icon={isLoading ? 'pi pi-spin pi-spinner' : undefined}
        loading={isLoading}
        disabled={!isValid || isLoading}
        className="w-full mt-3"
      />
    </form>
  );
}
