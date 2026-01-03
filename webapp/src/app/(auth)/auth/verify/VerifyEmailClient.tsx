'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useConfirmEmailVerificationMutation } from '@/store/api/usersApi';

type Status = 'checking' | 'success' | 'error';

type Props = {
  email?: string;
  code?: string;
};

export default function VerifyEmailClient({ email, code }: Props) {
  const router = useRouter();
  const [confirmVerification] = useConfirmEmailVerificationMutation();
  const [status, setStatus] = useState<Status>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    if (!email || !code) {
      setStatus('error');
      setErrorMessage('Faltan parámetros de verificación.');
      return undefined;
    }

    confirmVerification({ email, code })
      .unwrap()
      .then(() => {
        setStatus('success');
        redirectTimer = setTimeout(() => router.replace('/login'), 1500);
      })
      .catch((err) => {
        const message = err?.data?.message ?? 'No pudimos verificar tu cuenta. Probá nuevamente.';
        setErrorMessage(message);
        setStatus('error');
      });

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [code, confirmVerification, email, router]);

  return (
    <div className="flex flex-column gap-4" data-testid="verify-email-page">
      <div className="flex flex-column gap-2 text-center">
        <h2 className="m-0 text-2xl">Verificando tu cuenta</h2>
        <p className="m-0 text-color-secondary">
          Estamos confirmando tu email. Te redirigiremos al inicio de sesión.
        </p>
      </div>

      {status === 'checking' && (
        <div className="flex align-items-center justify-content-center">
          <ProgressSpinner strokeWidth="4" style={{ width: '3rem', height: '3rem' }} />
        </div>
      )}

      {status === 'success' && (
        <Message severity="success" text="Cuenta verificada. Redirigiendo al login..." />
      )}

      {status === 'error' && (
        <Message
          severity="error"
          text={errorMessage ?? 'No pudimos verificar tu cuenta. Probá nuevamente.'}
        />
      )}

      <div className="text-center text-sm">
        <p className="m-0 text-color-secondary">
          Si no redirige automáticamente, <Link href="/login">ir al login</Link>.
        </p>
      </div>
    </div>
  );
}
