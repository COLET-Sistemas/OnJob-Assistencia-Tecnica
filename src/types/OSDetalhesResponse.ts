// OS response structure from the API
export interface OSDetalhesResponse {
  id_os: number;
  descricao_problema: string;
  em_garantia: boolean;
  abertura: {
    data_abertura: string;
    forma_abertura: string;
    origem_abertura: string;
    id_usuario: number;
    nome_usuario: string;
    id_motivo_atendimento: number;
    motivo_atendimento: string;
  };
  data_agendada: string;
  data_fechamento: string;
  cliente: {
    id: number;
    nome: string;
    endereco: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
    latitude: string;
    longitude: string;
  };
  contato: {
    id: number;
    nome: string;
    telefone: string;
    whatsapp: string;
    email: string;
  };
  maquina: {
    id: number;
    numero_serie: string;
    descricao: string;
    modelo: string;
  };
  situacao_os: {
    codigo: number;
    descricao: string;
    id_motivo_pendencia: number;
    motivo_pendencia: string;
  };
  tecnico: {
    id: number;
    nome: string;
    tipo: "interno" | "terceiro" | string;
    observacoes: string;
  };
  liberacao_financeira: {
    liberada: boolean;
    id_usuario_liberacao: number;
    nome_usuario_liberacao: string;
    data_liberacao: string;
  };
  revisao_os: {
    id_usuario: number;
    nome: string;
    data: string;
    observacoes: string;
  };
  pecas_corrigidas: Array<{
    id: number;
    nome: string;
    quantidade: number;
  }>;
  deslocamentos_corrigidos: Array<{
    id: number;
    data: string;
    valor: number;
    observacoes: string;
  }>;
  fats: Array<{
    id: number;
    data: string;
    tecnico: {
      id: number;
      nome: string;
    };
    observacoes: string;
    pecas: Array<{
      id: number;
      nome: string;
      quantidade: number;
    }>;
  }>;
}
