'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

/**
 * Dashboard layout - used for regular users (buyers)
 * Clean layout with navbar - filters are in the products page
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard testId="dashboard-guard">
      <div
        id="dashboard-layout"
        data-testid="dashboard-layout"
        className="min-h-screen flex flex-column surface-ground"
      >
        {/* Navbar */}
        <Navbar testId="dashboard-navbar" />

        {/* Main content */}
        <main
          id="dashboard-main"
          data-testid="dashboard-main"
          className="flex-1 flex flex-column"
          style={{ marginTop: 'var(--header-height)' }}
        >
          <div
            className="flex-1 p-3 md:p-4 lg:p-5"
            style={{ maxWidth: '100%' }}
          >
            {children}
          </div>

          {/* Footer */}
          <Footer testId="dashboard-footer" />
        </main>
      </div>
    </AuthGuard>
  );
}
