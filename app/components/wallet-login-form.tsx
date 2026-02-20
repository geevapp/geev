'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Copy, Key, Mail, User, Wallet } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { signIn, signOut, useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/contexts/app-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Wallet-based login and registration form
 */
export function WalletLoginForm() {
  const router = useRouter();
  // Simple toast simulation
  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success',
  ) => {
    console.log(`[${type}] ${message}`);
    // In a real app, you would use a proper toast library
  };
  const { login: contextLogin } = useAppContext();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [signature, setSignature] = useState('');
  const [message, setMessage] = useState('');

  // Generate a mock signature for demo purposes
  const generateMockSignature = () => {
    // In a real app, this would come from the wallet provider
    const mockSignature = '0x' + Math.random().toString(36).substring(2, 30);
    setSignature(mockSignature);
    return mockSignature;
  };

  // Generate sign message
  const generateSignMessage = () => {
    const timestamp = new Date().toISOString();
    const msg = `Sign this message to authenticate with Geev\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
    setMessage(msg);
    return msg;
  };

  const handleLogin = async () => {
    if (!walletAddress || !signature || !message) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Try NextAuth login first
      const result = await signIn('credentials', {
        walletAddress,
        signature,
        message,
        redirect: false,
      });

      if (result?.ok) {
        showToast('Successfully logged in!', 'success');
        router.push('/feed');
        return;
      }

      // Fallback to custom API endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update app context with user data
        contextLogin(data.user);
        showToast('Successfully logged in!', 'success');
        router.push('/feed');
      } else {
        showToast(data.error || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!walletAddress || !username || !signature || !message) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
          username,
          email: email || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update app context with user data
        contextLogin(data.user);
        showToast('Account created successfully!', 'success');
        router.push('/feed');
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast('Registration failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });

      // Also call custom logout endpoint
      await fetch('/api/auth/logout', { method: 'POST' });

      showToast('Successfully logged out!', 'success');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      showToast('Logout failed', 'error');
    }
  };

  // If user is already logged in
  if (status === 'authenticated' || session) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Already Logged In
          </CardTitle>
          <CardDescription className="text-center">
            You are currently logged in
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => router.push('/feed')} className="w-full">
            Go to Feed
          </Button>
          <Button variant="outline" onClick={handleLogout} className="w-full">
            Logout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
        <CardDescription>
          Login or create an account using your wallet address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'login' | 'register')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Signature</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Signature from wallet"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateMockSignature}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message to Sign</label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Message to sign..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={generateSignMessage}
                >
                  Generate
                </Button>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Wallet Address</label>
              <div className="relative">
                <Wallet className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Signature</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Signature from wallet"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateMockSignature}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message to Sign</label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Message to sign..."
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={generateSignMessage}
                >
                  Generate
                </Button>
              </div>
            </div>

            <Button
              onClick={handleRegister}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
          <p className="text-sm text-orange-700 dark:text-orange-300">
            <strong>Note:</strong> This is a demo implementation. In production,
            you would integrate with actual wallet providers like MetaMask or
            WalletConnect.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
