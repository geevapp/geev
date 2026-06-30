/**
 * Pure helpers for the global search & discovery surface.
 *
 * Kept free of React/DOM so the query-building and filtering logic can be
 * unit-tested in isolation and reused by the search page and the navbar.
 */

export type SearchType = "all" | "giveaway" | "request";
export type SearchSort = "recent" | "popular" | "ending_soon";

export const SEARCH_TYPES: { value: SearchType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "giveaway", label: "Giveaways" },
  { value: "request", label: "Requests" },
];

export const SEARCH_SORTS: { value: SearchSort; label: string }[] = [
  { value: "recent", label: "Most recent" },
  { value: "popular", label: "Most popular" },
  { value: "ending_soon", label: "Ending soon" },
];

/** Post categories, mirrored from the Prisma `PostCategory` enum. */
export const POST_CATEGORIES = [
  "electronics",
  "clothing",
  "books",
  "furniture",
  "toys",
  "food",
  "sports",
  "beauty",
  "automotive",
  "other",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export interface SearchFilters {
  q?: string;
  type?: SearchType;
  category?: PostCategory | "all" | "";
  sort?: SearchSort;
  /** When true, restrict to posts whose deadline has not yet passed. */
  activeOnly?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Build the query string for `GET /api/posts` from the current search filters.
 *
 * Empty/"all"/default values are omitted so the URL stays clean and the backend
 * receives only meaningful parameters. `activeOnly` maps to the API's
 * `filter=active`.
 */
export function buildPostsSearchQuery(filters: SearchFilters): string {
  const params = new URLSearchParams();

  const q = filters.q?.trim();
  if (q) params.set("q", q);

  if (filters.type && filters.type !== "all") {
    params.set("type", filters.type);
  }

  if (filters.category && filters.category !== "all") {
    params.set("category", filters.category);
  }

  // "recent" is the API default ordering, so only send non-default sorts.
  if (filters.sort && filters.sort !== "recent") {
    params.set("sort", filters.sort);
  }

  if (filters.activeOnly) {
    params.set("filter", "active");
  }

  if (filters.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  return params.toString();
}

/** True when the user has not provided any keyword or narrowing filter yet. */
export function hasActiveSearch(filters: SearchFilters): boolean {
  return Boolean(
    filters.q?.trim() ||
      (filters.type && filters.type !== "all") ||
      (filters.category && filters.category !== "all") ||
      filters.activeOnly,
  );
}

export interface DiscoveryPerson {
  id: string;
  name: string;
  avatar_url?: string | null;
  xp?: number;
}

/**
 * Filter leaderboard people by a free-text query (case-insensitive name match).
 * The leaderboard API has no `q` parameter, so people discovery is filtered
 * client-side. An empty query returns everyone (capped by `limit`).
 */
export function filterPeople<T extends DiscoveryPerson>(
  people: T[],
  query: string | undefined,
  limit = 12,
): T[] {
  const q = query?.trim().toLowerCase();
  const matches = q
    ? people.filter((person) => person.name?.toLowerCase().includes(q))
    : people;
  return matches.slice(0, limit);
}
