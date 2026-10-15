import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("hz_session")?.value;

  if (!token) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const session = verifySessionToken(token);
  if (!session) {
    const response = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    response.cookies.delete("hz_session");
    return response;
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      username: session.username,
      role: session.role,
      displayName: session.displayName,
    },
  });
}
