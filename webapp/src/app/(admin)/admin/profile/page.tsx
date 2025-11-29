import { Metadata } from 'next';
import { ProfileView } from '@/components/profile/ProfileView';

export const metadata: Metadata = {
  title: 'Mi perfil - Admin - Sonirama',
  description: 'Tu perfil de administrador',
};

/**
 * Admin profile page
 */
export default function AdminProfilePage() {
  return (
    <div id="admin-profile-page" data-testid="admin-profile-page" className="flex flex-column gap-4">
      <h1 className="text-2xl font-bold m-0 text-color">
        Mi perfil
      </h1>
      
      <ProfileView testId="admin-profile-view" />
    </div>
  );
}
