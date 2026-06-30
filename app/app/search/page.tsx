"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Frown, Search, SlidersHorizontal, Users } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { PostCard } from "@/components/post-card";
import { mapApiPostToClientPost } from "@/lib/map-api-post";
import type { Post } from "@/lib/types";
import {
  buildPostsSearchQuery,
  filterPeople,
  hasActiveSearch,
  POST_CATEGORIES,
  SEARCH_SORTS,
  SEARCH_TYPES,
  type DiscoveryPerson,
  type PostCategory,
  type SearchSort,
  type SearchType,
} from "@/lib/search";

const ALL_CATEGORIES = "all";

function SearchSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-40 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
      ))}
    </div>
  );
}

function PersonCard({ person }: { person: DiscoveryPerson }) {
  const initials = person.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link href={`/profile/${person.id}`}>
      <Card className="hover:shadow-md transition-shadow border-gray-100 dark:border-gray-800">
        <CardContent className="flex items-center gap-3 p-4">
          <Avatar className="h-11 w-11">
            <AvatarImage src={person.avatar_url || "/placeholder.svg"} alt={person.name} />
            <AvatarFallback>{initials || "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium truncate">{person.name}</p>
            {typeof person.xp === "number" && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {person.xp.toLocaleString()} XP
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [type, setType] = useState<SearchType>(
    () => (searchParams.get("type") as SearchType) || "all",
  );
  const [category, setCategory] = useState<PostCategory | "all">(ALL_CATEGORIES);
  const [sort, setSort] = useState<SearchSort>("recent");
  const [activeOnly, setActiveOnly] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [people, setPeople] = useState<DiscoveryPerson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce the keyword so we don't fire a request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timeout);
  }, [query]);

  const filters = useMemo(
    () => ({ q: debouncedQuery, type, category, sort, activeOnly }),
    [debouncedQuery, type, category, sort, activeOnly],
  );

  // Keep the URL in sync so searches are shareable / bookmarkable.
  useEffect(() => {
    const queryString = buildPostsSearchQuery({ q: debouncedQuery, type });
    router.replace(queryString ? `/search?${queryString}` : "/search", {
      scroll: false,
    });
  }, [debouncedQuery, type, router]);

  // Fetch matching posts whenever the filters change.
  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const queryString = buildPostsSearchQuery({ ...filters, limit: 30 });
        const res = await fetch(`/api/posts?${queryString}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        const rawList: Record<string, unknown>[] = json.data?.posts ?? [];
        const mapped = rawList
          .map((p) => mapApiPostToClientPost(p))
          .filter(Boolean) as Post[];
        if (!cancelled) setPosts(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load results");
          setPosts([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadPosts();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  // People discovery is powered by the leaderboard and filtered client-side.
  useEffect(() => {
    let cancelled = false;

    const loadPeople = async () => {
      try {
        const res = await fetch("/api/leaderboard?period=all-time&limit=50", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setPeople(json.data?.leaderboard ?? []);
      } catch {
        if (!cancelled) setPeople([]);
      }
    };

    loadPeople();
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePeople = useMemo(
    () => filterPeople(people, debouncedQuery),
    [people, debouncedQuery],
  );

  const searching = hasActiveSearch(filters);
  const noResults = !isLoading && searching && posts.length === 0;
  const idle = !isLoading && !searching && posts.length === 0;

  const inputRef = useRef<HTMLInputElement>(null);
  const focusInput = useCallback(() => inputRef.current?.focus(), []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Search &amp; Discover</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Find giveaways, help requests, and community members.
        </p>
      </header>

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts and people..."
          aria-label="Search"
          className="pl-9"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={type} onValueChange={(value) => setType(value as SearchType)}>
          <TabsList>
            {SEARCH_TYPES.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Select
          value={category}
          onValueChange={(value) =>
            setCategory(value as PostCategory | "all")
          }
        >
          <SelectTrigger className="w-[160px]">
            <SlidersHorizontal className="h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
            {POST_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat} className="capitalize">
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(value) => setSort(value as SearchSort)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_SORTS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant={activeOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveOnly((value) => !value)}
        >
          Active only
        </Button>
      </div>

      {/* Results */}
      <section className="space-y-4">
        {isLoading && <SearchSkeleton />}

        {error && !isLoading && (
          <Card>
            <CardContent className="p-6 text-center text-red-600 dark:text-red-400">
              {error}
            </CardContent>
          </Card>
        )}

        {!isLoading && !error && posts.length > 0 && (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {posts.length} {posts.length === 1 ? "result" : "results"}
            </p>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </>
        )}

        {noResults && (
          <Card>
            <CardContent className="p-8 text-center space-y-2">
              <Frown className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="text-lg font-semibold">No results found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                We couldn&apos;t find anything matching your search. Try a
                different keyword or clear your filters.
              </p>
            </CardContent>
          </Card>
        )}

        {idle && (
          <Card>
            <CardContent className="p-8 text-center space-y-2">
              <Search className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="text-lg font-semibold">Start exploring</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Search by keyword or pick a filter to discover giveaways and
                help requests.
              </p>
              <Button variant="outline" size="sm" onClick={focusInput}>
                Search now
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* People discovery */}
      {visiblePeople.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold">People to discover</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {visiblePeople.map((person) => (
              <PersonCard key={person.id} person={person} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-6"><SearchSkeleton /></div>}>
      <SearchView />
    </Suspense>
  );
}
