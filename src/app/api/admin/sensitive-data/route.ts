import { NextRequest } from "next/server";
import { withAuth } from "@/utils/authUtils";

/**
 * API de exemplo que requer autenticação e perfil de administrador
 * Esta API retorna dados sensíveis que só devem ser acessíveis a administradores
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

  // Como usamos withAuth, já sabemos que o usuário está autenticado e é administrador
  // O middleware já verificou o token JWT

  // Dados sensíveis que só administradores devem ver
  const sensitiveData = {
    dashboardStats: {
      totalUsers: 150,
      newUsersThisMonth: 15,
      activeTechnicians: 35,
      pendingApprovals: 8,
    },
    financialData: {
      monthlyRevenue: 254300.75,
      pendingPayments: 45750.25,
      totalExpenses: 198450.3,
      profit: 55850.45,
    },
    systemHealth: {
      serverUptime: "99.98%",
      databaseSize: "12.5 GB",
      lastBackup: "2025-10-06T23:45:00Z",
      activeConnections: 278,
    },
  };

  return new Response(JSON.stringify(sensitiveData), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

// Exportamos a função handler protegida pelo withAuth
// Exigimos que o usuário seja administrador para acessar
export const GET = withAuth(handler, { admin: true });
