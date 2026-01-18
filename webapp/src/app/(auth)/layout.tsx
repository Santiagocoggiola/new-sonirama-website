import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Sonirama - Autenticación',
};

/**
 * Auth layout - used for login, forgot password, etc.
 * Centered card with logo and theme toggle
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="auth-layout"
      data-testid="auth-layout"
      className="min-h-screen flex align-items-center justify-content-center surface-ground p-4"
    >
      {/* Theme toggle in corner */}
      <div className="fixed top-0 right-0 p-3" style={{ zIndex: 1000 }}>
        <ThemeToggle testId="auth-theme-toggle" />
      </div>

      {/* Main content */}
      <div className="w-full" style={{ maxWidth: '640px' }}>
        {/* Card */}
        <div className="surface-card border-round-2xl shadow-3 p-5 md:p-6">
          {/* Logo header */}
          <div className="flex align-items-center justify-content-center gap-3 mb-5">
            <Image 
              src="/logo.svg" 
              alt="Sonirama" 
              width={40} 
              height={40}
              priority
            />
            <span className="text-2xl font-bold text-primary">Sonirama</span>
          </div>
          
          {/* Page content (login form, etc.) */}
          {children}
        </div>

        {/* Footer links */}
        <div className="flex align-items-center justify-content-center gap-3 mt-4 text-sm">
          <Link href="/contact" className="text-color-secondary hover:text-primary no-underline transition-colors">
            Contacto
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-color-secondary text-xs text-center m-0 mt-3">
          © {new Date().getFullYear()} Sonirama
        </p>
      </div>
    </div>
  );
}
