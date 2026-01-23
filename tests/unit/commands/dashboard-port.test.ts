import { describe, expect, it } from "vitest";
import { resolveDashboardPort } from "../../../src/commands/dashboard";

describe("resolveDashboardPort", () => {
  it("returns default when no port flag present", () => {
    expect(resolveDashboardPort(["dashboard"])).toBe(3000);
  });

  it("parses long port flag at index zero", () => {
    expect(resolveDashboardPort(["--port", "4100"])).toBe(4100);
  });

  it("parses short port flag", () => {
    expect(resolveDashboardPort(["-p", "4200"])).toBe(4200);
  });

  it("prefers long flag when both provided", () => {
    expect(resolveDashboardPort(["-p", "4200", "--port", "4300"])).toBe(4300);
  });

  it("falls back to default when port value is missing", () => {
    expect(resolveDashboardPort(["--port"])).toBe(3000);
  });

  it("falls back to default when port value is invalid", () => {
    expect(resolveDashboardPort(["--port", "nope"])).toBe(3000);
  });
});
