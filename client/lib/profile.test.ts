import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({ authorizedFetch: vi.fn() }));

import { authorizedFetch } from "@/lib/api";
import { ensureProfile, profileRequestBody, resetProfileStateForTests } from "@/lib/profile";

const fetchMock = vi.mocked(authorizedFetch);
const res = (status: number) => ({ status, ok: status >= 200 && status < 300 }) as Response;

let counter = 0;
function user(metadata: Record<string, unknown> = {}) {
  counter += 1;
  return { id: `user-${counter}`, email: "jane@x.io", user_metadata: metadata };
}

beforeEach(() => {
  fetchMock.mockReset();
  resetProfileStateForTests();
});

describe("ensureProfile", () => {
  it("does nothing more when profile exists", async () => {
    fetchMock.mockResolvedValueOnce(res(200));
    await ensureProfile(user());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("creates profile on 404", async () => {
    fetchMock.mockResolvedValueOnce(res(404)).mockResolvedValueOnce(res(200));
    await ensureProfile(user({ full_name: "Jane", user_type: "Researcher" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/userprofiles/me", {
      method: "PUT",
      body: JSON.stringify({ fullName: "Jane", userType: "Researcher" }),
    });
  });

  it("never rejects", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    await expect(ensureProfile(user())).resolves.toBeUndefined();
  });

  it("dedupes concurrent calls for the same user", async () => {
    fetchMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(res(200)), 10)),
    );
    const u = user();
    await Promise.all([ensureProfile(u), ensureProfile(u)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips the GET once confirmed this page lifetime", async () => {
    fetchMock.mockResolvedValue(res(200));
    const u = user();
    await ensureProfile(u);
    await ensureProfile(u);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries after a failed attempt", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(res(200));
    const u = user();
    await ensureProfile(u);
    await ensureProfile(u);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("profileRequestBody", () => {
  it("truncates a long name to 100", () => {
    const body = profileRequestBody(user({ full_name: "a".repeat(150) }));
    expect(body.fullName).toHaveLength(100);
  });

  it("falls back to the email local-part", () => {
    expect(profileRequestBody({ id: "x", email: "jane@x.io", user_metadata: {} }).fullName).toBe("jane");
  });

  it("falls back to User without name or email", () => {
    expect(profileRequestBody({ id: "x", user_metadata: {} }).fullName).toBe("User");
  });

  it("truncates a long type to 50", () => {
    expect(profileRequestBody(user({ user_type: "t".repeat(80) })).userType).toHaveLength(50);
  });

  it("falls back to Founder", () => {
    expect(profileRequestBody(user()).userType).toBe("Founder");
  });
});
