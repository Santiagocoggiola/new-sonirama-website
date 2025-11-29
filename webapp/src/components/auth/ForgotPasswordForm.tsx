'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { FloatLabel } from 'primereact/floatlabel';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { usePasswordResetStartMutation, usePasswordResetConfirmMutation } from '@/store/api/usersApi';
import {
  passwordResetStartSchema,
  passwordResetConfirmSchema,
  type PasswordResetStartFormValues,
  type PasswordResetConfirmFormValues,
} from '@/schemas/auth.schema';
import { toastSuccess, toastError } from '@/components/ui/toast-service';

type Step = 'email' | 'code' | 'success';

interface ForgotPasswordFormProps {
  /** Callback when process is completed */
  onComplete?: () => void;
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Forgot password form with multi-step flow
 * Step 1: Enter email
 * Step 2: Enter verification code
 * Step 3: Success message
 */
export function ForgotPasswordForm({
  onComplete,
  testId = 'forgot-password-form',
}: ForgotPasswordFormProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const [startReset, { isLoading: isStarting }] = usePasswordResetStartMutation();
  const [confirmReset, { isLoading: isConfirming }] = usePasswordResetConfirmMutation();

  // Email step form
  const emailForm = useForm<PasswordResetStartFormValues>({
    resolver: zodResolver(passwordResetStartSchema),
    mode: 'onChange',
    defaultValues: { email: '' },
  });

  // Code step form
  const codeForm = useForm<PasswordResetConfirmFormValues>({
    resolver: zodResolver(passwordResetConfirmSchema),
    mode: 'onChange',
    defaultValues: { email: '', code: '' },
  });

  const handleEmailSubmit = emailForm.handleSubmit(async (values) => {
    setServerError(null);

    try {
      await startReset(values.email).unwrap();
      setEmail(values.email);
      codeForm.setValue('email', values.email);
      setStep('code');
      toastSuccess('Código enviado', 'Revisá tu email para obtener el código');
    } catch (err) {
      const errorMessage =
        (err as { data?: { error?: string } })?.data?.error ||
        'Error al enviar el código';
      setServerError(errorMessage);
      toastError('Error', errorMessage);
    }
  });

  const handleCodeSubmit = codeForm.handleSubmit(async (values) => {
    setServerError(null);

    try {
      await confirmReset({ email: values.email, code: values.code }).unwrap();
      setStep('success');
      toastSuccess('Contraseña restablecida', 'Recibirás un email con tu nueva contraseña');
      onComplete?.();
    } catch (err) {
      const errorMessage =
        (err as { data?: { error?: string } })?.data?.error ||
        'Código inválido o expirado';
      setServerError(errorMessage);
      toastError('Error', errorMessage);
    }
  });

  // Step 1: Email input
  if (step === 'email') {
    return (
      <form
        id={`${testId}-email-step`}
        data-testid={`${testId}-email-step`}
        onSubmit={handleEmailSubmit}
        className="flex flex-column gap-4"
      >
        <p className="text-color-secondary mt-0 mb-3">
          Ingresá tu email y te enviaremos un código de verificación para restablecer tu contraseña.
        </p>

        {serverError && (
          <Message
            id={`${testId}-server-error`}
            data-testid={`${testId}-server-error`}
            severity="error"
            text={serverError}
            className="w-full"
          />
        )}

        <div className="flex flex-column gap-2">
          <FloatLabel>
            <IconField iconPosition="left" className="w-full">
              <InputIcon className="pi pi-envelope" />
              <Controller
                name="email"
                control={emailForm.control}
                render={({ field }) => (
                  <InputText
                    id={`${testId}-email`}
                    data-testid={`${testId}-email`}
                    {...field}
                    placeholder="correo@ejemplo.com"
                    className={`w-full ${emailForm.formState.errors.email ? 'p-invalid' : ''}`}
                    autoComplete="email"
                  />
                )}
              />
            </IconField>
            <label htmlFor={`${testId}-email`} style={{ left: '2.5rem' }}>
              Email
            </label>
          </FloatLabel>
          {emailForm.formState.errors.email && (
            <small
              id={`${testId}-email-error`}
              data-testid={`${testId}-email-error`}
              className="p-error"
            >
              {emailForm.formState.errors.email.message}
            </small>
          )}
        </div>

        <Button
          id={`${testId}-email-submit`}
          data-testid={`${testId}-email-submit`}
          type="submit"
          label={isStarting ? 'Enviando...' : 'Enviar código'}
          icon={isStarting ? 'pi pi-spin pi-spinner' : 'pi pi-send'}
          disabled={!emailForm.formState.isValid || isStarting}
          className="w-full"
        />
      </form>
    );
  }

  // Step 2: Code verification
  if (step === 'code') {
    return (
      <form
        id={`${testId}-code-step`}
        data-testid={`${testId}-code-step`}
        onSubmit={handleCodeSubmit}
        className="flex flex-column gap-4"
      >
        <Message
          severity="info"
          text={`Se envió un código de verificación a ${email}`}
          className="w-full"
        />

        {serverError && (
          <Message
            id={`${testId}-server-error`}
            data-testid={`${testId}-server-error`}
            severity="error"
            text={serverError}
            className="w-full"
          />
        )}

        <div className="flex flex-column gap-2">
          <FloatLabel>
            <IconField iconPosition="left" className="w-full">
              <InputIcon className="pi pi-key" />
              <Controller
                name="code"
                control={codeForm.control}
                render={({ field }) => (
                  <InputText
                    id={`${testId}-code`}
                    data-testid={`${testId}-code`}
                    {...field}
                    placeholder="123456"
                    className={`w-full ${codeForm.formState.errors.code ? 'p-invalid' : ''}`}
                    maxLength={6}
                    keyfilter="int"
                  />
                )}
              />
            </IconField>
            <label htmlFor={`${testId}-code`} style={{ left: '2.5rem' }}>
              Código de verificación
            </label>
          </FloatLabel>
          {codeForm.formState.errors.code && (
            <small
              id={`${testId}-code-error`}
              data-testid={`${testId}-code-error`}
              className="p-error"
            >
              {codeForm.formState.errors.code.message}
            </small>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            id={`${testId}-code-back`}
            data-testid={`${testId}-code-back`}
            type="button"
            label="Volver"
            icon="pi pi-arrow-left"
            severity="secondary"
            outlined
            onClick={() => {
              setStep('email');
              setServerError(null);
            }}
            className="flex-1"
          />
          <Button
            id={`${testId}-code-submit`}
            data-testid={`${testId}-code-submit`}
            type="submit"
            label={isConfirming ? 'Verificando...' : 'Verificar'}
            icon={isConfirming ? 'pi pi-spin pi-spinner' : 'pi pi-check'}
            disabled={!codeForm.formState.isValid || isConfirming}
            className="flex-1"
          />
        </div>
      </form>
    );
  }

  // Step 3: Success
  return (
    <div
      id={`${testId}-success-step`}
      data-testid={`${testId}-success-step`}
      className="flex flex-column align-items-center gap-4 p-4"
    >
      <i
        className="pi pi-check-circle text-6xl"
        style={{ color: 'var(--success-color)' }}
      />
      <h3 className="text-xl font-semibold m-0">¡Contraseña restablecida!</h3>
      <p className="text-color-secondary text-center m-0">
        Te enviamos un email con tu nueva contraseña temporal. 
        Recordá cambiarla después de iniciar sesión.
      </p>
    </div>
  );
}
