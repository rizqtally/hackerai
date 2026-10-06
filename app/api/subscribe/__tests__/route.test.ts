import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ChatSDKError } from "@/lib/errors";

jest.mock("@/app/api/stripe", () => ({ stripe: { checkout: { sessions: { create: jest.fn() } } } }));
jest.mock("@/app/api/workos", () => ({ workos: {} }));

const mockGetUserIDAndPro = jest.fn();
jest.mock("@/lib/auth/get-user-id", () => ({
  getUserIDAndPro: mockGetUserIDAndPro,
}));

function makeRequest(body: Record<string, unknown> = {}) {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: { get: jest.fn().mockReturnValue(null) },
    cookies: { get: jest.fn().mockReturnValue(undefined) },
  } as never;
}

describe("POST /api/subscribe", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserIDAndPro.mockRejectedValue(
      new ChatSDKError("unauthorized:auth"),
    );
  });

  it("permanently disables subscription checkout without authenticating or contacting Stripe", async () => {
    const { POST } = await import("../route");
    const response = await POST(makeRequest({ plan: "pro-monthly-plan" }));

    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      error:
        "Paid checkout is currently unavailable. No payment is required to use HackerAI.",
    });
    expect(mockGetUserIDAndPro).not.toHaveBeenCalled();
  });
});
