// =============================================================================
// GEEV APPLICATION TYPE DEFINITIONS
// =============================================================================
// This file contains all core TypeScript interfaces and types for the Geev
// application. Types are organized by domain and include full JSDoc documentation.
// =============================================================================

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Status of a post throughout its lifecycle.
 * Used to track the current state of giveaways and help requests.
 */
export enum PostStatus {
  /** Post is open and accepting entries */
  Open = 'open',
  /** Post is being processed (e.g., winner selection in progress) */
  InProgress = 'in-progress',
  /** Post has been completed successfully */
  Completed = 'completed',
  /** Post was cancelled by the creator */
  Cancelled = 'cancelled',
}

/**
 * Category of the post defining its purpose.
 * Determines the type of interaction users can have with the post.
 */
export enum PostCategory {
  /** Free giveaway of items, tokens, or services */
  Giveaway = 'giveaway',
  /** Request for help or donations from the community */
  HelpRequest = 'help-request',
  /** Sharing of skills or knowledge with others */
  SkillShare = 'skill-share',
}

/**
 * Method used for selecting winners in a giveaway.
 * Determines how winners are chosen from entries.
 */
export enum SelectionMethod {
  /** Winners selected randomly from all valid entries */
  Random = 'random',
  /** First valid entries to submit are selected */
  FirstCome = 'first-come',
  /** Winners selected based on merit/quality of submission */
  MeritBased = 'merit-based',
}

/**
 * Tier levels for badges with corresponding numeric values.
 * Higher tiers represent greater achievements.
 */
export enum BadgeTier {
  /** Basic achievement tier */
  Bronze = 1,
  /** Intermediate achievement tier */
  Silver = 2,
  /** Advanced achievement tier */
  Gold = 3,
  /** Expert achievement tier */
  Platinum = 4,
  /** Legendary achievement tier */
  Diamond = 5,
}

// =============================================================================
// API RESPONSE INTERFACES
// =============================================================================

/**
 * Leaderboard entry for API responses.
 * Represents a user's ranking and statistics.
 */
export interface LeaderboardEntry {
  /** User ID */
  id: string;
  /** User display name */
  name: string;
  /** User avatar URL */
  avatar_url: string;
  /** User experience points */
  xp: number;
  /** Number of posts created */
  post_count: number;
  /** Number of entries submitted */
  entry_count: number;
  /** Total contributions (posts + entries) */
  total_contributions: number;
  /** User badges */
  badges: Badge[];
}

/**
 * Leaderboard API response structure.
 */
export interface LeaderboardResponse {
  /** Array of leaderboard entries */
  leaderboard: LeaderboardEntry[];
  /** Current page number */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Time period filter applied */
  period: 'all-time' | 'monthly' | 'weekly';
  /** Total number of entries */
  total: number;
}

// =============================================================================
// USER INTERFACES
// =============================================================================

/**
 * Statistics tracking user activity on the platform.
 * Provides metrics for user engagement and reputation.
 */
export interface UserStats {
  /** Number of giveaways/posts created by the user */
  gives: number;
  /** Number of entries submitted by the user */
  takes: number;
  /** Number of users following this user */
  followers: number;
  /** Number of users this user is following */
  following: number;
  /** Total likes received across all content */
  totalLikes: number;
}

/**
 * User rank information based on platform activity.
 * Determines user's standing in the community.
 */
export interface UserRank {
  /** Numeric level of the rank */
  level: number;
  /** Display title for the rank (e.g., "Champion") */
  title: string;
  /** CSS color class for the rank display */
  color: string;
  /** Minimum points required to achieve this rank */
  minPoints: number;
}

/**
 * Badge earned by users for achievements.
 * Represents accomplishments and milestones on the platform.
 */
export interface Badge {
  /** Unique identifier for the badge */
  id: string;
  /** Display name of the badge */
  name: string;
  /** Description of how the badge was earned */
  description: string;
  /** Tier level of the badge */
  tier?: BadgeTier;
  /** Icon identifier or emoji for the badge */
  icon: string;
  /** CSS color class for styling */
  color?: string;
  /** XP reward for earning this badge */
  xpReward?: number;
  /** Criteria description for earning the badge */
  criteria?: string;
  /** Timestamp when the badge was earned */
  earnedAt?: Date | number;
}

/**
 * User wallet for Stellar blockchain transactions.
 * Stores cryptocurrency balance and transaction information.
 */
export interface Wallet {
  /** Stellar public key for the wallet */
  publicKey: string;
  /** Current balance in the wallet */
  balance: number;
  /** Currency type (e.g., "XLM", "USDC") */
  currency: string;
}

/**
 * Main user interface representing a platform user.
 * Contains all user profile information and settings.
 */
