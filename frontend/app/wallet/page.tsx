import type { Metadata } from 'next';
import { AuthGuard } from '@/components/auth-guard';

export const metadata: Metadata = {
  title: 'Wallet | Geev',
  description: 'Manage your wallet and tokens',
};

export default function WalletPage() {
  return (
    <AuthGuard>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Wallet</h1>
        <p className="text-muted-foreground">
          Wallet management will be implemented here
        </p>
      </div>
    </AuthGuard>
  );
}
