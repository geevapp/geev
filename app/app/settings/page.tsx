'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Bell,
  Camera,
  CreditCard,
  Loader2,
  Moon,
  Shield,
  Sun,
  Trash2,
  Wallet,
} from 'lucide-react';

import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/contexts/app-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useState, useRef } from 'react';
import { uploadAvatar } from '@/lib/storage';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, logout, toggleTheme, theme, setCurrentUser } = useAppContext();
  const router = useRouter();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          bio: formData.bio,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Failed to save', {
          description: data.error || 'Something went wrong. Please try again.',
        });
        return;
      }

      // Merge the returned fields back into the current user object so every
      // part of the UI (navbar, profile page) reflects the change immediately
      // without requiring a full page reload.
      setCurrentUser({ ...user, ...data.data });

      toast.success('Profile updated', {
        description: 'Your profile has been saved successfully.',
      });
    } catch {
      toast.error('Network error', {
        description: 'Could not reach the server. Please check your connection.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const avatarUrl = await uploadAvatar(file);
      
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl }),
      });

      if (!response.ok) throw new Error('Failed to update avatar');

      const data = await response.json();
      setCurrentUser({ ...user, avatarUrl: data.data.avatarUrl });
      toast.success('Avatar updated successfully');
    } catch (error) {
      toast.error('Failed to update avatar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        'Are you sure you want to delete your account? This action cannot be undone.',
      )
    ) {
      logout();
      router.push('/');
      toast.error('Account deleted', {
        description: 'Your account has been permanently deleted.',
      });
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/profile/${user?.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Profile
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        {/* Profile Settings */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your public profile information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="w-20 h-20 transition-opacity group-hover:opacity-50">
                  <AvatarImage
                    src={user?.avatarUrl || '/placeholder.svg'}
                    alt={user?.name}
                  />
                  <AvatarFallback className="text-lg">
                    {user?.name
                      ? user.name.split(' ').map((n: string) => n[0]).join('')
                      : 'U'}
                  </AvatarFallback>
                </Avatar>
                {isSaving && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isSaving}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Change Avatar
                </Button>
                <input
                  type="file"
                  ref={avatarInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarChange(file);
                  }}
                />
                <p className="text-[10px] text-gray-500">Max 10MB • PNG, JPG, GIF</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Wallet & Payments */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Wallet & Payments</CardTitle>
            <CardDescription>
              Manage your wallet and payment methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium">Wallet Balance</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    $0.00 available
                  </div>
                </div>
              </div>
              <Link href="/wallet">
                <Button size="sm">Manage Wallet</Button>
              </Link>
            </div>

            {user?.walletAddress && (
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">Connected Wallet</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {user.walletAddress}
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>
              Customize how the app looks and feels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
                <div>
                  <div className="font-medium">Dark Mode</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Switch between light and dark themes
                  </div>
                </div>
              </div>
              <Switch
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Receive updates via email
                  </div>
                </div>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, email: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                <div>
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Get notified about important updates
                  </div>
                </div>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, push: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-0 shadow-lg bg-red-50 dark:bg-red-900/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-red-600 dark:text-red-400">
                  Delete Account
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Permanently delete your account and all data
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}