export interface User {
  /** Unique identifier for the user */
  id: string;
  /** Stellar public key for blockchain transactions */
  publicKey?: string;
  /** Display name of the user */
  name: string;
  /** Unique username handle */
  username: string;
  /** User email address */
  email: string;
  /** URL to user's avatar image */
  avatar: string;
  /** User biography/description */
  bio: string;
  /** User's wallet address (shortened format) */
  walletAddress?: string;
  /** User's wallet balance */
  walletBalance: number;
  /** Number of followers */
  followersCount: number;
  /** Number of users being followed */
  followingCount: number;
  /** Number of posts created */
  postsCount: number;
  /** User's current rank */
  rank: UserRank;
  /** Aggregated user statistics */
  stats?: UserStats;
  /** Badges earned by the user */
  badges: Badge[];
  /** Date when user joined the platform */
  joinedAt: Date;
  /** Whether the user is verified */
  isVerified: boolean;
}

// =============================================================================
// POST INTERFACES
// =============================================================================

/**
 * Requirements for entering a post.
 * Defines eligibility criteria for participation.
 */
export interface PostRequirements {
  /** Minimum badge tier required to enter */
  minBadgeTier?: BadgeTier;
  /** Minimum reputation score required */
  minReputation?: number;
  /** Whether proof of action is required */
  proofRequired: boolean;
}

/**
 * Media file attached to a post.
 * Supports images and videos with optional thumbnails.
 */
export interface MediaFile {
  /** Unique identifier for the media */
  id: string;
  /** URL to the media file */
  url: string;
  /** Type of media content */
  type: 'image' | 'video';
  /** URL to thumbnail image (for videos) */
  thumbnail?: string;
}

/**
 * Alias for PostMedia for backward compatibility.
 */
export type PostMedia = MediaFile;

/**
 * Proof data for entry submissions.
 * Documents evidence of completed requirements.
 */
export interface ProofData {
  /** Type of proof provided */
  type: 'image' | 'link';
  /** URL to the proof content */
  url: string;
}

/**
 * Post interface for giveaways and help requests.
 * Core content type on the platform.
 */
export interface Post {
  /** Unique identifier for the post */
  id: string;
  /** Category of the post */
  category?: PostCategory;
  /** Legacy type field for backward compatibility */
  type: 'giveaway' | 'help-request';
  /** ID of the post creator */
  authorId: string;
  /** Alias for authorId */
  creatorId?: string;
  /** Full user object of the author */
  author: User;
  /** Post title */
  title: string;
  /** Detailed description of the post */
  description: string;
  /** Media files attached to the post */
  media?: MediaFile[];
  /** Requirements for entering */
  requirements?: PostRequirements;
  /** Selection method for winners */
  selectionMethod?: SelectionMethod;
  /** Maximum duration in days */
  duration?: number;
  /** Timestamp when the post was created */
  createdAt: Date | number;
  /** Timestamp when the post was last updated */
  updatedAt: Date | number;
  /** Timestamp when the post ends */
  endsAt?: Date | number;
  /** Current status of the post */
  status: PostStatus | 'active' | 'completed' | 'cancelled' | 'expired';
  /** Number of burns received */
  burnCount: number;
  /** Number of times shared */
  shareCount: number;
  /** Number of comments */
  commentCount: number;
  /** Number of likes received */
  likesCount: number;
  /** Number of entries submitted */
  entriesCount: number;
  // Giveaway specific fields
  /** Prize amount for giveaways */
  prizeAmount?: number;
  /** Currency type for the prize */
  currency?: string;
  /** Maximum number of winners */
  maxWinners?: number;
  /** Current number of winners selected */
  currentWinners?: number;
  /** Number of winners (alias for maxWinners) */
  winnerCount?: number;
  /** Legacy selection type field */
  selectionType?: 'random' | 'manual' | 'first-come';
  /** Entry requirements as string array */
  entryRequirements?: string[];
  /** Whether proof is required for entry */
  proofRequired?: boolean;
  /** End date for the post */
  endDate?: Date;
  /** Entries for this post */
  entries?: Entry[];
  /** Winner user IDs */
  winners?: string[];
  // Help request specific fields
  /** Target amount for help requests */
  targetAmount?: number;
  /** Current amount raised */
  currentAmount?: number;
  /** Contributions for this help request */
  contributions?: HelpContribution[];
}

// =============================================================================
// ENTRY AND REPLY INTERFACES
// =============================================================================

/**
 * Entry interface for submissions to posts.
 * Represents user participation in giveaways or requests.
 */
