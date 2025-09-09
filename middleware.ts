import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AI_UA = /(GPTBot|Google-Extended|Applebot-Extended|ClaudeBot|Claude-User|Claude-SearchBot|CCBot|PerplexityBot)/i;

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") || "";
  if (AI_UA.test(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  return NextResponse.next();
}

export const config = { matcher: "/:path*" };


