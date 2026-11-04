import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(async () => "token"),
  signOut: vi.fn(),
}));

import { saveOpportunity } from "@/lib/api";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("saveOpportunity", () => {
  it("posts the opportunity id", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 201 }));

    await saveOpportunity("opp-1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/v1/savedopportunities");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ fundingOpportunityId: "opp-1" });
  });

  it("treats an already saved opportunity as saved", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("This funding opportunity is already saved.", { status: 409 }),
    );

    await expect(saveOpportunity("opp-1")).resolves.toBeUndefined();
  });

  it("explains when the profile is missing", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Create your user profile before saving opportunities.", { status: 409 }),
    );

    await expect(saveOpportunity("opp-1")).rejects.toThrow("Create your user profile");
  });

  it("fails on other errors", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));

    await expect(saveOpportunity("opp-1")).rejects.toThrow("Could not save");
  });
});
