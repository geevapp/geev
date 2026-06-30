import { describe, expect, it } from "vitest";

import {
  buildPostsSearchQuery,
  filterPeople,
  hasActiveSearch,
} from "@/lib/search";

const parse = (qs: string) => new URLSearchParams(qs);

describe("buildPostsSearchQuery", () => {
  it("returns an empty string for empty/default filters", () => {
    expect(buildPostsSearchQuery({})).toBe("");
    expect(buildPostsSearchQuery({ q: "", type: "all", sort: "recent" })).toBe(
      "",
    );
  });

  it("includes a trimmed keyword", () => {
    expect(parse(buildPostsSearchQuery({ q: "  bike  " })).get("q")).toBe(
      "bike",
    );
  });

  it("omits the 'all' type but includes specific types", () => {
    expect(parse(buildPostsSearchQuery({ type: "all" })).has("type")).toBe(
      false,
    );
    expect(parse(buildPostsSearchQuery({ type: "giveaway" })).get("type")).toBe(
      "giveaway",
    );
  });

  it("omits the default 'recent' sort but includes other sorts", () => {
    expect(parse(buildPostsSearchQuery({ sort: "recent" })).has("sort")).toBe(
      false,
    );
    expect(parse(buildPostsSearchQuery({ sort: "popular" })).get("sort")).toBe(
      "popular",
    );
  });

  it("includes category unless it is 'all'", () => {
    expect(
      parse(buildPostsSearchQuery({ category: "all" })).has("category"),
    ).toBe(false);
    expect(
      parse(buildPostsSearchQuery({ category: "electronics" })).get("category"),
    ).toBe("electronics");
  });

  it("maps activeOnly to filter=active", () => {
    expect(parse(buildPostsSearchQuery({ activeOnly: true })).get("filter")).toBe(
      "active",
    );
    expect(
      parse(buildPostsSearchQuery({ activeOnly: false })).has("filter"),
    ).toBe(false);
  });

  it("only includes page when greater than 1", () => {
    expect(parse(buildPostsSearchQuery({ page: 1 })).has("page")).toBe(false);
    expect(parse(buildPostsSearchQuery({ page: 3 })).get("page")).toBe("3");
  });

  it("composes multiple filters", () => {
    const params = parse(
      buildPostsSearchQuery({
        q: "laptop",
        type: "giveaway",
        category: "electronics",
        sort: "popular",
        activeOnly: true,
        limit: 30,
      }),
    );
    expect(params.get("q")).toBe("laptop");
    expect(params.get("type")).toBe("giveaway");
    expect(params.get("category")).toBe("electronics");
    expect(params.get("sort")).toBe("popular");
    expect(params.get("filter")).toBe("active");
    expect(params.get("limit")).toBe("30");
  });
});

describe("hasActiveSearch", () => {
  it("is false with no keyword or narrowing filter", () => {
    expect(hasActiveSearch({})).toBe(false);
    expect(hasActiveSearch({ type: "all", category: "all", sort: "popular" })).toBe(
      false,
    );
  });

  it("is true when any meaningful filter is present", () => {
    expect(hasActiveSearch({ q: "hi" })).toBe(true);
    expect(hasActiveSearch({ type: "request" })).toBe(true);
    expect(hasActiveSearch({ category: "books" })).toBe(true);
    expect(hasActiveSearch({ activeOnly: true })).toBe(true);
  });
});

describe("filterPeople", () => {
  const people = [
    { id: "1", name: "Ada Lovelace", xp: 100 },
    { id: "2", name: "Alan Turing", xp: 90 },
    { id: "3", name: "Grace Hopper", xp: 80 },
  ];

  it("returns everyone (capped) when query is empty", () => {
    expect(filterPeople(people, "")).toHaveLength(3);
    expect(filterPeople(people, undefined, 2)).toHaveLength(2);
  });

  it("matches names case-insensitively", () => {
    expect(filterPeople(people, "ALA").map((p) => p.id)).toEqual(["2"]);
    expect(filterPeople(people, "a").map((p) => p.id)).toEqual(["1", "2", "3"]);
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterPeople(people, "zzz")).toEqual([]);
  });
});
