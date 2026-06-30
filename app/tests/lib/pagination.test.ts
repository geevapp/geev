import { describe, expect, it } from "vitest";

import {
  clampInt,
  parseOffsetPagination,
  parsePagination,
} from "@/lib/pagination";

const params = (query: string) => new URLSearchParams(query);

describe("clampInt", () => {
  it("returns the fallback for missing values", () => {
    expect(clampInt(null, 5, 1, 100)).toBe(5);
    expect(clampInt(undefined, 5, 1, 100)).toBe(5);
    expect(clampInt("", 5, 1, 100)).toBe(5);
    expect(clampInt("   ", 5, 1, 100)).toBe(5);
  });

  it("returns the fallback for non-numeric values (the NaN bug)", () => {
    expect(clampInt("abc", 5, 1, 100)).toBe(5);
    expect(clampInt("12abc", 5, 1, 100)).toBe(5);
    expect(clampInt("NaN", 5, 1, 100)).toBe(5);
    expect(clampInt("Infinity", 5, 1, 100)).toBe(5);
  });

  it("clamps numbers into the [min, max] range", () => {
    expect(clampInt("-5", 5, 1, 100)).toBe(1);
    expect(clampInt("0", 5, 1, 100)).toBe(1);
    expect(clampInt("250", 5, 1, 100)).toBe(100);
    expect(clampInt("42", 5, 1, 100)).toBe(42);
  });

  it("truncates fractional values", () => {
    expect(clampInt("3.9", 5, 1, 100)).toBe(3);
  });
});

describe("parsePagination", () => {
  it("uses defaults when params are absent", () => {
    expect(parsePagination(params(""))).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  it("derives skip from page and limit", () => {
    expect(parsePagination(params("page=3&limit=20"))).toEqual({
      page: 3,
      limit: 20,
      skip: 40,
    });
  });

  it("does not 500 on non-numeric input — falls back to defaults", () => {
    expect(parsePagination(params("page=abc&limit=xyz"))).toEqual({
      page: 1,
      limit: 10,
      skip: 0,
    });
  });

  it("clamps page<1 and limit out of range", () => {
    expect(parsePagination(params("page=0&limit=-5"))).toEqual({
      page: 1,
      limit: 1,
      skip: 0,
    });
    expect(parsePagination(params("limit=9999")).limit).toBe(100);
  });

  it("honors custom default and max limit", () => {
    expect(parsePagination(params(""), { defaultLimit: 50 }).limit).toBe(50);
    expect(
      parsePagination(params("limit=40"), { maxLimit: 25 }).limit,
    ).toBe(25);
  });
});

describe("parseOffsetPagination", () => {
  it("uses defaults when params are absent", () => {
    expect(parseOffsetPagination(params(""), { defaultLimit: 20 })).toEqual({
      limit: 20,
      skip: 0,
    });
  });

  it("clamps skip to >= 0 and falls back on non-numeric input", () => {
    expect(parseOffsetPagination(params("skip=-3&limit=abc"), {
      defaultLimit: 20,
    })).toEqual({ limit: 20, skip: 0 });
  });

  it("clamps limit to the max", () => {
    expect(
      parseOffsetPagination(params("limit=500"), { defaultLimit: 20 }).limit,
    ).toBe(100);
  });
});