export interface Entry {
  /** Unique identifier for the entry */
  id: string;
  /** ID of the post this entry belongs to */
  postId: string;
  /** ID of the user who submitted */
  userId: string;
  /** Full user object of the submitter */
  user: User;
  /** Entry message or description */
  message?: string;
  /** Content of the entry */
  content?: string;
  /** URL to proof document */
  proofUrl?: string;
  /** URL to proof image */
  proofImage?: string;
  /** Structured proof data */
  proof?: ProofData;
  /** Whether this entry won */
  isWinner?: boolean;
  /** Timestamp when entry was submitted */
  submittedAt: Date | number;
  /** Timestamp when entry was created */
  createdAt?: Date | number;
  /** Timestamp when entry was last updated */
  updatedAt?: Date | number;
  /** Number of likes on this entry */
  likes?: number;
  /** Number of burns on this entry */
  burns?: number;
  /** Number of replies to this entry */
  replyCount?: number;
  /** Replies to this entry */
  replies?: Reply[];
  /** Parent entry ID for nested entries */
  parentId?: string;
}

/**
 * Reply interface for comments on entries or contributions.
 * Enables threaded discussions.
 */
export interface Reply {
  /** Unique identifier for the reply */
  id: string;
  /** ID of the parent item (entry or contribution) */
  parentId: string;
  /** ID of the entry this reply belongs to (for backward compat) */
  entryId?: string;
  /** Type of parent item */
  parentType: 'entry' | 'contribution';
  /** ID of the user who replied */
  userId: string;
  /** Full user object of the replier */
  user: User;
  /** Content of the reply */
  content: string;
  /** Timestamp when reply was created */
  createdAt: Date | number;
  /** Number of likes on this reply */
  likes?: number;
  /** Number of burns on this reply */
  burnCount: number;
}

/**
 * Help contribution for help request posts.
 * Represents donations or support given.
 */
export interface HelpContribution {
  /** Unique identifier for the contribution */
  id: string;
  /** ID of the post this contribution is for */
  postId: string;
  /** ID of the contributing user */
  userId: string;
  /** Full user object of the contributor */
  user: User;
  /** Contribution amount */
  amount: number;
  /** Optional message with contribution */
  message?: string;
  /** Currency type */
  currency?: string;
  /** Parent contribution ID for nested contributions */
  parentId?: string;
  /** Timestamp when contribution was made */
  contributedAt: Date;
  /** Whether the contribution is anonymous */
  isAnonymous?: boolean;
  /** Replies to this contribution */
  replies?: Reply[];
}

/**
 * Comment on a post.
 * General discussion on posts.
 */
export interface Comment {
  /** Unique identifier for the comment */
  id: string;
  /** ID of the post this comment is on */
  postId: string;
  /** ID of the commenting user */
  userId: string;
  /** Full user object of the commenter */
  user: User;
  /** Comment content */
  content: string;
  /** Timestamp when comment was created */
  createdAt: Date;
  /** Parent comment ID for nested comments */
  parentId?: string;
  /** Nested replies to this comment */
  replies?: Comment[];
}

// =============================================================================
// INTERACTION INTERFACES
// =============================================================================

/**
 * Like interaction on entries or replies.
 * Records when a user likes content.
 */
export interface Like {
  /** Unique identifier for the like */
  id: string;
  /** ID of the user who liked */
  userId: string;
  /** ID of the target item (entry or reply) */
  targetId: string;
  /** Type of the target item */
  targetType: 'entry' | 'reply';
  /** Timestamp when like was created */
  createdAt: Date | number;
}

/**
 * Burn interaction for boosting visibility.
 * Users burn tokens to promote entries.
 */
export interface Burn {
  /** Unique identifier for the burn */
  id: string;
  /** ID of the user who burned */
  userId: string;
  /** ID of the entry being burned */
  entryId: string;
  /** Timestamp when burn occurred */
  createdAt: Date | number;
}

/**
 * Share action for spreading content.
 * Tracks how content is shared externally.
 */
export interface Share {
  /** Unique identifier for the share */
  id: string;
  /** ID of the user who shared */
  userId: string;
  /** ID of the post being shared */
  postId: string;
  /** Method of sharing */
  method: 'link' | 'twitter' | 'telegram';
  /** Timestamp when share occurred */
  createdAt: Date | number;
}

// =============================================================================
// ACTIVITY INTERFACES
// =============================================================================

/**
 * Activity record for user actions.
 * Tracks engagement across the platform.
 */
export interface Activity {
  /** Unique identifier for the activity */
  id: string;
  /** ID of the user who performed the action */
  userId: string;
  /** Type of activity performed */
  type: 'post_created' | 'entry_submitted' | 'contribution_made';
  /** Human-readable description */
  description: string;
  /** Related post ID */
  postId: string;
  /** Amount if applicable (e.g., contribution) */
  amount?: number;
  /** Timestamp when activity occurred */
  createdAt?: Date;
}

