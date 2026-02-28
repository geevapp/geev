'use client';

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
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';
import { deserializeState, serializeState } from '@/lib/utils';
import { mockPosts, mockUsers } from '@/lib/mock-data';
import { signIn, signOut } from 'next-auth/react';

import type React from 'react';
import { getUserById } from '@/lib/mock-auth';
import { useSession } from 'next-auth/react';

const initialState: AppState = {
  likes: new Set<string>(),
  burns: new Set<string>(),
  user: null,
  posts: [],
  users: [],
  entries: [],
  replies: [],
  contributions: [],
  comments: [],
  isLoading: false,
  theme: 'light',
  showCreateModal: false,
  showGiveawayModal: false,
  showRequestModal: false,
};

/** LocalStorage key for persisting application state */
const STORAGE_KEY = 'geev_app_state';

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
  | { type: 'ADD_CONTRIBUTION'; payload: HelpContribution }
  | {
      type: 'ADD_REPLY';
      payload: {
        parentId: string;
        parentType: 'entry' | 'contribution';
        reply: any;
      };
    }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOGGLE_THEME' }
  | { type: 'AWARD_BADGE'; payload: { userId: string; badge: Badge } }
  | { type: 'SET_CREATE_MODAL'; payload: boolean }
  | { type: 'SET_GIVEAWAY_MODAL'; payload: boolean }
  | { type: 'SET_REQUEST_MODAL'; payload: boolean }
  | { type: 'HYDRATE_STATE'; payload: Partial<AppState> };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'HYDRATE_STATE':
      return { ...state, ...action.payload };
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
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
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
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const { data: session } = useSession();

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

  useEffect(() => {
    dispatch({ type: 'SET_USERS', payload: mockUsers });
    dispatch({ type: 'SET_POSTS', payload: mockPosts });
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      dispatch({ type: 'TOGGLE_THEME' });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', state.theme);
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state.theme]);

  const contextValue: AppContextType = {
    ...state,
    login: async (
      user: User,
      credentials: {
        walletAddress?: string;
        signature?: string;
        message?: string;
      } = {},
    ) => {
      // Call Auth.js signIn
      const url = await signIn('credentials', {
        email: user.email ?? undefined,
        redirect: false,
        ...credentials,
      });

      if (!url.error) {
        dispatch({ type: 'SET_USER', payload: user });
      }
      return url;
    },
    logout: async () => {
      await signOut({ redirect: false });
      dispatch({ type: 'SET_USER', payload: null });
    },
    setCurrentUser: (user: User | null) => {
      dispatch({ type: 'SET_USER', payload: user });
    },
    createPost: (postData) => {
      const newPost: Post = {
        ...postData,
        id: Date.now().toString(),
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
    },
    burnReply: (replyId: string) => {
      dispatch({ type: 'BURN_REPLY', payload: replyId });
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
    submitEntry: (entryData) => {
      const newEntry: Entry = {
        ...entryData,
        id: Date.now().toString(),
        submittedAt: new Date(),
        user: state.user!,
      };
      dispatch({ type: 'ADD_ENTRY', payload: newEntry });
      checkAndAwardBadges(state.user?.id || '', 'entry');
    },
    makeContribution: (contributionData) => {
      const newContribution: HelpContribution = {
        ...contributionData,
        id: Date.now().toString(),
        contributedAt: new Date(),
        user: state.user!,
      };
      dispatch({ type: 'ADD_CONTRIBUTION', payload: newContribution });
      checkAndAwardBadges(state.user?.id || '', 'contribution');
    },
    addReply: (
      entry: Omit<Reply, 'id' | 'createdAt' | 'user' | 'burnCount'>,
    ) => {
      const reply = {
        id: Date.now().toString(),
        content: entry.content,
        user: state.user!,
        createdAt: new Date(),
        burnCount: 0,
      };

      dispatch({ type: 'ADD_REPLY', payload: { ...entry, reply } });
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
    isHydrated,
  };

  function checkAndAwardBadges(
    userId: string,
    activityType: 'entry' | 'contribution',
  ) {
    const user = state.users.find((u) => u.id === userId);
    if (!user) return;

    const userEntries = state.entries.filter((e) => e.userId === userId).length;
    const userContributions = state.contributions.filter(
      (c) => c.userId === userId,
    ).length;
    const totalActivity = userEntries + userContributions;

    const availableBadges = [
      { min: 1, name: 'First Step' },
      { min: 5, name: 'Generous Giver' },
      { min: 10, name: 'Community Hero' },
      { min: 25, name: 'Legendary Giver' },
      { min: 50, name: 'Giveaway Champion' },
    ];

    for (const badgeThreshold of availableBadges) {
      if (totalActivity >= badgeThreshold.min) {
        const alreadyHasBadge = user.badges.some(
          (b) => b.name === badgeThreshold.name,
        );
        if (!alreadyHasBadge) {
          const newBadge: Badge = {
            id: Date.now().toString(),
            name: badgeThreshold.name,
            description: `Earned after ${badgeThreshold.min} giveaway/contribution activities`,
            iconUrl: '🏆',
            tier: null,
            criteria: null,
            color: 'bg-yellow-100 text-yellow-800',
            awardedAt: new Date(),
          };
          dispatch({
            type: 'AWARD_BADGE',
            payload: { userId, badge: newBadge },
          });
        }
      }
    }
  }

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

/**
 * Legacy alias for useAppContext
 */
export function useApp() {
  return useAppContext();
}
