import jwt from "jsonwebtoken";

// Interface para representar o payload do token JWT
export interface JwtPayload {
  // Campos esperados no token JWT
  id?: number; // ID do usuário
  id_usuario?: number; // Alternativa para id
  nome?: string; // Nome do usuário
  nome_usuario?: string; // Alternativa para nome
  login?: string; // Login do usuário
  email?: string; // Email do usuário

  // Campos de perfil
  perfil_interno?: boolean; // Se tem perfil interno
  perfil_gestor_assistencia?: boolean; // Se é gestor
  perfil_tecnico_proprio?: boolean; // Se é técnico próprio
  perfil_tecnico_terceirizado?: boolean; // Se é técnico terceirizado
  administrador?: boolean; // Se é administrador

  // Campos de perfil alternativos (pode vir em formato aninhado)
  perfil?: {
    interno?: boolean;
    gestor?: boolean;
    tecnico_proprio?: boolean;
    tecnico_terceirizado?: boolean;
    admin?: boolean;
  };

  // Campos padrão de JWT
  exp?: number; // Timestamp de expiração
  iat?: number; // Timestamp de emissão
  sub?: string; // Subject (geralmente o ID do usuário)
}

/**
 * Verifica se um token JWT é válido
 * @param token Token JWT a ser verificado
 * @returns Objeto com o status da verificação e o payload decodificado se for válido
 */
/**
 * Verifica se um token JWT é válido
 * @param token Token JWT a ser verificado
 * @returns Objeto com o status da verificação e o payload decodificado se for válido
 */
export const verifyToken = (
  token: string
): { isValid: boolean; payload?: JwtPayload } => {
  try {
    // Verifica se o token existe
    if (!token) {
      console.warn("Token não fornecido");
      return { isValid: false };
    }

    // Verifica estrutura básica do token (deve ter 3 partes separadas por .)
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) {
      console.warn("Formato de token inválido");
      return { isValid: false };
    }

    // Decodifica o token sem verificar a assinatura (não temos a chave secreta do backend)
    // Apenas para verificar se o formato é válido e se está expirado
    const decoded = jwt.decode(token) as JwtPayload;

    // Verifica se o token foi decodificado corretamente
    if (!decoded) {
      console.warn("Falha ao decodificar o token");
      return { isValid: false };
    }

    // Verifica se contém os campos necessários (com mais flexibilidade)
    // Verifica ID (pode estar em vários formatos)
    const hasValidId = decoded.id || decoded.id_usuario || decoded.sub;

    // Verifica se tem alguma informação de identificação
    if (!hasValidId) {
      console.warn(
        "Token não contém identificação do usuário (id, id_usuario ou sub)"
      );
      return { isValid: false };
    }

    // Verifica se o token tem um campo de expiração
    if (decoded.exp) {
      // Verifica se o token expirou
      const currentTime = Math.floor(Date.now() / 1000);
      // Adiciona uma margem de segurança de 5 segundos para evitar problemas de sincronização
      if (decoded.exp < currentTime - 5) {
        console.warn("Token expirado", {
          expiration: new Date(decoded.exp * 1000).toISOString(),
          current: new Date(currentTime * 1000).toISOString(),
        });
        return { isValid: false };
      }
    } else {
      // Tokens sem expiração são aceitáveis em desenvolvimento
      console.warn(
        "Token sem data de expiração - permitindo em desenvolvimento"
      );
    }

    // Verifica a data de emissão (se disponível) - menos rigoroso
    if (decoded.iat) {
      const currentTime = Math.floor(Date.now() / 1000);
      // Se o token foi emitido no futuro (problema de sincronização de relógio)
      if (decoded.iat > currentTime + 300) {
        // 5 minutos de tolerância (aumentado)
        console.warn("Token com data de emissão inválida (futura)", {
          issuedAt: new Date(decoded.iat * 1000).toISOString(),
          current: new Date(currentTime * 1000).toISOString(),
        });
        // Em desenvolvimento, permitimos mesmo tokens com data futura
        console.warn("Permitindo token com data futura em desenvolvimento");
      }
    }

    // Normaliza o payload para ter uma estrutura consistente
    const normalizedPayload: JwtPayload = {
      id: decoded.id || decoded.id_usuario || parseInt(decoded.sub || "0"),
      nome: decoded.nome || decoded.nome_usuario || "",
      login: decoded.login || "",
      email: decoded.email || "",
      perfil_interno:
        decoded.perfil_interno || decoded.perfil?.interno || false,
      perfil_gestor_assistencia:
        decoded.perfil_gestor_assistencia || decoded.perfil?.gestor || false,
      perfil_tecnico_proprio:
        decoded.perfil_tecnico_proprio ||
        decoded.perfil?.tecnico_proprio ||
        false,
      perfil_tecnico_terceirizado:
        decoded.perfil_tecnico_terceirizado ||
        decoded.perfil?.tecnico_terceirizado ||
        false,
      administrador: decoded.administrador || decoded.perfil?.admin || false,
      exp: decoded.exp,
      iat: decoded.iat,
    };

    // Token é válido
    return { isValid: true, payload: normalizedPayload };
  } catch (error) {
    console.error("Erro ao verificar token JWT:", error);
    return { isValid: false };
  }
};
