import { Metadata } from 'next';
import VerifyEmailClient from './VerifyEmailClient';

export const metadata: Metadata = {
  title: 'Verificar cuenta - Sonirama',
  description: 'Verificación de email para activar tu cuenta Sonirama.',
};

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string; code?: string };
}) {
  const email = typeof searchParams.email === 'string' ? searchParams.email : undefined;
  const code = typeof searchParams.code === 'string' ? searchParams.code : undefined;

  return <VerifyEmailClient email={email} code={code} />;
}
