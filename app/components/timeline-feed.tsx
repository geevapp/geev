"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Gift, Heart, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CreateGiveawayModal } from "@/components/create-giveaway-modal";
import { CreatePostModal } from "@/components/create-post-modal";
import { CreateRequestModal } from "@/components/create-request-modal";
import { GuestBanner } from "@/components/guest-banner";
import { PostCard } from "@/components/post-card";
import { useAppContext } from "@/contexts/app-context";

export function TimelineFeed() {
  const {
    posts,
    user,
    showCreateModal,
    showGiveawayModal,
    showRequestModal,
    setShowCreateModal,
    setShowGiveawayModal,
    setShowRequestModal,
  } = useAppContext(); // Use context methods instead of dispatch

  const handleCreatePost = (type: "giveaway" | "help-request") => {
    if (type === "giveaway") {
      setShowGiveawayModal(true); // Use context method
    } else {
      setShowRequestModal(true);
    }
    setShowCreateModal(false); // Use context method
  };

  const giveaways = posts.filter((post) => post.type === "giveaway");
  const helpRequests = posts.filter((post) => post.type === "help-request");
  const activePosts = posts.filter((post) => post.status === "active");

  return (
    <div className="space-y-6">
      {/* Guest Banner */}
      {!user && <GuestBanner />}

      {/* Feed Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            All ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="giveaways" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Giveaways ({giveaways.length})
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Help Requests ({helpRequests.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            Active ({activePosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Be the first to create a giveaway or help request!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="giveaways" className="space-y-6">
          {giveaways.length > 0 ? (
            giveaways.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No giveaways yet</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create the first giveaway to give back to the community!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {helpRequests.length > 0 ? (
            helpRequests.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No help requests yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Be the first to ask the community for support!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          {activePosts.length > 0 ? (
            activePosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No active posts</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  All posts have been completed or expired.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreatePostModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal} // Use context method
        onSelectType={handleCreatePost}
      />
      <CreateGiveawayModal
        open={showGiveawayModal}
        onOpenChange={setShowGiveawayModal} // Use context method
      />
      <CreateRequestModal
        open={showRequestModal}
        onOpenChange={setShowRequestModal} // Use context method
      />
    </div>
  );
}
