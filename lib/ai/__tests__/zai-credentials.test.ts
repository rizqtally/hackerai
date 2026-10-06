import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

jest.mock("server-only", () => ({}));

import { decryptZaiApiKey, encryptZaiApiKey } from "@/lib/ai/zai-credentials";

const originalServiceKey = process.env.CONVEX_SERVICE_ROLE_KEY;

describe("Z.AI credential encryption", () => {
  beforeEach(() => {
    process.env.CONVEX_SERVICE_ROLE_KEY = "test-convex-service-role-key";
  });

  afterAll(() => {
    if (originalServiceKey === undefined) {
      delete process.env.CONVEX_SERVICE_ROLE_KEY;
    } else {
      process.env.CONVEX_SERVICE_ROLE_KEY = originalServiceKey;
    }
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
