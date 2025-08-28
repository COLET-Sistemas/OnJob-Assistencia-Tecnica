export interface Usuario {
  id: number;
  login: string;
  nome: string;
  email: string;
  perfil_interno: boolean;
  perfil_gestor_assistencia: boolean;
  perfil_tecnico_proprio: boolean;
  perfil_tecnico_terceirizado: boolean;
  administrador: boolean;
  id_empresa: number;
  situacao: string;
  data_situacao: string;
}

// Mantendo a interface original para compatibilidade com código existente
export interface UsuarioLegacy {
  id_usuario: number;
  nome_usuario: string;
  id_regiao: number;
  nome_regiao: string;
  data_cadastro: string;
}

export interface UsuarioRegiao {
  id_usuario: number;
  nome_usuario?: string;
  id_regiao: number | number[];
  nome_regiao?: string;
  data_cadastro?: string;
}
