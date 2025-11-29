import { Metadata } from 'next';
import { ProfileView } from '@/components/profile/ProfileView';

export const metadata: Metadata = {
  title: 'Mi perfil - Sonirama',
  description: 'Tu perfil de usuario',
};

/**
 * User profile page
 */
export default function ProfilePage() {
  return (
    <div id="profile-page" data-testid="profile-page" className="flex flex-column gap-4">
      <h1 className="text-2xl font-bold m-0 text-color">
        Mi perfil
      </h1>
      
      <ProfileView testId="profile-view" />
    </div>
  );
}
