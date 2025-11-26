import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const secure = request.nextUrl.protocol === "https:";
  const response = NextResponse.json({ sucesso: true });

  ["token", "session_active", "active_module", "user_roles"].forEach(
    (cookieName) => {
      response.cookies.set(cookieName, "", {
        httpOnly: cookieName === "token",
        sameSite: "lax",
        secure,
        path: "/",
        maxAge: 0,
      });
    }
  );

  return response;
}
