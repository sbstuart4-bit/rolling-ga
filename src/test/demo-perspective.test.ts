import { describe, expect, it } from "vitest";
import {
  DEMO_PERSPECTIVES,
  parseDemoPerspective,
  demoPerspectiveHref,
} from "@/lib/demo-perspective";

describe("demo perspective", () => {
  it("parses fan, artist, and ops perspectives", () => {
    expect(parseDemoPerspective(undefined)).toBe("fan");
    expect(parseDemoPerspective("fan")).toBe("fan");
    expect(parseDemoPerspective("artist")).toBe("artist");
    expect(parseDemoPerspective("ops")).toBe("ops");
    expect(parseDemoPerspective("invalid")).toBe("fan");
  });

  it("exposes all three perspectives", () => {
    expect(DEMO_PERSPECTIVES).toEqual(["fan", "artist", "ops"]);
  });

  it("builds hrefs for demo board navigation", () => {
    expect(demoPerspectiveHref("fan")).toBe("/demo");
    expect(demoPerspectiveHref("artist")).toBe("/demo?perspective=artist");
    expect(demoPerspectiveHref("ops")).toBe("/demo?perspective=ops");
  });
});
