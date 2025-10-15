import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./utils/jwtUtils";

// Rotas públicas que não exigem autenticação
const publicRoutes = ["/", "/alterar-senha", "/dashboard-panel"];

// Recursos estáticos e rotas internas do Next.js que devem ser ignoradas pelo middleware
const ignoredRoutes = [
  "/_next",
  "/favicon.ico",
  "/images",
  "/static",
  "/api-proxy",
];

// Comentamos esta linha para evitar o erro de lint, já que estamos usando uma verificação direta
// const publicApiRoutes = ["/api/auth/login", "/login"];

/**
 * Middleware para proteção de rotas no Next.js
 * Verifica se o usuário está autenticado antes de permitir acesso às rotas privadas e APIs
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isTechRoute = pathname.startsWith("/tecnico");

  console.log("Middleware executando para:", pathname);

  // Verificar se a rota é um recurso estático ou rota interna do Next.js
  if (ignoredRoutes.some((route) => pathname.startsWith(route))) {
    console.log("Rota ignorada:", pathname);
    return NextResponse.next();
  }

  // Verificar se a rota atual é pública
  if (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    console.log("Rota pública:", pathname);
    return NextResponse.next();
  }

  // Verificar se é uma chamada para a API de login - casos especiais
  if (
    pathname === "/login" ||
    pathname.includes("/api/auth/login") ||
    pathname.endsWith("/login")
  ) {
    console.log("Rota de login permitida:", pathname);
    return NextResponse.next();
  }

  // Verifica se existe um token no cookie
  const tokenCookie = request.cookies.get("token")?.value;
  console.log("Verificando token no middleware:", {
    path: pathname,
    hasToken: !!tokenCookie,
    tokenLength: tokenCookie?.length || 0,
  });

  // Verifica se a solicitação inclui _rsc (React Server Component)
  // para evitar redirecionamentos em solicitações internas do Next.js
  const isRSCRequest = request.nextUrl.searchParams.has("_rsc");

  // Verifica se é uma chamada para API
  const isApiRequest = pathname.startsWith("/api/");

  // Verificar explicitamente se é o endpoint de login
  const isLoginEndpoint =
    pathname === "/login" ||
    pathname.includes("/api/login") ||
    pathname.endsWith("/login");

  // Verificar se é o proxy para API
  const isApiProxy = pathname.startsWith("/api-proxy");

  // Se for o endpoint de login ou proxy para API, permitir a passagem
  if (isLoginEndpoint || isApiProxy) {
    console.log("Permitindo passagem para endpoint:", pathname);
    return NextResponse.next();
  }

  // Verifica se existe um token no localStorage (apenas para rotas no cliente)
  // Como middleware roda no lado do servidor, precisamos verificar o cookie.
  if (!tokenCookie) {
    // Se for uma solicitação RSC, apenas deixe passar para evitar loops
    if (isRSCRequest) {
      return NextResponse.next();
    }

    // Tratamento específico para solicitações de API
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

    // Para rotas normais, redirecionar para página de login
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set(
      "authError",
      "Sua sessão expirou, faça login novamente."
    );

    // Criar resposta com cookie para sinalizar ao cliente que deve limpar o localStorage
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("clearLocalStorage", "true", {
      maxAge: 30,
      path: "/",
    });

    return response;
  }

  // Verificar se o token é válido
  const { isValid, payload } = verifyToken(tokenCookie);
  if (!isValid) {
    // Se for uma solicitação RSC, apenas deixe passar para evitar loops
    if (isRSCRequest) {
      return NextResponse.next();
    }

    // Tratamento específico para solicitações de API
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

    // Para rotas normais, redirecionar para página de login
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set(
      "authError",
      "Sua sessão expirou, faça login novamente."
    );

    // Criar resposta com cookie para sinalizar ao cliente que deve limpar o localStorage
    const response = NextResponse.redirect(redirectUrl);

    // Limpar o cookie do token inválido
    response.cookies.delete("token");

    // Adicionar cookie para sinalizar limpeza do localStorage no lado do cliente
    response.cookies.set("clearLocalStorage", "true", {
      maxAge: 30, // Cookie de curta duração
      path: "/",
    });

    return response;
  }

  const activeModuleCookie = request.cookies.get("active_module")?.value;
  const normalizedModule =
    activeModuleCookie === "admin" || activeModuleCookie === "tecnico"
      ? activeModuleCookie
      : null;
  let moduleResponse: NextResponse | null = null;

  if (!isApiRequest && (isAdminRoute || isTechRoute)) {
    const requestedModule = isAdminRoute ? "admin" : "tecnico";

    if (normalizedModule && normalizedModule !== requestedModule) {
      const redirectPath =
        normalizedModule === "admin" ? "/admin/dashboard" : "/tecnico/dashboard";
      const redirectUrl = new URL(redirectPath, request.url);

      return NextResponse.redirect(redirectUrl);
    }

    if (!normalizedModule) {
      moduleResponse = NextResponse.next();
      moduleResponse.cookies.set("active_module", requestedModule, {
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
        httpOnly: false,
      });
    }
  }
  // Se chegou até aqui, o token é válido
  // Para APIs, adicionar o payload do usuário no cabeçalho da requisição para uso posterior
  if (isApiRequest && payload) {
    // Clone a requisição e adicione o payload decodificado como cabeçalho
    // permitindo que o backend tenha acesso aos dados do usuário
    const requestHeaders = new Headers(request.headers);

    // Garantir que o ID existe antes de converter para string
    const userId = payload.id || payload.id_usuario || 0;
    requestHeaders.set("X-User-ID", userId.toString());

    requestHeaders.set(
      "X-User-Role",
      JSON.stringify({
        admin: payload.administrador || false,
        interno: payload.perfil_interno || false,
        gestor: payload.perfil_gestor_assistencia || false,
        tecnico_proprio: payload.perfil_tecnico_proprio || false,
        tecnico_terceirizado: payload.perfil_tecnico_terceirizado || false,
      })
    );

    // Criar uma nova requisição com os cabeçalhos adicionados
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

    return NextResponse.next({
      request: modifiedRequest,
    });
  }

  if (moduleResponse) {
    return moduleResponse;
  }

  return NextResponse.next();
}

// Configuração para definir quais caminhos devem ser processados pelo middleware
export const config = {
  matcher: [
    // Rotas protegidas - áreas administrativas e técnicas
    "/admin/:path*",
    "/tecnico/:path*",
    // Dashboard panel, em caso de proteção específica
    "/dashboard-panel/:path*",
    // Proteção para rotas de API, com exclusão explícita da rota de login
    "/api/:path*",
  ],
};


