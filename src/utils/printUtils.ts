import { formatDateTime } from "./formatters";

export interface OSHistoricoItem {
  id: number;
  data_hora: string;
  usuario: {
    id: number;
    nome: string;
  };
  status_anterior: string;
  status_atual: string;
  comentario: string;
}

export interface OSData {
  id: number;
  numero_os: string;
  data_abertura: string;
  cliente?: {
    id: number;
    nome_fantasia: string;
  };
  maquina?: {
    id: number;
    numero_serie: string;
    descricao?: string;
  };
  status: string | number;
  tecnico?: {
    id: number;
    nome: string;
  };
  motivo_atendimento?: {
    id: number;
    descricao: string;
  };
  motivo_pendencia?: {
    id: number;
    descricao: string;
  };
  comentarios_pendencia?: string;
  regiao?: {
    id: number;
    nome: string;
  };
  historico?: OSHistoricoItem[];
}

export interface PrintableOS {
  numero_os: string;
  data_abertura: string;
  cliente_nome: string;
  maquina_numero: string;
  status: string;
  tecnico_nome?: string;
  motivo_atendimento: string;
  motivo_pendencia?: string;
  comentarios_pendencia?: string;
  regiao_nome: string;
  historico: Array<{
    data_hora: string;
    usuario_nome: string;
    status_anterior: string;
    status_atual: string;
    comentario: string;
  }>;
}

export function preparePrintableOS(osData: OSData): PrintableOS {
  return {
    numero_os: osData.numero_os || "",
    data_abertura: formatDateTime(osData.data_abertura) || "",
    cliente_nome: osData.cliente?.nome_fantasia || "",
    maquina_numero: osData.maquina?.numero_serie || "",
    status: translateStatus(osData.status) || "",
    tecnico_nome: osData.tecnico?.nome,
    motivo_atendimento: osData.motivo_atendimento?.descricao || "",
    motivo_pendencia: osData.motivo_pendencia?.descricao,
    comentarios_pendencia: osData.comentarios_pendencia,
    regiao_nome: osData.regiao?.nome || "",
    historico: (osData.historico || []).map((item: OSHistoricoItem) => ({
      data_hora: formatDateTime(item.data_hora) || "",
      usuario_nome: item.usuario?.nome || "",
      status_anterior: translateStatus(item.status_anterior) || "",
      status_atual: translateStatus(item.status_atual) || "",
      comentario: item.comentario || "",
    })),
  };
}

export function translateStatus(status: string | number): string {
  const statusMap: Record<string, string> = {
    // Letter-based status codes (old API)
    A: "Aberta",
    P: "Pendente",
    E: "Em Execução",
    F: "Finalizada",
    C: "Cancelada",

    // Number-based status codes (new API)
    "1": "Pendente",
    "2": "A Atender",
    "3": "Em Deslocamento",
    "4": "Em Atendimento",
    "5": "Atendimento Interrompido",
    "6": "Em Revisão",
    "7": "Concluída",
    "8": "Cancelada",
    "9": "Cancelada pelo Cliente",
  };

  // Convert to string if it's a number
  const statusKey = status.toString();

  return statusMap[statusKey] || statusKey;
}

export function printOS(osData: PrintableOS): void {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    alert("Por favor, permita pop-ups para imprimir a OS.");
    return;
  }

  const content = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ordem de Serviço ${osData.numero_os}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          line-height: 1.6;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #ddd;
          padding-bottom: 10px;
        }
        .os-info {
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-weight: bold;
          margin-bottom: 5px;
          border-bottom: 1px solid #eee;
        }
        .history-item {
          margin-bottom: 10px;
          padding: 10px;
          background-color: #f9f9f9;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 8px;
          text-align: left;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Ordem de Serviço: ${osData.numero_os}</h2>
        <p>Data de Abertura: ${osData.data_abertura}</p>
      </div>
      
      <div class="os-info">
        <table>
          <tr>
            <th>Cliente</th>
            <td>${osData.cliente_nome}</td>
          </tr>
          <tr>
            <th>Máquina</th>
            <td>${osData.maquina_numero}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>${osData.status}</td>
          </tr>
          <tr>
            <th>Técnico</th>
            <td>${osData.tecnico_nome || "Não atribuído"}</td>
          </tr>
          <tr>
            <th>Região</th>
            <td>${osData.regiao_nome}</td>
          </tr>
          <tr>
            <th>Motivo do Atendimento</th>
            <td>${osData.motivo_atendimento}</td>
          </tr>
          ${
            osData.motivo_pendencia
              ? `
          <tr>
            <th>Motivo da Pendência</th>
            <td>${osData.motivo_pendencia}</td>
          </tr>`
              : ""
          }
          ${
            osData.comentarios_pendencia
              ? `
          <tr>
            <th>Comentários da Pendência</th>
            <td>${osData.comentarios_pendencia}</td>
          </tr>`
              : ""
          }
        </table>
      </div>
      
      <div class="section">
        <div class="section-title">Histórico</div>
        ${
          osData.historico.length > 0
            ? osData.historico
                .map(
                  (item) => `
            <div class="history-item">
              <p><strong>Data:</strong> ${item.data_hora}</p>
              <p><strong>Usuário:</strong> ${item.usuario_nome}</p>
              <p><strong>Alteração de Status:</strong> ${
                item.status_anterior
              } → ${item.status_atual}</p>
              <p><strong>Comentário:</strong> ${
                item.comentario || "Nenhum comentário"
              }</p>
            </div>
          `
                )
                .join("")
            : "<p>Sem histórico disponível</p>"
        }
      </div>
      
      <div class="no-print">
        <button onclick="window.print()">Imprimir</button>
        <button onclick="window.close()">Fechar</button>
      </div>
      
      <script>
        // Imprimir automaticamente quando a página carregar
        window.onload = function() {
          setTimeout(() => window.print(), 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(content);
  printWindow.document.close();
}
