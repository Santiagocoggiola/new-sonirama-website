'use client';

import { useState, useCallback } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Navbar } from '@/components/layout/Navbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Footer } from '@/components/layout/Footer';

interface AdminLayoutProps {
  readonly children: React.ReactNode;
}

/**
 * Admin layout - used for admin users
 * Has admin navigation sidebar
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  return (
    <AuthGuard allowedRoles={['ADMIN']} testId="admin-guard">
      <div
        id="admin-layout"
        data-testid="admin-layout"
        className="min-h-screen surface-ground"
      >
        {/* Navbar - fixed at top */}
        <Navbar
          showSidebarToggle
          onSidebarToggle={toggleSidebar}
          testId="admin-navbar"
        />

        {/* Main wrapper - below fixed navbar */}
        <div
          className="flex gap-3"
          style={{ 
            paddingTop: 'var(--header-height)',
            minHeight: '100vh',
          }}
        >
          {/* Admin sidebar - sticky */}
          <AdminSidebar
            collapsed={sidebarCollapsed}
            testId="admin-sidebar"
          />

          {/* Main content */}
          <main
            id="admin-main"
            data-testid="admin-main"
            className="flex-1 flex flex-column min-w-0"
          >
            <div className="flex-1 p-3 md:p-4">
              {children}
            </div>

            {/* Footer */}
            <Footer testId="admin-footer" />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
