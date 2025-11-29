import { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Recuperar contraseña - Sonirama',
  description: 'Recuperá tu contraseña de Sonirama',
};

/**
 * Forgot password page
 */
export default function ForgotPasswordPage() {
  return (
    <div id="forgot-password-page" data-testid="forgot-password-page">
      <h1 className="text-2xl font-bold text-center m-0 mb-4 text-color">
        Recuperar contraseña
      </h1>
      <ForgotPasswordForm testId="forgot-password-form" />
    </div>
  );
}
