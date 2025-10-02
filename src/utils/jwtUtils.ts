import jwt from "jsonwebtoken";

// Interface para representar o payload do token JWT
export interface JwtPayload {
  id: number;
  nome: string;
  login: string;
  email: string;
  perfil_interno: boolean;
  perfil_gestor_assistencia: boolean;
  perfil_tecnico_proprio: boolean;
  perfil_tecnico_terceirizado: boolean;
  administrador: boolean;
  exp?: number; // Tempo de expiração do token
  iat?: number; // Tempo de emissão do token
}

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
      return { isValid: false };
    }

    // Decodifica o token sem verificar a assinatura (não temos a chave secreta do backend)
    // Apenas para verificar se o formato é válido e se está expirado
    const decoded = jwt.decode(token) as JwtPayload;

    // Verifica se o token foi decodificado corretamente
    if (!decoded) {
      return { isValid: false };
    }

    // Verifica se o token tem um campo de expiração
    if (decoded.exp) {
      // Verifica se o token expirou
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        return { isValid: false };
      }
    }

    // Token é válido
    return { isValid: true, payload: decoded };
  } catch (error) {
    console.error("Erro ao verificar token JWT:", error);
    return { isValid: false };
  }
};
