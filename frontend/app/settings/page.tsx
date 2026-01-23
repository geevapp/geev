import type { Metadata } from 'next';
import { AuthGuard } from '@/components/auth-guard';

export const metadata: Metadata = {
  title: 'Settings | Geev',
  description: 'Manage your account settings',
};

export default function SettingsPage() {
  return (
    <AuthGuard>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <p className="text-muted-foreground">
          Settings content will be implemented here
        </p>
      </div>
    </AuthGuard>
  );
}
