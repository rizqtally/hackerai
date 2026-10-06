import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getUserID } from "@/lib/auth/get-user-id";
import { ChatSDKError } from "@/lib/errors";
import { encryptZaiApiKey } from "@/lib/ai/zai-credentials";
import { getConvexClient } from "@/lib/db/convex-client";

const MAX_REQUEST_BYTES = 4096;
const MAX_KEY_LENGTH = 512;

function validateApiKey(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const apiKey = value.trim();
  return apiKey.length >= 8 && apiKey.length <= MAX_KEY_LENGTH ? apiKey : null;
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserID(req);
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: "Request is too large" },
        { status: 413 },
      );
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_REQUEST_BYTES) {
      return NextResponse.json(
        { error: "Request is too large" },
        { status: 413 },
      );
    }
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }
    const apiKey =
      body && typeof body === "object" && "apiKey" in body
        ? validateApiKey(body.apiKey)
        : null;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Enter a valid Z.AI API key" },
        { status: 400 },
      );
    }

    await getConvexClient().mutation(
      api.userCustomization.saveZaiApiKeyForBackend,
      {
        serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
        userId,
        encryptedApiKey: encryptZaiApiKey(apiKey),
        keyLastFour: apiKey.slice(-4),
      },
    );

    return NextResponse.json(
      { saved: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ChatSDKError) return error.toResponse();
    return NextResponse.json(
      { error: "Unable to save the Z.AI API key right now" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserID(req);
    await getConvexClient().mutation(
      api.userCustomization.removeZaiApiKeyForBackend,
      {
        serviceKey: process.env.CONVEX_SERVICE_ROLE_KEY!,
        userId,
      },
    );
    return NextResponse.json(
      { removed: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ChatSDKError) return error.toResponse();
    return NextResponse.json(
      { error: "Unable to remove the Z.AI API key right now" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
