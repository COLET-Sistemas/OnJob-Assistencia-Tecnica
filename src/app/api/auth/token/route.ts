import { NextRequest, NextResponse } from "next/server";

const ONE_DAY_SECONDS = 60 * 60 * 24;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.token as string | undefined;

    if (!token) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 400 }
      );
    }

    const secure = request.nextUrl.protocol === "https:";
    const response = NextResponse.json({ ok: true });

    response.cookies.set("token", token, {
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
    console.error("Erro ao definir token em cookie:", error);
    return NextResponse.json(
      { error: "Falha ao definir cookie de sessão" },
      { status: 500 }
    );
  }
}
