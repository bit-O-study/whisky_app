import { afterEach, describe, expect, it, vi } from "vitest";
import { getSiteUrl, normalizeSiteUrl } from "../site-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("normalizeSiteUrl", () => {
  it("adds https to host-only values", () => {
    expect(normalizeSiteUrl("example.com")).toBe("https://example.com");
  });

  it("preserves explicit protocol and removes trailing slashes", () => {
    expect(normalizeSiteUrl("https://example.com///")).toBe("https://example.com");
    expect(normalizeSiteUrl("http://localhost:3000/")).toBe("http://localhost:3000");
  });

  it("ignores empty values", () => {
    expect(normalizeSiteUrl("   ")).toBeUndefined();
    expect(normalizeSiteUrl(undefined)).toBeUndefined();
  });
});

describe("getSiteUrl", () => {
  it("falls back to the current Vercel production url", () => {
    expect(getSiteUrl()).toBe("https://whisky-app-vert.vercel.app");
  });

  it("prefers explicit site url over Vercel deployment url", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://whiskydamoa.example/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "project.vercel.app");

    expect(getSiteUrl()).toBe("https://whiskydamoa.example");
  });
});
