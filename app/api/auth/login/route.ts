import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const expectedUsername = (process.env.ADMIN_USERNAME || "quotation@hipzoneautomation").trim();
    const expectedPassword = (process.env.ADMIN_PASSWORD || "admin.hipzonequotation").trim();

    // Constant-length/timing comparison check
    const normalizedInputUsername = String(username).trim();
    const normalizedInputPassword = String(password).trim();

    const isUsernameMatch = normalizedInputUsername.toLowerCase() === expectedUsername.toLowerCase();
    const isPasswordMatch = normalizedInputPassword === expectedPassword;

    if (!isUsernameMatch || !isPasswordMatch) {
      return NextResponse.json(
        { error: "Invalid username or password. Please check your credentials." },
        { status: 401 }
      );
    }

    const token = createSessionToken({
      username: expectedUsername,
      role: "admin",
      displayName: "Hipzone Admin",
    });

    const response = NextResponse.json({
      success: true,
      user: {
        username: expectedUsername,
        role: "admin",
        displayName: "Hipzone Admin",
      },
    });

    response.cookies.set("hz_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
