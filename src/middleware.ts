import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REQUEST_ID_HEADER = "x-request-id";

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function middleware(request: NextRequest) {
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? generateRequestId();
  const response = NextResponse.next();
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
