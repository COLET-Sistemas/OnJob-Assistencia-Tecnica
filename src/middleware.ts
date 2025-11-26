import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./utils/jwtUtils";

// Rotas públicas que não exigem autenticação
const publicRoutes = ["/", "/alterar-senha", "/dashboard-panel"];

// Recursos estáticos e rotas internas do Next.js que devem ser ignoradas pelo middleware
const ignoredRoutes = ["/_next", "/favicon.ico", "/images", "/static"];

type AdminRoleKey = "administrador" | "gestor" | "interno";

interface AdminRoutePermission {
  pattern: RegExp;
  allowedRoles: AdminRoleKey[];
}

const normalizeRoleValue = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "") {
      return false;
    }

    if (["true", "1", "s", "sim", "y", "yes"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "n", "nao", "no"].includes(normalized)) {
      return false;
    }

    return true;
  }

  return Boolean(value);
};

const adminRoutePermissions: AdminRoutePermission[] = [
  {
    pattern: /^\/admin\/os_aberto(?:\/|$)/,
    allowedRoles: ["gestor"],
  },
  {
    pattern: /^\/admin\/os_revisao(?:\/|$)/,
    allowedRoles: ["gestor"],
  },
  {
    pattern: /^\/admin\/cadastro(?:\/|$)/,
    allowedRoles: ["gestor"],
  },
  {
    pattern: /^\/admin\/os_consulta(?:\/|$)/,
    allowedRoles: ["gestor", "interno"],
  },
  {
    pattern: /^\/admin\/os_detalhes(?:\/|$)/,
    allowedRoles: ["gestor", "interno"],
  },
  {
    pattern: /^\/admin\/fat_detalhes(?:\/|$)/,
    allowedRoles: ["gestor", "interno"],
  },
  {
    pattern: /^\/admin\/relatorios(?:\/|$)/,
    allowedRoles: ["gestor", "interno"],
  },
  {
    pattern: /^\/admin\/administracao\/usuarios(?:\/|$)/,
    allowedRoles: ["administrador"],
  },
  {
    pattern: /^\/admin\/administracao\/empresa(?:\/|$)/,
    allowedRoles: ["administrador"],
  },
  {
    pattern: /^\/admin\/administracao\/usuarios\/novo(?:\/|$)/,
    allowedRoles: ["administrador"],
  },
  {
    pattern: /^\/admin\/administracao\/usuarios\/editar(?:\/.*)?$/,
    allowedRoles: ["administrador"],
  },
];

