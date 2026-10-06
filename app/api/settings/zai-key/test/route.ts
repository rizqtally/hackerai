import { NextRequest, NextResponse } from "next/server";
import { getUserID } from "@/lib/auth/get-user-id";
import { ChatSDKError } from "@/lib/errors";

const MAX_REQUEST_BYTES = 4096;
const MAX_KEY_LENGTH = 512;

export async function POST(req: NextRequest) {
  try {
    await getUserID(req);
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
    const rawKey =
      body && typeof body === "object" && "apiKey" in body
        ? body.apiKey
        : undefined;
    const apiKey = typeof rawKey === "string" ? rawKey.trim() : "";
    if (apiKey.length < 8 || apiKey.length > MAX_KEY_LENGTH) {
      return NextResponse.json(
        { error: "Enter a valid Z.AI API key to test" },
        { status: 400 },
      );
    }

    const response = await fetch(
      "https://top-tools-ai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "glm-5.3-flash",
          messages: [{ role: "user", content: "Reply with OK." }],
          max_tokens: 8,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            response.status === 401 || response.status === 403
              ? "Z.AI rejected this key. Check that it is active and has API access."
              : response.status === 429
                ? "Z.AI rate-limited the test. Try again shortly."
                : "Z.AI could not complete the test request. Check your account and try again.",
        },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { connected: true, model: "glm-5.3-flash" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ChatSDKError) return error.toResponse();
    return NextResponse.json(
      { error: "Could not reach Z.AI. Try again shortly." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
