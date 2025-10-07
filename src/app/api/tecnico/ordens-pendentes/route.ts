import { NextRequest } from "next/server";
import { withAuth } from "@/utils/authUtils";

/**
 * API de exemplo que requer autenticação e perfil de técnico
 * Esta API retorna dados específicos para técnicos
 */
async function handler(request: NextRequest) {
  if (request.method !== "GET") {
    return new Response(
      JSON.stringify({
        error: "Método não permitido",
        message: "Esta API aceita apenas requisições GET",
      }),
      {
        status: 405,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }

  // O middleware já verificou o token JWT e withAuth garantiu que o usuário é um técnico

  // Dados para técnicos
  const tecnicoData = {
    ordens_servico_pendentes: [
      {
        id: 10045,
        cliente: "ABC Comércio Ltda",
        prioridade: "Alta",
        tipo: "Manutenção Corretiva",
      },
      {
        id: 10046,
        cliente: "Mercado Central",
        prioridade: "Média",
        tipo: "Instalação",
      },
      {
        id: 10047,
        cliente: "Padaria Bom Pão",
        prioridade: "Baixa",
        tipo: "Revisão Preventiva",
      },
    ],
    maquinas_designadas: [
      { id: "M-2301", modelo: "Colet-5000", cliente: "ABC Comércio Ltda" },
      { id: "M-2302", modelo: "Colet-3000", cliente: "Mercado Central" },
      { id: "M-2303", modelo: "Colet-7000", cliente: "Padaria Bom Pão" },
    ],
    pecas_em_estoque: [
      { id: "P-5567", nome: "Placa Controladora", quantidade: 5 },
      { id: "P-5568", nome: "Sensor de Temperatura", quantidade: 12 },
      { id: "P-5569", nome: "Kit de Reparo", quantidade: 3 },
    ],
  };

  return new Response(JSON.stringify(tecnicoData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Exportamos a função handler protegida pelo withAuth
// Exigimos que o usuário seja um técnico para acessar
export const GET = withAuth(handler, { tecnico: true });
