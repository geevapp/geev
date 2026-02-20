'use client';

/**
 * @fileoverview Global Application Context for Geev
 *
 * This module provides centralized state management using React Context API.
 * It manages posts, users, entries, interactions, and application UI state
 * across the entire Geev application.
 *
 * @example
 * ```tsx
 * import { useAppContext } from '@/contexts/app-context';
 *
 * function MyComponent() {
 *   const { posts, addPost, currentUser } = useAppContext();
 *   return <div>{posts.length} posts</div>;
 * }
 * ```
 */

import type {
  AppContextType,
  AppState,
  Badge,
  Entry,
  HelpContribution,
  Post,
  Reply,
  User,
} from '@/lib/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { mockPosts, mockUsers } from '@/lib/mock-data';
import { signIn, signOut } from 'next-auth/react';

import type React from 'react';
import { getUserById } from '@/lib/mock-auth';
import { trackEvent } from '@/lib/analytics';
import { useSession } from 'next-auth/react';

/** LocalStorage key for persisting application state */
const STORAGE_KEY = 'geev_app_state';

/**
 * Initial application state
 * Sets up empty/default values for all state properties
 */
const initialState: AppState = {
  user: null,
  posts: [],
  users: [],
  entries: [],
  replies: [],
  contributions: [],
  comments: [],
  likes: new Set<string>(),
  burns: new Set<string>(),
  isLoading: false,
  error: null,
  theme: 'light',
  showCreateModal: false,
  showGiveawayModal: false,
  showRequestModal: false,
};

/**
 * Union type of all possible actions for the app reducer
 */
type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_POSTS'; payload: Post[] }
  | { type: 'SET_USERS'; payload: User[] }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'UPDATE_POST'; payload: { id: string; updates: Partial<Post> } }
  | { type: 'DELETE_POST'; payload: string }
  | { type: 'BURN_POST'; payload: string }
  | { type: 'BURN_REPLY'; payload: string }
  | { type: 'ADD_ENTRY'; payload: Entry }
  | { type: 'UPDATE_ENTRY'; payload: { id: string; updates: Partial<Entry> } }
  | { type: 'ADD_CONTRIBUTION'; payload: HelpContribution }
  | {
      type: 'ADD_REPLY';
      payload: {
        parentId: string;
        parentType: 'entry' | 'contribution';
        reply: Reply;
      };
    }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_THEME' }
  | { type: 'AWARD_BADGE'; payload: { userId: string; badge: Badge } }
  | { type: 'SET_CREATE_MODAL'; payload: boolean }
  | { type: 'SET_GIVEAWAY_MODAL'; payload: boolean }
  | { type: 'SET_REQUEST_MODAL'; payload: boolean }
  | { type: 'TOGGLE_LIKE'; payload: string }
  | { type: 'TOGGLE_BURN'; payload: string }
  | { type: 'INCREMENT_SHARE'; payload: string }
  | { type: 'HYDRATE_STATE'; payload: Partial<AppState> };

/**
 * Helper function to find and update replies recursively
 * Used for burning replies that might be nested
 */
function updateReplyBurnCount(
  replies: Reply[] | undefined,
  replyId: string,
): Reply[] | undefined {
  if (!replies) return undefined;

  return replies.map((reply) => {
    if (reply.id === replyId) {
      return { ...reply, burnCount: reply.burnCount + 1 };
    }
    return reply;
  });
}

