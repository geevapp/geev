'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Gift, Settings, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AchievementsDialog } from '@/components/achievements-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FollowListDialog } from '@/components/follow-list-dialog';
import { PostCard } from '@/components/post-card';
import { UserRankBadge } from '@/components/user-rank-badge';
import { useAppContext } from '@/contexts/app-context';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const params = useParams();
  const { user: currentUser } = useAppContext();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowList, setShowFollowList] = useState<{ open: boolean; type: 'followers' | 'following' }>({
    open: false,
    type: 'followers',
  });

  const userId = params.userId as string;
  //const profileUser = users.find((u) => u.id === userId);
  //const userPosts = posts.filter((p) => p.userId === userId);
  const isOwnProfile = currentUser?.id === userId;

  const givePosts = userPosts.filter((p) => p.type === 'giveaway').length;
  const takePosts = userPosts.filter((p) => p.type === 'help-request').length;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [userRes, postsRes] = await Promise.all([
          fetch(`/api/users/${userId}`),
          fetch(`/api/posts?userId=${userId}`),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setProfileUser(userData.data);
          setIsFollowing(!!userData.data.isFollowing);
          setFollowerCount(userData.data._count?.followers || 0);
          setFollowingCount(userData.data._count?.followings || 0);
        }

        if (postsRes.ok) {
          const postsData = await postsRes.json(); 
          setUserPosts(postsData.data ?? []);
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    if (userId) loadProfile();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;

    const newIsFollowing = !isFollowing;
    setIsFollowing(newIsFollowing);
    setFollowerCount((prev) => (newIsFollowing ? prev + 1 : prev - 1));

    try {
      const method = newIsFollowing ? 'POST' : 'DELETE';
      const res = await fetch(`/api/users/${userId}/follow`, { method });
      if (!res.ok) throw new Error('Failed to toggle follow status');
    } catch (error) {
      console.error(error);
      setIsFollowing(!newIsFollowing);
      setFollowerCount((prev) => (newIsFollowing ? prev - 1 : prev + 1));
    }
  };  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-gray-600 dark:text-gray-400">
            The user you're looking for doesn't exist.
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
                  @{profileUser.username}
                </p>
                <UserRankBadge rank={profileUser.rank} />
              </div>

              {/* Bio */}
              <p className="text-gray-700 dark:text-gray-300 max-w-md">
                {profileUser.bio}
              </p>

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
                {profileUser.createdAt.toLocaleDateString('en-US', {
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
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
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
              .filter((p) => p.type === 'help-request')
              .map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
          </TabsContent>
        </Tabs>
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
