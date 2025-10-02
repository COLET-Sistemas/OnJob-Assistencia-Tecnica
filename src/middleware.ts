import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./utils/jwtUtils";

// Rotas públicas que não exigem autenticação
const publicRoutes = ["/", "/alterar-senha", "/dashboard-panel"];

// Rotas de API e recursos estáticos que devem ser ignoradas pelo middleware
const ignoredRoutes = [
  "/_next", 
  "/api", 
  "/favicon.ico", 
  "/images",
  "/static"
];

/**
 * Middleware para proteção de rotas no Next.js
 * Verifica se o usuário está autenticado antes de permitir acesso às rotas privadas
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se a rota deve ser ignorada (APIs, recursos estáticos, etc.)
  if (ignoredRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar se a rota atual é pública
  if (
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    return NextResponse.next();
  }

  // Verifica se existe um token no cookie
  const tokenCookie = request.cookies.get("token")?.value;
  
  // Verifica se a solicitação inclui _rsc (React Server Component) 
  // para evitar redirecionamentos em solicitações internas do Next.js
  const isRSCRequest = request.nextUrl.searchParams.has("_rsc");
  
  // Verifica se existe um token no localStorage (apenas para rotas no cliente)
  // Como middleware roda no lado do servidor, precisamos verificar o cookie.
  // O localStorage será verificado no componente para garantir autenticação no cliente.
  if (!tokenCookie) {
    // Se for uma solicitação RSC, apenas deixe passar para evitar loops
    if (isRSCRequest) {
      return NextResponse.next();
    }
    
    // Redirecionar para a página de login com uma mensagem de erro
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set(
      "authError",
      "Sua sessão expirou, faça login novamente."
    );
    return NextResponse.redirect(redirectUrl);
  }

  // Verificar se o token é válido
  const { isValid } = verifyToken(tokenCookie);
  if (!isValid) {
    // Se for uma solicitação RSC, apenas deixe passar para evitar loops
    if (isRSCRequest) {
      return NextResponse.next();
    }
    
    // Limpar o cookie inválido e redirecionar
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.delete("token");
    
    // Adicionar parâmetro de consulta para exibir a mensagem de erro
    response.cookies.delete("token");
    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set(
      "authError",
      "Sua sessão expirou, faça login novamente."
    );
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Configuração para definir quais caminhos devem ser processados pelo middleware
export const config = {
  matcher: [
    // Rotas protegidas - áreas administrativas e técnicas
    '/admin/:path*',
    '/tecnico/:path*',
    // Dashboard panel, em caso de proteção específica
    '/dashboard-panel/:path*',
  ],
};
