import { describe, expect, it } from "vitest";
import { demoState } from "../lib/demo-data";
import { createSnapshot, newestSnapshot, parseStoredSnapshot } from "../lib/state-storage";

describe("state snapshot reconciliation", () => {
  it("keeps newer local changes instead of overwriting them on refresh", () => {
    const local = createSnapshot({ ...demoState, pages: [] }, "2026-09-22T10:05:00.000Z");
    const remote = createSnapshot(demoState, "2026-09-22T10:00:00.000Z");
    expect(newestSnapshot(local, remote)).toBe(local);
  });

  it("loads cloud data when it is newer", () => {
    const local = createSnapshot(demoState, "2026-09-22T10:00:00.000Z");
    const remote = createSnapshot({ ...demoState, pages: [] }, "2026-09-22T10:05:00.000Z");
    expect(newestSnapshot(local, remote)).toBe(remote);
  });

  it("migrates the original unversioned local storage format", () => {
    const snapshot = parseStoredSnapshot(JSON.stringify(demoState), "2026-09-22T10:00:00.000Z");
    expect(snapshot?.version).toBe(2);
    expect(snapshot?.state.pages).toHaveLength(2);
  });
});
