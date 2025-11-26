import { NextRequest, NextResponse } from "next/server";

const ONE_DAY_SECONDS = 60 * 60 * 24;

const buildLoginUrl = (origin: string) => {
  const apiEnvUrl = process.env.NEXT_PUBLIC_API_URL;

  if (apiEnvUrl) {
    return `${apiEnvUrl}/login`;
  }

  return new URL("/api-proxy/login", origin).toString();
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const loginUrl = buildLoginUrl(request.nextUrl.origin);

    const apiResponse = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      credentials: "include",
    });

    const responseData = await apiResponse.json().catch(() => null);

    if (!apiResponse.ok) {
      return NextResponse.json(responseData || null, {
        status: apiResponse.status,
      });
    }

    if (!responseData?.token) {
      return NextResponse.json(
        { error: "Token n\u00e3o retornado pela API" },
        { status: 500 }
      );
    }

    const secure = request.nextUrl.protocol === "https:";

    const response = NextResponse.json(responseData);

    response.cookies.set("token", responseData.token, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: ONE_DAY_SECONDS,
    });

    response.cookies.set("session_active", "true", {
      httpOnly: false,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: ONE_DAY_SECONDS,
    });

    return response;
  } catch (error) {
    console.error("Erro ao autenticar:", error);
    return NextResponse.json(
      { error: "Erro interno ao autenticar" },
      { status: 500 }
    );
  }
}
