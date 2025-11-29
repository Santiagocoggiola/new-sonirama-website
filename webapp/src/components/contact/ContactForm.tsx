'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useSendContactMessageMutation } from '@/store/api/contactApi';
import { contactSchema, type ContactFormValues } from '@/schemas/contact.schema';
import { showToast } from '@/components/ui/toast-service';

interface ContactFormProps {
  /** Test ID for Playwright */
  testId?: string;
}

/**
 * Contact form component
 */
export function ContactForm({ testId = 'contact-form' }: ContactFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [sendMessage, { isLoading }] = useSendContactMessageMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      await sendMessage(data).unwrap();
      setIsSuccess(true);
      reset();
      showToast({
        severity: 'success',
        summary: 'Mensaje enviado',
        detail: 'Tu mensaje fue enviado correctamente. Te responderemos pronto.',
        life: 5000,
      });
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === 'object' && 'data' in error
          ? (error.data as { message?: string })?.message || 'Error al enviar el mensaje'
          : 'Error al enviar el mensaje';
      
      showToast({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
        life: 5000,
      });
    }
  };

  if (isSuccess) {
    return (
      <div
        id={`${testId}-success`}
        data-testid={`${testId}-success`}
        className="flex flex-column align-items-center gap-3 text-center"
      >
        <i
          className="pi pi-check-circle text-green-500"
          style={{ fontSize: '4rem' }}
        />
        <h2 className="text-xl font-semibold m-0 text-color">
          ¡Gracias por tu mensaje!
        </h2>
        <p className="text-color-secondary m-0">
          Tu mensaje fue enviado correctamente. Te responderemos a la brevedad.
        </p>
        <Button
          id={`${testId}-send-another`}
          data-testid={`${testId}-send-another`}
          label="Enviar otro mensaje"
          outlined
          onClick={() => setIsSuccess(false)}
        />
      </div>
    );
  }

  return (
    <form
      id={testId}
      data-testid={testId}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-column gap-3"
      noValidate
    >
      {/* Name field */}
      <div className="flex flex-column gap-2">
        <label htmlFor={`${testId}-name`} className="font-medium text-color">
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
              placeholder="Tu nombre"
              className={`w-full ${errors.name ? 'p-invalid' : ''}`}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? `${testId}-name-error` : undefined}
            />
          )}
        />
        {errors.name && (
          <small
            id={`${testId}-name-error`}
            data-testid={`${testId}-name-error`}
            className="p-error"
          >
            {errors.name.message}
          </small>
        )}
      </div>

      {/* Email field */}
      <div className="flex flex-column gap-2">
        <label htmlFor={`${testId}-email`} className="font-medium text-color">
          Email <span className="text-red-500">*</span>
        </label>
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <InputText
              {...field}
              id={`${testId}-email`}
              data-testid={`${testId}-email`}
              type="email"
              placeholder="tu@email.com"
              className={`w-full ${errors.email ? 'p-invalid' : ''}`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? `${testId}-email-error` : undefined}
            />
          )}
        />
        {errors.email && (
          <small
            id={`${testId}-email-error`}
            data-testid={`${testId}-email-error`}
            className="p-error"
          >
            {errors.email.message}
          </small>
        )}
      </div>

      {/* Subject field */}
      <div className="flex flex-column gap-2">
        <label htmlFor={`${testId}-subject`} className="font-medium text-color">
          Asunto <span className="text-red-500">*</span>
        </label>
        <Controller
          name="subject"
          control={control}
          render={({ field }) => (
            <InputText
              {...field}
              id={`${testId}-subject`}
              data-testid={`${testId}-subject`}
              placeholder="Asunto del mensaje"
              className={`w-full ${errors.subject ? 'p-invalid' : ''}`}
              aria-invalid={!!errors.subject}
              aria-describedby={errors.subject ? `${testId}-subject-error` : undefined}
            />
          )}
        />
        {errors.subject && (
          <small
            id={`${testId}-subject-error`}
            data-testid={`${testId}-subject-error`}
            className="p-error"
          >
            {errors.subject.message}
          </small>
        )}
      </div>

      {/* Message field */}
      <div className="flex flex-column gap-2">
        <label htmlFor={`${testId}-message`} className="font-medium text-color">
          Mensaje <span className="text-red-500">*</span>
        </label>
        <Controller
          name="message"
          control={control}
          render={({ field }) => (
            <InputTextarea
              {...field}
              id={`${testId}-message`}
              data-testid={`${testId}-message`}
              placeholder="Escribí tu mensaje..."
              rows={5}
              autoResize
              className={`w-full ${errors.message ? 'p-invalid' : ''}`}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? `${testId}-message-error` : undefined}
            />
          )}
        />
        {errors.message && (
          <small
            id={`${testId}-message-error`}
            data-testid={`${testId}-message-error`}
            className="p-error"
          >
            {errors.message.message}
          </small>
        )}
      </div>

      {/* Submit button */}
      <Button
        id={`${testId}-submit`}
        data-testid={`${testId}-submit`}
        type="submit"
        label="Enviar mensaje"
        icon="pi pi-send"
        loading={isLoading}
        disabled={isLoading}
        className="w-full mt-2"
      />
    </form>
  );
}