// =============================================================================
// DRAFT INTERFACES
// =============================================================================

/**
 * Draft interface for incomplete posts saved locally.
 * Allows users to save work in progress and resume later.
 */
export interface Draft {
  /** Unique identifier for the draft */
  id: string;
  /** Type of post: giveaway or request */
  type: 'giveaway' | 'request';
  /** Post title */
  title: string;
  /** Post description */
  description: string;
  /** Post category */
  category?: string;
  /** Prize amount (for giveaways) */
  prizeAmount?: number;
  /** Currency type */
  currency?: string;
  /** Maximum number of winners (for giveaways) */
  maxWinners?: number;
  /** Selection method */
  selectionMethod?: string;
  /** Target amount (for requests) */
  targetAmount?: number;
  /** Entry requirements */
  entryRequirements?: string[];
  /** Whether proof is required */
  proofRequired?: boolean;
  /** Duration in days */
  duration?: number;
  /** Timestamp when draft was saved */
  savedAt: string;
  /** Timestamp when draft was last updated */
  updatedAt: string;
}

// =============================================================================
// APPLICATION STATE INTERFACES
// =============================================================================

/**
 * Application state for the app context.
 * Contains all shared state across the application.
 */
export interface AppState {
  /** Currently logged in user or null */
  user: User | null;
  /** All posts in the application */
  posts: Post[];
  /** All users in the application */
  users: User[];
  /** All entries in the application */
  entries: Entry[];
  /** All contributions in the application */
  contributions: HelpContribution[];
  /** All comments in the application */
  comments: Comment[];
  /** All replies in the application */
  replies: Reply[];
  /** Set of IDs for liked items */
  likes: Set<string>;
  /** Set of IDs for burned items */
  burns: Set<string>;
  /** Whether the app is loading */
  isLoading: boolean;
  /** Current error message or null */
  error: string | null;
  /** Current theme */
  theme: 'light' | 'dark';
  /** Create modal visibility */
  showCreateModal: boolean;
  /** Giveaway modal visibility */
  showGiveawayModal: boolean;
  /** Request modal visibility */
  showRequestModal: boolean;
}

/**
 * Application context type with state and actions.
 * Defines the full context API for the application.
 */
export interface AppContextType extends AppState {
  // ============ User/Auth Actions ============
  /** Log in a user */
  login: (user: User) => void;
  /** Log out the current user */
  logout: () => void;
  /** Set the current user directly */
  setCurrentUser: (user: User | null) => void;

  // ============ Hydration State ============
  /** Whether the state has been hydrated from localStorage (for SSR) */
  isHydrated: boolean;

  // ============ Post Actions ============
  /** Create a new post */
  createPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author' | 'entriesCount' | 'shareCount' | 'burnCount' | 'commentCount' | 'likesCount'>) => void;
  /** Add a post directly to state */
  addPost: (post: Post) => void;
  /** Update an existing post */
  updatePost: (postId: string, updates: Partial<Post>) => void;
  /** Delete a post */
  deletePost: (postId: string) => void;
  /** Burn a post */
  burnPost: (postId: string) => void;

  // ============ Entry Actions ============
  /** Submit an entry to a post */
  submitEntry: (entry: Omit<Entry, 'id' | 'submittedAt' | 'user'>) => void;
  /** Add an entry directly to state */
  addEntry: (entry: Entry) => void;
  /** Update an existing entry */
  updateEntry: (id: string, updates: Partial<Entry>) => void;

  // ============ Contribution Actions ============
  /** Make a contribution to a help request */
  makeContribution: (contribution: Omit<HelpContribution, 'id' | 'contributedAt' | 'user'>) => void;

  // ============ Reply Actions ============
  /** Add a reply to an entry or contribution */
  addReply: (reply: Omit<Reply, 'id' | 'createdAt' | 'user' | 'burnCount'>) => void;
  /** Burn a reply */
  burnReply: (replyId: string) => void;

  // ============ Interaction Actions ============
  /** Toggle like status for an item */
  toggleLike: (id: string) => void;
  /** Toggle burn status for an item */
  toggleBurn: (id: string) => void;
  /** Increment share count for a post */
  incrementShare: (postId: string) => void;

  // ============ Utility Actions ============
  /** Clear current error state */
  clearError: () => void;
  /** Set the loading state */
  setLoading: (loading: boolean) => void;
  /** Toggle between light and dark theme */
  toggleTheme: () => void;
  /** Set create modal visibility */
  setShowCreateModal: (show: boolean) => void;
  /** Set giveaway modal visibility */
  setShowGiveawayModal: (show: boolean) => void;
  /** Set request modal visibility */
  setShowRequestModal: (show: boolean) => void;
}