/**
 * Middleware para proteção de rotas no Next.js
 * Verifica se o usuário está autenticado antes de permitir acesso às rotas privadas e APIs
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isTechRoute = pathname.startsWith("/tecnico");
  const isApiProxy = pathname.startsWith("/api-proxy");

  console.log("Middleware executando para:", pathname);

  if (ignoredRoutes.some((route) => pathname.startsWith(route))) {
    console.log("Rota ignorada:", pathname);
    return NextResponse.next();
  }

  if (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    console.log("Rota pública:", pathname);
    return NextResponse.next();
  }

  if (
    pathname === "/login" ||
    pathname.includes("/api/auth/login") ||
    pathname.endsWith("/login")
  ) {
    console.log("Rota de login permitida:", pathname);
    return NextResponse.next();
  }

  const tokenCookie = request.cookies.get("token")?.value;
  console.log("Verificando token no middleware:", {
    path: pathname,
    hasToken: !!tokenCookie,
    tokenLength: tokenCookie?.length || 0,
  });

  const isRSCRequest = request.nextUrl.searchParams.has("_rsc");
  const isApiRequest = pathname.startsWith("/api/");
  const isLoginEndpoint =
    pathname === "/login" ||
    pathname.includes("/api/login") ||
    pathname.endsWith("/login");

  if (isApiProxy) {
    const isProxyLogin =
      pathname === "/api-proxy/login" || pathname.endsWith("/auth/login");

    if (!tokenCookie && !isProxyLogin) {
      return NextResponse.json(
        {
          error: "Não autorizado",
          message: "Autenticação necessária para acessar este recurso",
        },
        { status: 401 }
      );
    }

    const proxyHeaders = new Headers(request.headers);
    if (tokenCookie) {
      proxyHeaders.set("Authorization", `Bearer ${tokenCookie}`);
      proxyHeaders.set("X-Token", tokenCookie);
    }

    return NextResponse.next({
      request: {
        headers: proxyHeaders,
      },
    });
  }

  if (isLoginEndpoint) {
    console.log("Permitindo passagem para endpoint:", pathname);
    return NextResponse.next();
  }

  if (!tokenCookie) {
    if (isRSCRequest) {
      return NextResponse.next();
    }

    if (isApiRequest && !isLoginEndpoint) {
      return new NextResponse(
        JSON.stringify({
          error: "Não autorizado",
          message: "Autenticação necessária para acessar este recurso",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set(
      "authError",
      "Sua sessão expirou, faça login novamente."
    );

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("clearLocalStorage", "true", {
      maxAge: 30,
      path: "/",
    });

    return response;
  }

  const { isValid, payload } = verifyToken(tokenCookie);
  if (!isValid) {
    if (isRSCRequest) {
      return NextResponse.next();
    }

    if (isApiRequest) {
      return new NextResponse(
        JSON.stringify({
          error: "Token inválido",
          message: "O token de autenticação expirou ou é inválido",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set(
      "authError",
      "Sua sessão expirou, faça login novamente."
    );

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("token");
    response.cookies.set("clearLocalStorage", "true", {
      maxAge: 30,
      path: "/",
    });

    return response;
  }

  const activeModuleCookie = request.cookies.get("active_module")?.value;
  const normalizedModule =
    activeModuleCookie === "admin" || activeModuleCookie === "tecnico"
      ? activeModuleCookie
      : null;
  let requestedModule: "admin" | "tecnico" | null = null;
  let shouldSetActiveModuleCookie = false;

  if (!isApiRequest && (isAdminRoute || isTechRoute)) {
    requestedModule = isAdminRoute ? "admin" : "tecnico";

    if (normalizedModule && normalizedModule !== requestedModule) {
      const redirectPath =
        normalizedModule === "admin"
          ? "/admin/dashboard"
          : "/tecnico/dashboard";
      const redirectUrl = new URL(redirectPath, request.url);

      return NextResponse.redirect(redirectUrl);
    }

    if (!normalizedModule) {
      shouldSetActiveModuleCookie = true;
    }
  }

  const applyModuleCookie = (response: NextResponse) => {
    if (shouldSetActiveModuleCookie && requestedModule) {
      response.cookies.set("active_module", requestedModule, {
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        httpOnly: false,
      });
    }
    return response;
  };

  const rolesCookieRaw = request.cookies.get("user_roles")?.value;
  let rolesFromCookie: Record<string, unknown> = {};

  if (rolesCookieRaw) {
    try {
      rolesFromCookie = JSON.parse(decodeURIComponent(rolesCookieRaw));
    } catch (error) {
      console.error("Falha ao analisar cookie de roles:", error);
    }
  }

  const effectiveRoles = {
    admin: normalizeRoleValue(payload?.administrador),
    interno: normalizeRoleValue(payload?.perfil_interno),
    gestor: normalizeRoleValue(payload?.perfil_gestor_assistencia),
    tecnico_proprio: normalizeRoleValue(payload?.perfil_tecnico_proprio),
    tecnico_terceirizado: normalizeRoleValue(
      payload?.perfil_tecnico_terceirizado
    ),
  };

  (
    [
      "admin",
      "gestor",
      "interno",
      "tecnico_proprio",
      "tecnico_terceirizado",
    ] as const
  ).forEach((roleKey) => {
    if (rolesFromCookie[roleKey] !== undefined) {
      effectiveRoles[roleKey] = normalizeRoleValue(rolesFromCookie[roleKey]);
    }
  });

  if (!isApiRequest && isAdminRoute && payload) {
    const matchedPermission = adminRoutePermissions.find((permission) =>
      permission.pattern.test(pathname)
    );

    if (matchedPermission) {
      const hasAccess = matchedPermission.allowedRoles.some((role) =>
        role === "administrador"
          ? effectiveRoles.admin
          : role === "gestor"
          ? effectiveRoles.gestor
          : effectiveRoles.interno
      );

      if (!hasAccess) {
        const redirectUrl = new URL("/admin/dashboard", request.url);
        redirectUrl.searchParams.set(
          "permissionDenied",
          "Você não tem permissao para acessar esta tela."
        );

        return applyModuleCookie(NextResponse.redirect(redirectUrl));
      }
    }
  }

  if (isApiRequest && payload) {
    const requestHeaders = new Headers(request.headers);

    const userId = payload.id || payload.id_usuario || 0;
    requestHeaders.set("X-User-ID", userId.toString());

    requestHeaders.set(
      "X-User-Role",
      JSON.stringify({
        admin: effectiveRoles.admin,
        interno: effectiveRoles.interno,
        gestor: effectiveRoles.gestor,
        tecnico_proprio: effectiveRoles.tecnico_proprio,
        tecnico_terceirizado: effectiveRoles.tecnico_terceirizado,
      })
    );

    const modifiedRequest = new Request(request.url, {
      headers: requestHeaders,
      method: request.method,
      body: request.body,
      cache: request.cache,
      credentials: request.credentials,
      integrity: request.integrity,
      keepalive: request.keepalive,
      mode: request.mode,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      signal: request.signal,
    });

    return applyModuleCookie(
      NextResponse.next({
        request: modifiedRequest,
      })
    );
  }

  return applyModuleCookie(NextResponse.next());
}

// Configuração para definir quais caminhos devem ser processados pelo middleware
export const config = {
  matcher: [
    "/admin/:path*",
    "/tecnico/:path*",
    "/dashboard-panel/:path*",
    "/api/:path*",
    "/api-proxy/:path*",
  ],
};
