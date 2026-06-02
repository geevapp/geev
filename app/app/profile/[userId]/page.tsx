'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Gift, Mail, Save, Settings, Shield, Star, Wallet, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AvatarUpload } from '@/components/avatar-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { AchievementsDialog } from '@/components/achievements-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FollowListDialog } from '@/components/follow-list-dialog';
import { PostCard } from '@/components/post-card';
import { UserRankBadge } from '@/components/user-rank-badge';
import { useAppContext } from '@/contexts/app-context';
import { mapApiPostToClientPost } from '@/lib/map-api-post';
import type {
  Badge as UserBadge,
  Post,
  ProfileVisibility,
  UserRank,
} from '@/lib/types';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

type ProfileUser = {
  id: string;
  name: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  email: string | null;
  walletAddress: string;
  profileVisibility: ProfileVisibility;
  showEmail: boolean;
  showWalletAddress: boolean;
  badges: UserBadge[];
  isFollowing?: boolean;
  isVerified?: boolean;
  rank: UserRank;
  createdAt: string | Date;
  _count?: {
    followers?: number;
    followings?: number;
  };
};

export default function ProfilePage() {
  const params = useParams();
  const { user: currentUser, setCurrentUser } = useAppContext();
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    profileVisibility: 'public' as ProfileVisibility,
    showEmail: false,
    showWalletAddress: false,
  });
  const [showAchievements, setShowAchievements] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [showFollowList, setShowFollowList] = useState<{ open: boolean; type: 'followers' | 'following' }>({
    open: false,
    type: 'followers',
  });

  const userId = params.userId as string;
  //const profileUser = users.find((u) => u.id === userId);
  //const userPosts = posts.filter((p) => p.userId === userId);
  const isOwnProfile = currentUser?.id === userId;
  const canViewProfileDetails =
    isOwnProfile ||
    profileUser?.profileVisibility === 'public' ||
    (profileUser?.profileVisibility === 'followers' && isFollowing);

  const givePosts = userPosts.filter((p) => p.type === 'giveaway').length;
  const takePosts = userPosts.filter((p) => p.type === 'request').length;

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoadingProfile(true);
      setProfileError(null);

      try {
        const userRes = await fetch(`/api/users/${userId}`, { cache: 'no-store' });

        if (userRes.ok) {
          const userData = await userRes.json();
          const loadedUser = userData.data as ProfileUser;
          const nextIsFollowing = !!loadedUser.isFollowing;
          const nextCanView =
            currentUser?.id === userId ||
            loadedUser.profileVisibility === 'public' ||
            (loadedUser.profileVisibility === 'followers' && nextIsFollowing);

          setProfileUser(loadedUser);
          setEditForm({
            name: loadedUser.name || '',
            bio: loadedUser.bio || '',
            profileVisibility: loadedUser.profileVisibility || 'public',
            showEmail: loadedUser.showEmail ?? false,
            showWalletAddress: loadedUser.showWalletAddress ?? false,
          });
          setIsFollowing(nextIsFollowing);
          setFollowerCount(loadedUser._count?.followers || 0);
          setFollowingCount(loadedUser._count?.followings || 0);

          if (nextCanView) {
            const postsRes = await fetch(`/api/users/${userId}/posts`, {
              cache: 'no-store',
            });
            if (postsRes.ok) {
              const postsData = await postsRes.json();
              const rawList = Array.isArray(postsData.data) ? postsData.data : [];
              const mapped = rawList
                .map((p: Record<string, unknown>) => mapApiPostToClientPost(p))
                .filter(Boolean) as Post[];
              setUserPosts(mapped);
            } else {
              setUserPosts([]);
            }
          } else {
            setUserPosts([]);
          }
        } else if (userRes.status === 404) {
          setProfileUser(null);
          setProfileError("The user you're looking for doesn't exist.");
        } else {
          throw new Error('Failed to load profile');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        setProfileError(
          error instanceof Error ? error.message : 'Failed to load profile',
        );
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (userId) loadProfile();
  }, [currentUser?.id, userId]);

  const handleSaveProfile = async () => {
    if (!currentUser?.id || !profileUser || isSavingProfile) return;

    setIsSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      const updatedUser = data.data as Partial<ProfileUser>;
      setProfileUser({ ...profileUser, ...updatedUser });
      setCurrentUser({
        ...currentUser,
        ...(updatedUser.name !== undefined && { name: updatedUser.name }),
        ...(updatedUser.bio !== undefined && { bio: updatedUser.bio }),
        ...(updatedUser.avatarUrl !== undefined && {
          avatarUrl: updatedUser.avatarUrl,
        }),
        ...(updatedUser.profileVisibility !== undefined && {
          profileVisibility: updatedUser.profileVisibility,
        }),
        ...(updatedUser.showEmail !== undefined && {
          showEmail: updatedUser.showEmail,
        }),
        ...(updatedUser.showWalletAddress !== undefined && {
          showWalletAddress: updatedUser.showWalletAddress,
        }),
      });
      setIsEditingProfile(false);
      toast.success('Profile updated');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to save profile',
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser || isUpdatingFollow) return;

    const nextIsFollowing = !isFollowing;
    setIsUpdatingFollow(true);

    try {
      const method = nextIsFollowing ? 'POST' : 'DELETE';
      const res = await fetch(`/api/users/${userId}/follow`, { method });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to toggle follow status');
      }

      setIsFollowing(Boolean(data.data?.isFollowing));
      setFollowerCount(data.data?.counts?.followers ?? followerCount);
      setFollowingCount(data.data?.counts?.following ?? followingCount);
      setProfileUser((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: Boolean(data.data?.isFollowing),
              _count: {
                followers: data.data?.counts?.followers ?? followerCount,
                followings: data.data?.counts?.following ?? followingCount,
              },
            }
          : prev,
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to update follow state',
      );
    } finally {
      setIsUpdatingFollow(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading profile...</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Fetching user details and relationship data.
          </p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {profileError || "The user you're looking for doesn't exist."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Profile Header */}
        <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Profile Picture at Top */}
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-sm">
                  <AvatarImage
                    src={profileUser.avatarUrl || '/placeholder.svg'}
                    alt={profileUser.name}
                  />
                  <AvatarFallback className="text-2xl font-bold">
                    {profileUser.name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name and Verification */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{profileUser.name}</h1>
                  {profileUser.isVerified && (
                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      <Star className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {isOwnProfile && (
                    <Link href="/settings">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-8 h-8 p-0 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  {profileUser.username ? `@${profileUser.username}` : 'No username yet'}
                </p>
                <UserRankBadge rank={profileUser.rank} />
              </div>

              {/* Bio */}
              <p className="text-gray-700 dark:text-gray-300 max-w-md">
                {profileUser.bio || 'No bio yet.'}
              </p>

              {canViewProfileDetails && (
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  {profileUser.showEmail && profileUser.email && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1 dark:border-gray-700">
                      <Mail className="h-3 w-3" />
                      {profileUser.email}
                    </span>
                  )}
                  {profileUser.showWalletAddress && profileUser.walletAddress && (
                    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-gray-200 px-3 py-1 font-mono dark:border-gray-700">
                      <Wallet className="h-3 w-3 shrink-0" />
                      <span className="truncate">{profileUser.walletAddress}</span>
                    </span>
                  )}
                </div>
              )}

              {isOwnProfile && (
                <div className="w-full rounded-lg border border-gray-200 p-4 text-left dark:border-gray-800">
                  {isEditingProfile ? (
                    <div className="space-y-4">
                      <AvatarUpload
                        currentAvatarUrl={profileUser.avatarUrl}
                        userId={currentUser?.id}
                        onSuccess={(_, updatedUser) => {
                          const nextUser = { ...profileUser, ...updatedUser };
                          setProfileUser(nextUser);
                          if (currentUser) {
                            setCurrentUser({ ...currentUser, ...updatedUser });
                          }
                          toast.success('Avatar updated');
                        }}
                      />

                      <div className="space-y-2">
                        <Label htmlFor="profileName">Display Name</Label>
                        <Input
                          id="profileName"
                          value={editForm.name}
                          onChange={(event) =>
                            setEditForm({ ...editForm, name: event.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profileBio">Bio</Label>
                        <Textarea
                          id="profileBio"
                          value={editForm.bio}
                          rows={3}
                          onChange={(event) =>
                            setEditForm({ ...editForm, bio: event.target.value })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="profileVisibility">Profile Visibility</Label>
                        <Select
                          value={editForm.profileVisibility}
                          onValueChange={(value) =>
                            setEditForm({
                              ...editForm,
                              profileVisibility: value as ProfileVisibility,
                            })
                          }
                        >
                          <SelectTrigger id="profileVisibility">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Public</SelectItem>
                            <SelectItem value="followers">Followers only</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Show Email</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Display your email on your profile
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={editForm.showEmail}
                          onCheckedChange={(checked) =>
                            setEditForm({ ...editForm, showEmail: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Wallet className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Show Wallet</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Display your wallet address on your profile
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={editForm.showWalletAddress}
                          onCheckedChange={(checked) =>
                            setEditForm({
                              ...editForm,
                              showWalletAddress: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditingProfile(false)}
                          disabled={isSavingProfile}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSavingProfile || !editForm.name.trim()}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          {isSavingProfile ? 'Saving…' : 'Save Profile'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-gray-500" />
                        <div>
                          <div className="font-medium">Profile editing</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Visibility: {profileUser.profileVisibility}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingProfile(true)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center gap-8 text-sm">
                <button
                  onClick={() => setShowFollowList({ open: true, type: 'followers' })}
                  className="flex flex-col items-center hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {followerCount}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Followers
                  </span>
                </button>
                <button
                  onClick={() => setShowFollowList({ open: true, type: 'following' })}
                  className="flex flex-col items-center hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {followingCount}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Following
                  </span>
                </button>
                <button className="flex flex-col items-center hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {givePosts}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Gives
                  </span>
                </button>
                <button className="flex flex-col items-center hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {takePosts}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Takes
                  </span>
                </button>
                <button
                  onClick={() => setShowAchievements(true)}
                  className="flex flex-col items-center hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {profileUser.badges.length}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Badges
                  </span>
                </button>
              </div>

              {/* Join Date */}
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4" />
                Joined{' '}
                {new Date(profileUser.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </div>

              {/* Follow Button for Other Users */}
              {!isOwnProfile && (
                <Button 
                  className="mt-2" 
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollowToggle}
                  disabled={isUpdatingFollow}
                >
                  {isUpdatingFollow
                    ? isFollowing
                      ? 'Unfollowing...'
                      : 'Following...'
                    : isFollowing
                      ? 'Unfollow'
                      : 'Follow'}
                </Button>
              )}

              {profileError ? (
                <p className="text-sm text-red-500">{profileError}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {canViewProfileDetails ? (
          <Tabs defaultValue="posts" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="posts">Posts ({userPosts.length})</TabsTrigger>
              <TabsTrigger value="giveaways">Gives ({givePosts})</TabsTrigger>
              <TabsTrigger value="requests">Takes ({takePosts})</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              {userPosts.length > 0 ? (
                userPosts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <CardContent className="p-8 text-center">
                    <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {isOwnProfile
                        ? 'Start creating giveaways or help requests!'
                        : `${profileUser.name} hasn't posted anything yet.`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="giveaways" className="space-y-4">
              {userPosts
                .filter((p) => p.type === 'giveaway')
                .map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              {userPosts
                .filter((p) => p.type === 'request')
                .map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <CardContent className="p-8 text-center">
              <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Private profile</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Follow {profileUser.name} to see profile activity and posts.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <AchievementsDialog
        open={showAchievements}
        onOpenChange={setShowAchievements}
        badges={profileUser.badges}
        userName={profileUser.name}
      />

      <FollowListDialog
        open={showFollowList.open}
        onOpenChange={(open) => setShowFollowList((prev) => ({ ...prev, open }))}
        userId={userId}
        type={showFollowList.type}
      />
    </div>
  );
}
