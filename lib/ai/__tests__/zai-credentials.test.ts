import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

jest.mock("server-only", () => ({}));

const mockQuery = jest.fn();
jest.mock("@/lib/db/convex-client", () => ({
  getConvexClient: () => ({ query: mockQuery }),
}));

import {
  decryptZaiApiKey,
  encryptZaiApiKey,
  getZaiApiKeyForUser,
} from "@/lib/ai/zai-credentials";

const originalServiceKey = process.env.CONVEX_SERVICE_ROLE_KEY;
const originalTopToolsApiKey = process.env.TOP_TOOLS_AI_API_KEY;

describe("Z.AI credential encryption", () => {
  beforeEach(() => {
    process.env.CONVEX_SERVICE_ROLE_KEY = "test-convex-service-role-key";
    mockQuery.mockReset();
  });

  afterAll(() => {
    if (originalServiceKey === undefined) {
      delete process.env.CONVEX_SERVICE_ROLE_KEY;
    } else {
      process.env.CONVEX_SERVICE_ROLE_KEY = originalServiceKey;
    }
    if (originalTopToolsApiKey === undefined) {
      delete process.env.TOP_TOOLS_AI_API_KEY;
    } else {
      process.env.TOP_TOOLS_AI_API_KEY = originalTopToolsApiKey;
    }
  });

  it("does not load per-user credentials when the shared key is configured", async () => {
    process.env.TOP_TOOLS_AI_API_KEY = "shared-top-tools-key";

    await expect(getZaiApiKeyForUser("user-123")).resolves.toBeUndefined();
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("encrypts credentials with a fresh authenticated ciphertext", () => {
    const apiKey = "top-tools-user-secret-value";
    const first = encryptZaiApiKey(apiKey);
    const second = encryptZaiApiKey(apiKey);

    expect(first).not.toContain(apiKey);
    expect(second).not.toBe(first);
    expect(decryptZaiApiKey(first)).toBe(apiKey);
  });

  it("rejects modified ciphertext", () => {
    const encrypted = encryptZaiApiKey("top-tools-user-secret-value");
    const modified = `${encrypted.slice(0, -1)}${encrypted.endsWith("A") ? "B" : "A"}`;

    expect(() => decryptZaiApiKey(modified)).toThrow();
  });
});
