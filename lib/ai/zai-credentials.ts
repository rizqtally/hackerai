import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/db/convex-client";

const CIPHER = "aes-256-gcm";
const KEY_DERIVATION_CONTEXT = "hackerai/zai-api-key/encryption/v1";
const KEY_VERSION = "v1";

function getEncryptionKey(): Buffer {
  const serviceKey = process.env.CONVEX_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Z.AI credential encryption is not configured");
  }

  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(serviceKey, "utf8"),
      Buffer.from("hackerai-account-credentials", "utf8"),
      Buffer.from(KEY_DERIVATION_CONTEXT, "utf8"),
      32,
    ),
  );
}

export function encryptZaiApiKey(apiKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(CIPHER, getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    KEY_VERSION,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptZaiApiKey(encryptedApiKey: string): string {
  const [version, encodedIv, encodedTag, encodedCiphertext, ...extra] =
    encryptedApiKey.split(":");
  if (
    version !== KEY_VERSION ||
    !encodedIv ||
    !encodedTag ||
    !encodedCiphertext ||
    extra.length > 0
  ) {
    throw new Error("Stored Z.AI credential has an unsupported format");
  }

  const decipher = createDecipheriv(
    CIPHER,
    getEncryptionKey(),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export async function getZaiApiKeyForUser(
  userId: string,
): Promise<string | undefined> {
  const credential = await getConvexClient().query(
    api.userCustomization.getZaiApiKeyForBackend,
    {
      serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
      userId,
    },
  );
  return credential
    ? decryptZaiApiKey(credential.encrypted_api_key)
    : undefined;
}
