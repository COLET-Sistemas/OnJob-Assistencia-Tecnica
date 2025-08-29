// hooks/useSpecificFilters.ts
import { useFilters } from "./useFilters";

// 1. Para Motivos de Atendimento
export interface MotivosFilters {
  [key: string]: string;
  descricao: string;
  incluir_inativos: string;
}

const INITIAL_MOTIVOS_FILTERS: MotivosFilters = {
  descricao: "",
  incluir_inativos: "",
};

export const useMotivosFilters = () => {
  return useFilters(INITIAL_MOTIVOS_FILTERS, "filters_motivos_atendimento");
};

// 2. Para Regiões
export interface RegioesFilters {
  [key: string]: string;
  nome: string;
  uf: string;
  atendida_empresa: string;
  incluir_inativos: string;
}

const INITIAL_REGIOES_FILTERS: RegioesFilters = {
  nome: "",
  uf: "",
  atendida_empresa: "",
  incluir_inativos: "",
};

export const useRegioesFilters = () => {
  return useFilters(INITIAL_REGIOES_FILTERS, "filters_regioes");
};

// 3. Para Peças
export interface PecasFilters {
  [key: string]: string;
  codigo_peca: string;
  descricao: string;
  tipo_peca_id: string;
  incluir_inativos: string;
}

const INITIAL_PECAS_FILTERS: PecasFilters = {
  codigo_peca: "",
  descricao: "",
  tipo_peca_id: "",
  incluir_inativos: "",
};

export const usePecasFilters = () => {
  return useFilters(INITIAL_PECAS_FILTERS, "filters_pecas");
};

// 4. Para Máquinas
export interface MaquinasFilters {
  [key: string]: string;
  numero_serie: string;
  modelo: string;
  cliente_id: string;
  incluir_inativos: string;
}

const INITIAL_MAQUINAS_FILTERS: MaquinasFilters = {
  numero_serie: "",
  modelo: "",
  cliente_id: "",
  incluir_inativos: "",
};

export const useMaquinasFilters = () => {
  return useFilters(INITIAL_MAQUINAS_FILTERS, "filters_maquinas");
};

// 5. Para Usuários
export interface UsuariosFilters {
  [key: string]: string;
  nome: string;
  email: string;
  perfil: string;
  incluir_inativos: string;
}

const INITIAL_USUARIOS_FILTERS: UsuariosFilters = {
  nome: "",
  email: "",
  perfil: "",
  incluir_inativos: "",
};

export const useUsuariosFilters = () => {
  return useFilters(INITIAL_USUARIOS_FILTERS, "filters_usuarios");
};

// 6. Para Tipo Peças
export interface TiposPecasFilters {
  [key: string]: string;
  descricao: string;
  id_tipo_peca: string;
  incluir_inativos: string;
}

const INITIAL_TIPOS_PECAS_FILTERS: TiposPecasFilters = {
  descricao: "",
  id_tipo_peca: "",
  incluir_inativos: "",
};

export const useTiposPecasFilters = () => {
  return useFilters(INITIAL_TIPOS_PECAS_FILTERS, "filters_tipos_pecas");
};

// 7. Para Usuários Regiões - Simplificado para filtrar apenas por região
export interface UsuariosRegioesFilters {
  [key: string]: string;
  nome_regiao: string;
  incluir_inativos: string;
}

const INITIAL_USUARIOS_REGIOES_FILTERS: UsuariosRegioesFilters = {
  nome_regiao: "",
  incluir_inativos: "",
};

export const useUsuariosRegioesFilters = () => {
  return useFilters(
    INITIAL_USUARIOS_REGIOES_FILTERS,
    "filters_tecnicos_regioes"
  );
};
