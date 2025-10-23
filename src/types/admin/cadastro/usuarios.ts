export interface Empresa {
  id_empresa: number;
  razao_social: string;
}

// Interface para API response format
export interface UsuarioAPIResponse {
  id: number;
  login: string;
  nome: string;
  email: string;
  telefone?: string;
  senha_provisoria?: boolean;
  perfil_interno?: boolean;
  perfil_gestor_assistencia?: boolean;
  perfil_tecnico_proprio?: boolean;
  perfil_tecnico_terceirizado?: boolean;
  administrador?: boolean;
  permite_cadastro?: boolean;
  situacao: "A" | "I";
  data_situacao: string;
  empresa?: Empresa;
  id_empresa?: number;
}

// Interface para uso na aplicação
export interface Usuario {
  id: number;
  login: string;
  nome: string;
  email: string;
  telefone?: string;
  senha_provisoria?: boolean;
  perfil_interno: boolean;
  perfil_gestor_assistencia: boolean;
  perfil_tecnico_proprio: boolean;
  perfil_tecnico_terceirizado: boolean;
  administrador: boolean;
  permite_cadastro: boolean;
  situacao: string;
  data_situacao: string;
  empresa?: Empresa;
  id_empresa?: number;
  qtd_logins?: number;
  ultimo_login?: string;
}

// Mantendo a interface original para compatibilidade com código existente
export interface UsuarioLegacy {
  id_usuario: number;
  nome_usuario: string;
  id_regiao: number;
  nome_regiao: string;
  data_cadastro: string;
}

// Structure for a single region associated with a user
export interface Regiao {
  id_regiao: number;
  nome_regiao: string;
}

// Structure for a user with their associated regions
export interface UsuarioComRegioes {
  id_usuario: number;
  nome_usuario: string;
  tipo: string;
  regioes: Regiao[];
}

// The paginated response format for the API
export interface UsuariosRegioesResponse {
  total_registros: number;
  total_paginas: number;
  dados: UsuarioComRegioes[];
}

// Keeping the old interface for backwards compatibility
export interface UsuarioRegiao {
  id_usuario: number;
  nome_usuario?: string;
  id_regiao: number | number[];
  nome_regiao?: string;
  data_cadastro?: string;
}