/**
 * Main reducer function for application state
 * Handles all state transformations based on dispatched actions
 *
 * @param state - Current application state
 * @param action - Action to process
 * @returns New application state
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'HYDRATE_STATE':
      return { ...state, ...action.payload };

    case 'SET_USER':
      return { ...state, user: action.payload };

    case 'SET_POSTS':
      return { ...state, posts: action.payload };

    case 'SET_USERS':
      return { ...state, users: action.payload };

    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts] };

    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload.id
            ? { ...post, ...action.payload.updates }
            : post,
        ),
      };

    case 'DELETE_POST':
      return {
        ...state,
        posts: state.posts.filter((post) => post.id !== action.payload),
      };

    case 'BURN_POST':
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload
            ? { ...post, burnCount: post.burnCount + 1 }
            : post,
        ),
      };

    case 'ADD_ENTRY':
      return { ...state, entries: [...state.entries, action.payload] };

    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.payload.id
            ? { ...entry, ...action.payload.updates }
            : entry,
        ),
      };

    case 'ADD_CONTRIBUTION':
      return {
        ...state,
        contributions: [...state.contributions, action.payload],
      };

    case 'ADD_REPLY':
      if (action.payload.parentType === 'entry') {
        return {
          ...state,
          entries: state.entries.map((entry) =>
            entry.id === action.payload.parentId
              ? {
                  ...entry,
                  replies: [...(entry.replies || []), action.payload.reply],
                }
              : entry,
          ),
        };
      } else {
        return {
          ...state,
          contributions: state.contributions.map((contribution) =>
            contribution.id === action.payload.parentId
              ? {
                  ...contribution,
                  replies: [
                    ...(contribution.replies || []),
                    action.payload.reply,
                  ],
                }
              : contribution,
          ),
        };
      }

    case 'BURN_REPLY':
      // Update burn count in entries' replies
      const updatedEntries = state.entries.map((entry) => ({
        ...entry,
        replies: updateReplyBurnCount(entry.replies, action.payload),
      }));

      // Update burn count in contributions' replies
      const updatedContributions = state.contributions.map((contribution) => ({
        ...contribution,
        replies: updateReplyBurnCount(contribution.replies, action.payload),
      }));

      return {
        ...state,
        entries: updatedEntries,
        contributions: updatedContributions,
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };

    case 'AWARD_BADGE':
      return {
        ...state,
        user:
          state.user && state.user.id === action.payload.userId
            ? {
                ...state.user,
                badges: [...state.user.badges, action.payload.badge],
              }
            : state.user,
        users: state.users.map((user) =>
          user.id === action.payload.userId
            ? { ...user, badges: [...user.badges, action.payload.badge] }
            : user,
        ),
      };

    case 'SET_CREATE_MODAL':
      return { ...state, showCreateModal: action.payload };

    case 'SET_GIVEAWAY_MODAL':
      return { ...state, showGiveawayModal: action.payload };

    case 'SET_REQUEST_MODAL':
      return { ...state, showRequestModal: action.payload };

    case 'TOGGLE_LIKE': {
      const newLikes = new Set(state.likes);
      if (newLikes.has(action.payload)) {
        newLikes.delete(action.payload);
      } else {
        newLikes.add(action.payload);
      }

      // Also update the post's likesCount if it's a post
      const updatedPosts = state.posts.map((post) =>
        post.id === action.payload
          ? {
              ...post,
              likesCount: newLikes.has(action.payload)
                ? post.likesCount + 1
                : post.likesCount - 1,
            }
          : post,
      );

      return { ...state, likes: newLikes, posts: updatedPosts };
    }

    case 'TOGGLE_BURN': {
      const newBurns = new Set(state.burns);
      if (newBurns.has(action.payload)) {
        newBurns.delete(action.payload);
      } else {
        newBurns.add(action.payload);
      }

      // Also update the post's burnCount if it's a post
      const updatedPostsForBurn = state.posts.map((post) =>
        post.id === action.payload
          ? {
              ...post,
              burnCount: newBurns.has(action.payload)
                ? post.burnCount + 1
                : post.burnCount - 1,
            }
          : post,
      );

      return { ...state, burns: newBurns, posts: updatedPostsForBurn };
    }

    case 'INCREMENT_SHARE':
      return {
        ...state,
        posts: state.posts.map((post) =>
          post.id === action.payload
            ? { ...post, shareCount: post.shareCount + 1 }
            : post,
        ),
      };

    default:
      return state;
  }
}

/**
 * React Context for global application state
 * Access via useAppContext() hook
 */
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Serializes the app state for localStorage storage
 * Converts Sets to Arrays for JSON serialization
 */
function serializeState(state: AppState): string {
  const { user, ...stateWithoutUser } = state;

  const serializable = {
    ...stateWithoutUser,
    likes: Array.from(state.likes),
    burns: Array.from(state.burns),
  };
  return JSON.stringify(serializable);
}

/**
 * Deserializes stored state from localStorage
 * Converts Arrays back to Sets and restores Date objects
 */
