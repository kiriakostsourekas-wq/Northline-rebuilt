import { NextResponse } from "next/server";
import { validateInterestSubmission } from "@/lib/interest";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  getRequestIpFromHeaders,
  rateLimitHeaders,
} from "@/lib/security/request";

export async function POST(request: Request) {
  const rateLimit = checkRateLimit({
    key: `interest:${getRequestIpFromHeaders(request.headers)}`,
    limit: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        message: "Too many submissions. Try again shortly.",
      },
      { status: 429, headers: rateLimitHeaders(rateLimit) },
    );
  }

  let payload: unknown;

  try {
    const rawBody = await request.text();
    if (rawBody.length > 16_000) {
      return NextResponse.json(
        {
          ok: false,
          message: "The request body is too large.",
        },
        { status: 413, headers: rateLimitHeaders(rateLimit) },
      );
    }
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "The request body could not be read.",
      },
      { status: 400, headers: rateLimitHeaders(rateLimit) },
    );
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json(
      {
        ok: false,
        message: "Submit a valid request object.",
      },
      { status: 400, headers: rateLimitHeaders(rateLimit) },
    );
  }

  const validation = validateInterestSubmission(
    payload as Record<string, unknown>,
  );

  if (!validation.ok) {
    return NextResponse.json(validation, {
      status: 422,
      headers: rateLimitHeaders(rateLimit),
    });
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Interest received.",
      submission: {
        type: validation.data.type,
        receivedAt: new Date().toISOString(),
      },
    },
    { status: 202, headers: rateLimitHeaders(rateLimit) },
  );
}
