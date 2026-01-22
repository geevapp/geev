export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  walletAddress?: string;
  walletBalance: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  rank: UserRank;
  badges: Badge[];
  joinedAt: Date;
  isVerified: boolean;
}

export interface UserRank {
  level: number;
  title: string;
  color: string;
  minPoints: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  type: "post_created" | "entry_submitted" | "contribution_made";
  description: string;
  postId: string;
  amount?: number;
  createdAt?: Date;
}

export interface Post {
  id: string;
  type: "giveaway" | "help-request";
  authorId: string;
  author: User;
  title: string;
  description: string;
  media?: PostMedia[];
  createdAt: Date;
  updatedAt: Date;
  creatorId?: string;
  status: PostStatus;
  burnCount: number;
  shareCount: number;
  commentCount: number;
  likesCount: number;
  entriesCount: number;
  // Giveaway specific
  prizeAmount?: number;
  currency?: string;
  winnerCount?: number;
  selectionType?: "random" | "manual" | "first-come";
  entryRequirements?: string[];
  proofRequired?: boolean;
  endDate?: Date;
  entries?: Entry[];
  winners?: string[];
  // Help request specific
  targetAmount?: number;
  currentAmount?: number;
  contributions?: HelpContribution[];
}

export interface PostMedia {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

export type PostStatus = "active" | "completed" | "cancelled" | "expired";

export interface Entry {
  id: string;
  postId: string;
  userId: string;
  user: User;
  message?: string;
  content?: string;
  proofUrl?: string;
  proofImage?: string;
  submittedAt: Date;
  isWinner?: boolean;
  replies?: Reply[];
  parentId?: string;
}

export interface HelpContribution {
  id: string;
  postId: string;
  userId: string;
  user: User;
  amount: number;
  message?: string;
  currency?: string;
  parentId?: string;
  contributedAt: Date;
  isAnonymous?: boolean;
  replies?: Reply[];
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: Date;
  parentId?: string;
  replies?: Comment[];
}

export interface Reply {
  id: string;
  parentId: string;
  parentType: "entry" | "contribution";
  userId: string;
  user: User;
  content: string;
  createdAt: Date;
  burnCount: number;
}

/**
 * Global application state interface
 * Manages all state properties for the Geev application
 */
export interface AppState {
  /** Currently authenticated user, null if not logged in */
  user: User | null;
  /** Array of all posts in the application */
  posts: Post[];
  /** Array of all users */
  users: User[];
  /** Array of all giveaway entries */
  entries: Entry[];
  /** Array of all help request contributions */
  contributions: HelpContribution[];
  /** Array of all comments */
  comments: Comment[];
  /** Array of all replies */
  replies: Reply[];
  /** Set of IDs for liked entries/replies/posts */
  likes: Set<string>;
  /** Set of IDs for burned entries/posts */
  burns: Set<string>;
  /** Global loading state indicator */
  isLoading: boolean;
  /** Current error message, null if no error */
  error: string | null;
  /** Current theme setting */
  theme: "light" | "dark";
  /** Controls visibility of create post modal */
  showCreateModal: boolean;
  /** Controls visibility of giveaway modal */
  showGiveawayModal: boolean;
  /** Controls visibility of help request modal */
  showRequestModal: boolean;
}

/**
 * Context type extending AppState with all action functions
 * Provides centralized state management accessible via useAppContext hook
 */
export interface AppContextType extends AppState {
  // ============ User Actions ============
  /**
   * Logs in a user and persists to localStorage
   * @param user - The user object to set as current user
   */
  login: (user: User) => void;
  /**
   * Logs out the current user and clears from localStorage
   */
  logout: () => void;
  /**
   * Sets the current user directly
   * @param user - The user object or null to clear
   */
  setCurrentUser: (user: User | null) => void;

  // ============ Hydration State ============
  /**
   * Whether the state has been hydrated from localStorage (for SSR)
   */
  isHydrated: boolean;

  // ============ Post Actions ============
  /**
   * Creates a new post and adds it to the global state
   * @param post - The post data (without generated fields)
   */
  createPost: (
    post: Omit<
      Post,
      | "id"
      | "createdAt"
      | "updatedAt"
      | "author"
      | "entriesCount"
      | "shareCount"
      | "burnCount"
      | "commentCount"
      | "likesCount"
    >,
  ) => void;
  /**
   * Adds a new post to the state (for external creation)
   * @param post - The complete post object
   */
  addPost: (post: Post) => void;
  /**
   * Updates an existing post with partial data
   * @param postId - The ID of the post to update
   * @param updates - Partial post data to merge
   */
  updatePost: (postId: string, updates: Partial<Post>) => void;
  /**
   * Deletes a post from the state
   * @param postId - The ID of the post to delete
   */
  deletePost: (postId: string) => void;
  /**
   * Increments the burn count for a post
   * @param postId - The ID of the post to burn
   */
  burnPost: (postId: string) => void;

  // ============ Entry Actions ============
  /**
   * Submits a new entry for a giveaway
   * @param entry - The entry data (without generated fields)
   */
  submitEntry: (entry: Omit<Entry, "id" | "submittedAt" | "user">) => void;
  /**
   * Adds an entry directly to state
   * @param entry - The complete entry object
   */
  addEntry: (entry: Entry) => void;
  /**
   * Updates an existing entry
   * @param id - The ID of the entry to update
   * @param updates - Partial entry data to merge
   */
  updateEntry: (id: string, updates: Partial<Entry>) => void;

  // ============ Contribution Actions ============
  /**
   * Makes a contribution to a help request
   * @param contribution - The contribution data (without generated fields)
   */
  makeContribution: (
    contribution: Omit<HelpContribution, "id" | "contributedAt" | "user">,
  ) => void;

  // ============ Reply Actions ============
  /**
   * Adds a reply to an entry or contribution
   * @param reply - The reply data (without generated fields)
   */
  addReply: (
    reply: Omit<Reply, "id" | "createdAt" | "user" | "burnCount">,
  ) => void;
  /**
   * Increments the burn count for a reply
   * @param replyId - The ID of the reply to burn
   */
  burnReply: (replyId: string) => void;

  // ============ Interaction Actions ============
  /**
   * Toggles like status for an entry, reply, or post
   * @param id - The ID of the item to toggle like
   */
  toggleLike: (id: string) => void;
  /**
   * Toggles burn status for an entry or post
   * @param id - The ID of the item to toggle burn
   */
  toggleBurn: (id: string) => void;
  /**
   * Increments share count for a post
   * @param postId - The ID of the post to share
   */
  incrementShare: (postId: string) => void;

  // ============ Utility Actions ============
  /**
   * Clears any current error state
   */
  clearError: () => void;
  /**
   * Sets the loading state
   * @param loading - Whether the app is loading
   */
  setLoading: (loading: boolean) => void;
  /**
   * Toggles between light and dark theme
   */
  toggleTheme: () => void;
  /**
   * Controls the create post modal visibility
   * @param show - Whether to show the modal
   */
  setShowCreateModal: (show: boolean) => void;
  /**
   * Controls the giveaway modal visibility
   * @param show - Whether to show the modal
   */
  setShowGiveawayModal: (show: boolean) => void;
  /**
   * Controls the help request modal visibility
   * @param show - Whether to show the modal
   */
  setShowRequestModal: (show: boolean) => void;
}