function deserializeState(stored: string): Partial<AppState> | null {
  try {
    const parsed = JSON.parse(stored);
    return {
      ...parsed,
      likes: new Set<string>(parsed.likes || []),
      burns: new Set<string>(parsed.burns || []),
    };
  } catch (error) {
    console.error('Failed to deserialize app state:', error);
    return null;
  }
}
/**
 * AppProvider Component
 *
 * Wraps the application to provide global state access.
 * Handles state persistence to localStorage and provides all action functions.
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { AppProvider } from '@/contexts/app-context';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AppProvider>
 *           {children}
 *         </AppProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const { data: session } = useSession();

  // Sync session user with app state

  useEffect(() => {
    if (session?.user?.id) {
      const fullUser = getUserById(session.user.id);
      if (fullUser) {
        dispatch({ type: 'SET_USER', payload: fullUser });
      }
    } else {
      dispatch({ type: 'SET_USER', payload: null });
    }
  }, [session]);

  // Load state from localStorage and mock data on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const hydrated = deserializeState(savedState);
        if (hydrated) {
          dispatch({ type: 'HYDRATE_STATE', payload: hydrated });
        }
      }
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
    }

    // Load mock data
    dispatch({ type: 'SET_USERS', payload: mockUsers });
    dispatch({ type: 'SET_POSTS', payload: mockPosts });

    setIsHydrated(true);
  }, []);

  // Restore user session from localStorage on mount (mock auth persistence)
  // useEffect(() => {
  //   const storedUser = getCurrentUser();
  //   if (storedUser) {
  //     dispatch({ type: "SET_USER", payload: storedUser });
  //   }
  //   setIsHydrated(true);
  // }, []);

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme && savedTheme !== state.theme) {
      dispatch({ type: 'TOGGLE_THEME' });
    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    localStorage.setItem('theme', state.theme);
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  // Save state to localStorage on changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, serializeState(state));
      } catch (error) {
        console.error('Failed to save state to localStorage:', error);
      }
    }, 100); // Debounce by 100ms to avoid excessive writes

    return () => clearTimeout(timeoutId);
  }, [state, isHydrated]);

  /**
   * Checks and awards badges based on user activity
   */
  const checkAndAwardBadges = useCallback(
    (userId: string, activityType: 'entry' | 'contribution') => {
      const user = state.users.find((u) => u.id === userId);
      if (!user) return;

      const userEntries = state.entries.filter(
        (e) => e.userId === userId,
      ).length;
      const userContributions = state.contributions.filter(
        (c) => c.userId === userId,
      ).length;
      const totalActivity = userEntries + userContributions;

      const availableBadges = [
        {
          min: 1,
          name: 'First Step',
          icon: '👣',
          color: 'bg-gray-100 text-gray-800',
        },
        {
          min: 5,
          name: 'Generous Giver',
          icon: '🎁',
          color: 'bg-blue-100 text-blue-800',
        },
        {
          min: 10,
          name: 'Community Hero',
          icon: '🦸',
          color: 'bg-purple-100 text-purple-800',
        },
        {
          min: 25,
          name: 'Legendary Giver',
          icon: '⭐',
          color: 'bg-yellow-100 text-yellow-800',
        },
        {
          min: 50,
          name: 'Giveaway Champion',
          icon: '🏆',
          color: 'bg-orange-100 text-orange-800',
        },
      ];

      for (const badgeThreshold of availableBadges) {
        if (totalActivity >= badgeThreshold.min) {
          const alreadyHasBadge = user.badges.some(
            (b) => b.name === badgeThreshold.name,
          );
          if (!alreadyHasBadge) {
            const newBadge: Badge = {
              id: `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: badgeThreshold.name,
              description: `Earned after ${badgeThreshold.min} giveaway/contribution activities`,
              icon: badgeThreshold.icon,
              color: badgeThreshold.color,
              earnedAt: new Date(),
            };
            dispatch({
              type: 'AWARD_BADGE',
              payload: { userId, badge: newBadge },
            });
          }
        }
      }
    },
    [state.users, state.entries, state.contributions],
  );

  /**
   * Context value with all state and action functions
   */
  const contextValue: AppContextType = {
    ...state,

    // ============ User Actions ============
    login: async (user: User) => {
      // Call Auth.js signIn
      await signIn('credentials', {
        email: user.email,
        redirect: false,
      });
      dispatch({ type: 'SET_USER', payload: user });
    },

    logout: async () => {
      // Call Auth.js signOut
      await signOut({ redirect: false });
      dispatch({ type: 'SET_USER', payload: null });
    },

    setCurrentUser: (user: User | null) => {
      dispatch({ type: 'SET_USER', payload: user });
    },
    // Hydration state for SSR
    isHydrated,

    // ============ Post Actions ============
    createPost: (postData) => {
      const newPost: Post = {
        ...postData,
        id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: state.user!,
        burnCount: 0,
        shareCount: 0,
        likesCount: 0,
        entriesCount: 0,
        commentCount: 0,
        entries: [],
        contributions: [],
      };
      dispatch({ type: 'ADD_POST', payload: newPost });
      trackEvent(
        'post_created',
        {
          postId: newPost.id,
          category: newPost.category,
          type: newPost.type,
        },
        state.user ? { userId: state.user.id } : undefined,
      );
    },

    addPost: (post: Post) => {
      dispatch({ type: 'ADD_POST', payload: post });
    },

    updatePost: (postId: string, updates: Partial<Post>) => {
      dispatch({ type: 'UPDATE_POST', payload: { id: postId, updates } });
    },

    deletePost: (postId: string) => {
      dispatch({ type: 'DELETE_POST', payload: postId });
    },

    burnPost: (postId: string) => {
      dispatch({ type: 'BURN_POST', payload: postId });
    },

    // ============ Entry Actions ============
    submitEntry: (entryData) => {
      const newEntry: Entry = {
        ...entryData,
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        submittedAt: new Date(),
        user: state.user!,
      };
      dispatch({ type: 'ADD_ENTRY', payload: newEntry });
      checkAndAwardBadges(state.user?.id || '', 'entry');
      trackEvent(
        'entry_submitted',
        {
          entryId: newEntry.id,
          postId: newEntry.postId,
        },
        state.user ? { userId: state.user.id } : undefined,
      );
    },

    addEntry: (entry: Entry) => {
      dispatch({ type: 'ADD_ENTRY', payload: entry });
    },

    updateEntry: (id: string, updates: Partial<Entry>) => {
      dispatch({ type: 'UPDATE_ENTRY', payload: { id, updates } });
    },

    // ============ Contribution Actions ============
    makeContribution: (contributionData) => {
      const newContribution: HelpContribution = {
        ...contributionData,
        id: `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        contributedAt: new Date(),
        user: state.user!,
      };
      dispatch({ type: 'ADD_CONTRIBUTION', payload: newContribution });
      checkAndAwardBadges(state.user?.id || '', 'contribution');
    },

    // ============ Reply Actions ============
    addReply: (
      replyData: Omit<Reply, 'id' | 'createdAt' | 'user' | 'burnCount'>,
    ) => {
      const reply: Reply = {
        ...replyData,
        id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user: state.user!,
        createdAt: new Date(),
        burnCount: 0,
      };

      dispatch({
        type: 'ADD_REPLY',
        payload: {
          parentId: replyData.parentId,
          parentType: replyData.parentType,
          reply,
        },
      });
    },

    burnReply: (replyId: string) => {
      dispatch({ type: 'BURN_REPLY', payload: replyId });
    },

    // ============ Interaction Actions ============
    toggleLike: (id: string) => {
      const wasLiked = state.likes.has(id);
      dispatch({ type: 'TOGGLE_LIKE', payload: id });
      if (!wasLiked) {
        trackEvent(
          'like_added',
          { targetId: id },
          state.user ? { userId: state.user.id } : undefined,
        );
      }
    },

    toggleBurn: (id: string) => {
      dispatch({ type: 'TOGGLE_BURN', payload: id });
    },

    incrementShare: (postId: string) => {
      dispatch({ type: 'INCREMENT_SHARE', payload: postId });
      trackEvent(
        'share_clicked',
        { postId },
        state.user ? { userId: state.user.id } : undefined,
      );
    },

    // ============ Utility Actions ============
    clearError: () => {
      dispatch({ type: 'SET_ERROR', payload: null });
    },

    setError: (message: string | null, source: string = 'app-context') => {
      dispatch({ type: 'SET_ERROR', payload: message });
      if (message) {
        const safeMessage =
          message.length > 200 ? message.slice(0, 200) + '…' : message;
        trackEvent(
          'error_occurred',
          { message: safeMessage, source },
          state.user ? { userId: state.user.id } : undefined,
        );
      }
    },

    setLoading: (loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    },

    toggleTheme: () => {
      dispatch({ type: 'TOGGLE_THEME' });
    },

    setShowCreateModal: (show: boolean) => {
      dispatch({ type: 'SET_CREATE_MODAL', payload: show });
    },

    setShowGiveawayModal: (show: boolean) => {
      dispatch({ type: 'SET_GIVEAWAY_MODAL', payload: show });
    },

    setShowRequestModal: (show: boolean) => {
      dispatch({ type: 'SET_REQUEST_MODAL', payload: show });
    },
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

/**
 * Custom hook to access the AppContext
 *
 * Provides type-safe access to global application state and actions.
 * Must be used within an AppProvider component.
 *
 * @throws Error if used outside of AppProvider
 * @returns AppContextType with all state and action functions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { posts, addPost, currentUser, toggleLike } = useAppContext();
 *
 *   const handleLike = (postId: string) => {
 *     toggleLike(postId);
 *   };
 *
 *   return (
 *     <div>
 *       {posts.map(post => (
 *         <PostCard
 *           key={post.id}
 *           post={post}
 *           onLike={() => handleLike(post.id)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

/**
 * Legacy alias for useAppContext
 * @deprecated Use useAppContext instead for consistency with naming conventions
 */
export function useAp(): AppContextType {
  return useAppContext();
}

/**
 * Export the context for advanced use cases
 * (e.g., accessing context in class components)
 */
export { AppContext };
