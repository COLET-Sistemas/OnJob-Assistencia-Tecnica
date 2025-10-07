import { JwtPayload } from "./jwtUtils";
import { NextRequest } from "next/server";

/**
 * Interface para representar os requisitos de autorização
 */
export interface AuthRequirement {
  admin?: boolean; // Requer acesso de administrador
  interno?: boolean; // Requer perfil interno
  gestor?: boolean; // Requer perfil de gestor
  tecnico?: boolean; // Requer perfil de técnico (próprio ou terceirizado)
}

/**
 * Verifica se o usuário tem as permissões necessárias com base no payload do token
 * @param payload Payload do token JWT decodificado
 * @param requirements Requisitos de autorização para o recurso
 * @returns Booleano indicando se o usuário tem autorização
 */
export const checkPermissions = (
  payload: JwtPayload,
  requirements: AuthRequirement
): boolean => {
  // Se requer admin, verifica
  if (requirements.admin && !payload.administrador) {
    return false;
  }

  // Se requer perfil interno
  if (requirements.interno && !payload.perfil_interno) {
    return false;
  }

  // Se requer gestor de assistência
  if (requirements.gestor && !payload.perfil_gestor_assistencia) {
    return false;
  }

  // Se requer técnico (próprio ou terceirizado)
  if (
    requirements.tecnico &&
    !payload.perfil_tecnico_proprio &&
    !payload.perfil_tecnico_terceirizado
  ) {
    return false;
  }

  // Se passou por todas as verificações, está autorizado
  return true;
};

/**
 * Extrai informações do usuário dos cabeçalhos da requisição (adicionados pelo middleware)
 * @param request A requisição Next.js
 * @returns O ID do usuário e suas funções/perfis
 */
export const getUserInfoFromRequest = (
  request: NextRequest
): {
  userId: number | null;
  roles: {
    admin: boolean;
    interno: boolean;
    gestor: boolean;
    tecnico_proprio: boolean;
    tecnico_terceirizado: boolean;
  } | null;
} => {
  try {
    const userId = request.headers.get("X-User-ID");
    const userRoles = request.headers.get("X-User-Role");

    if (!userId || !userRoles) {
      return { userId: null, roles: null };
    }

    return {
      userId: parseInt(userId, 10),
      roles: JSON.parse(userRoles),
    };
  } catch (error) {
    console.error("Erro ao extrair informações do usuário dos headers:", error);
    return { userId: null, roles: null };
  }
};

/**
 * Função para proteger rotas de API baseado em requisitos de autenticação
 * @param handler O manipulador da rota de API
 * @param requirements Os requisitos de autorização
 */
export function withAuth(
  handler: (req: NextRequest) => Promise<Response> | Response,
  requirements?: AuthRequirement
) {
  return async (request: NextRequest) => {
    const { userId, roles } = getUserInfoFromRequest(request);

    // Se não tiver ID de usuário ou perfis, retornar erro
    if (!userId || !roles) {
      return new Response(
        JSON.stringify({
          error: "Não autorizado",
          message: "Autenticação necessária",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Se houver requisitos de permissão específicos
    if (requirements) {
      const authorized =
        (requirements.admin ? roles.admin : true) &&
        (requirements.interno ? roles.interno : true) &&
        (requirements.gestor ? roles.gestor : true) &&
        (requirements.tecnico
          ? roles.tecnico_proprio || roles.tecnico_terceirizado
          : true);

      if (!authorized) {
        return new Response(
          JSON.stringify({
            error: "Acesso negado",
            message: "Você não tem permissão para acessar este recurso",
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }

    // Se chegou até aqui, está autorizado
    return handler(request);
  };
}
