export interface User {
  id: string
  name: string
  username: string
  email: string
  avatar: string
  bio: string
  walletAddress?: string
  walletBalance: number
  followersCount: number
  followingCount: number
  postsCount: number
  rank: UserRank
  badges: Badge[]
  joinedAt: Date
  isVerified: boolean
}

export interface UserRank {
  level: number
  title: string
  color: string
  minPoints: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  earnedAt: Date
}

export interface Activity {
  id: string
  userId: string
  type: "post_created" | "entry_submitted" | "contribution_made"
  description: string
  postId: string
  amount?: number
  createdAt?: Date
}

export interface Post {
  id: string
  type: "giveaway" | "help-request"
  authorId: string
  author: User
  title: string
  description: string
  media?: PostMedia[]
  createdAt: Date
  updatedAt: Date
  creatorId?: string
  status: PostStatus
  burnCount: number
  shareCount: number
  commentCount: number
  likesCount: number
  entriesCount: number
  // Giveaway specific
  prizeAmount?: number
  currency?: string
  winnerCount?: number
  selectionType?: "random" | "manual" | "first-come"
  entryRequirements?: string[]
  proofRequired?: boolean
  endDate?: Date
  entries?: Entry[]
  winners?: string[]
  // Help request specific
  targetAmount?: number
  currentAmount?: number
  contributions?: HelpContribution[]
}

export interface PostMedia {
  id: string
  type: "image" | "video"
  url: string
  thumbnail?: string
}

export type PostStatus = "active" | "completed" | "cancelled" | "expired"

export interface Entry {
  id: string
  postId: string
  userId: string
  user: User
  message?: string
  content?: string
  proofUrl?: string
  proofImage?: string
  submittedAt: Date
  isWinner?: boolean
  replies?: Reply[]
  parentId?: string
}

export interface HelpContribution {
  id: string
  postId: string
  userId: string
  user: User
  amount: number
  message?: string
  currency?: string
  parentId?: string
  contributedAt: Date
  isAnonymous?: boolean
  replies?: Reply[]
}

export interface Comment {
  id: string
  postId: string
  userId: string
  user: User
  content: string
  createdAt: Date
  parentId?: string
  replies?: Comment[]
}

export interface Reply {
  id: string
  parentId: string
  parentType: "entry" | "contribution"
  userId: string
  user: User
  content: string
  createdAt: Date
  burnCount: number
}

export interface AppState {
  user: User | null
  posts: Post[]
  users: User[]
  entries: Entry[]
  contributions: HelpContribution[]
  comments: Comment[]
  replies: Reply[]
  isLoading: boolean
  theme: "light" | "dark"
  showCreateModal: boolean
  showGiveawayModal: boolean
  showRequestModal: boolean
}

export interface AppContextType extends AppState {
  // Auth actions
  login: (user: User) => void
  logout: () => void
  // Hydration state (for SSR)
  isHydrated: boolean
  // Post actions
  createPost: (post: Omit<Post, "id" | "createdAt" | "updatedAt" | "author" | "entriesCount" | "shareCount" | "burnCount" | "commentCount" | "likesCount">) => void
  updatePost: (postId: string, updates: Partial<Post>) => void
  deletePost: (postId: string) => void
  burnPost: (postId: string) => void
  // Entry actions
  submitEntry: (entry: Omit<Entry, "id" | "submittedAt" | "user">) => void
  // Contribution actions
  makeContribution: (contribution: Omit<HelpContribution, "id" | "contributedAt" | "user">) => void
  addReply: (reply: Omit<Reply, "id" | "createdAt" | "user" | "burnCount">) => void
  burnReply: (replyId: string) => void
  // Theme actions
  toggleTheme: () => void
  setShowCreateModal: (show: boolean) => void
  setShowGiveawayModal: (show: boolean) => void
  setShowRequestModal: (show: boolean) => void
}
