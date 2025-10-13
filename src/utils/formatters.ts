/**
 * Formata um CPF adicionando pontuação (XXX.XXX.XXX-XX)
 * @param cpf String contendo o CPF (somente números)
 * @returns CPF formatado ou string vazia se inválido
 */
export function formatCPF(cpf: string): string {
  if (!cpf) return "";

  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, "");

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return cpf;

  // Formato CPF: XXX.XXX.XXX-XX
  return cleanCPF.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

/**
 * Formata um CNPJ adicionando pontuação (XX.XXX.XXX/XXXX-XX)
 * @param cnpj String contendo o CNPJ (somente números)
 * @returns CNPJ formatado ou string vazia se inválido
 */
export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return "";

  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return cnpj;

  // Formato CNPJ: XX.XXX.XXX/XXXX-XX
  return cleanCNPJ.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Identifica e formata corretamente um documento como CPF ou CNPJ baseado na quantidade de dígitos
 * @param documento String contendo o documento (CPF ou CNPJ)
 * @returns Documento formatado de acordo com seu tipo (CPF ou CNPJ)
 */
export function formatDocumento(documento: string): string {
  if (!documento) return "";

  // Remove caracteres não numéricos
  const cleanDoc = documento.replace(/\D/g, "");

  // Verifica se é CPF (11 dígitos) ou CNPJ (14 dígitos)
  if (cleanDoc.length === 11) {
    return formatCPF(cleanDoc);
  } else if (cleanDoc.length === 14) {
    return formatCNPJ(cleanDoc);
  }

  // Se não for nenhum dos dois formatos, retorna o documento original
  return documento;
}

/**
 * Valida um CPF verificando se os dígitos verificadores estão corretos
 * @param cpf String contendo o CPF
 * @returns true se o CPF é válido, false caso contrário
 */
export function validarCPF(cpf: string): boolean {
  if (!cpf) return false;

  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, "");

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  // Validação do primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  const digito1 = resto < 2 ? 0 : resto;

  if (digito1 !== parseInt(cleanCPF.charAt(9))) return false;

  // Validação do segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  const digito2 = resto < 2 ? 0 : resto;

  return digito2 === parseInt(cleanCPF.charAt(10));
}

/**
 * Valida um CNPJ verificando se os dígitos verificadores estão corretos
 * @param cnpj String contendo o CNPJ
 * @returns true se o CNPJ é válido, false caso contrário
 */
export function validarCNPJ(cnpj: string): boolean {
  if (!cnpj) return false;

  // Remove caracteres não numéricos
  const cleanCNPJ = cnpj.replace(/\D/g, "");

  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) return false;

  // Verifica se todos os dígitos são iguais (CNPJ inválido)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  // Validação do primeiro dígito verificador
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(cleanCNPJ.charAt(i)) * pesos1[i];
  }
  let resto = soma % 11;
  const digito1 = resto < 2 ? 0 : 11 - resto;

  if (digito1 !== parseInt(cleanCNPJ.charAt(12))) return false;

  // Validação do segundo dígito verificador
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  soma = 0;
  for (let i = 0; i < 13; i++) {
    soma += parseInt(cleanCNPJ.charAt(i)) * pesos2[i];
  }
  resto = soma % 11;
  const digito2 = resto < 2 ? 0 : 11 - resto;

  return digito2 === parseInt(cleanCNPJ.charAt(13));
}

/**
 * Valida um documento verificando se é um CPF ou CNPJ válido
 * @param documento String contendo o documento (CPF ou CNPJ)
 * @returns true se o documento é válido, false caso contrário
 */
export function validarDocumento(documento: string): boolean {
  if (!documento) return false;

  // Remove caracteres não numéricos
  const cleanDoc = documento.replace(/\D/g, "");

  // Verifica se é CPF (11 dígitos) ou CNPJ (14 dígitos)
  if (cleanDoc.length === 11) {
    return validarCPF(documento);
  } else if (cleanDoc.length === 14) {
    return validarCNPJ(documento);
  }

  // Se não for nenhum dos dois formatos, é inválido
  return false;
}

/**
 * Formata uma data/hora ISO para o formato DD/MM/YYYY HH:MM
 * @param dateString String contendo a data em formato ISO
 * @returns Data formatada ou string vazia se inválida
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) return dateString;

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
}

/**
 * Formata uma data ISO para o formato DD/MM/YYYY HH:MM
 * @param dataISO String contendo a data em formato ISO
 * @returns Data formatada ou string vazia se inválida
 */
export function formatarData(dataISO: string): string {
  if (!dataISO) return "-";

  try {
    const data = new Date(dataISO);
    if (isNaN(data.getTime())) return "-";

    const dia = data.getDate().toString().padStart(2, "0");
    const mes = (data.getMonth() + 1).toString().padStart(2, "0");
    const ano = data.getFullYear();
    const hora = data.getHours().toString().padStart(2, "0");
    const minuto = data.getMinutes().toString().padStart(2, "0");

    return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
  } catch {
    return "-";
  }
}

/**
 * Formata uma data/hora para exibição, retornando um objeto com data formatada e hora
 * @param dataHora String contendo a data/hora em formato ISO ou outro formato
 * @returns Objeto com data formatada (dd/mm/yyyy hh:mm) e hora (hh:mm) ou undefined se inválido
 */
export function formatarDataHora(
  dataHora: string
): { data: string; hora: string } | undefined {
  if (!dataHora) return undefined;

  // Formato ISO com T (como 2025-07-28T19:07:16)
  if (dataHora.includes("T")) {
    try {
      const data = new Date(dataHora);
      if (isNaN(data.getTime())) return undefined;

      const dia = data.getDate().toString().padStart(2, "0");
      const mes = (data.getMonth() + 1).toString().padStart(2, "0");
      const ano = data.getFullYear();
      const hora = data.getHours().toString().padStart(2, "0");
      const minuto = data.getMinutes().toString().padStart(2, "0");

      const dataFormatada = `${dia}/${mes}/${ano}`;
      const horaFormatada = `${hora}:${minuto}`;
      return { data: `${dataFormatada} ${horaFormatada}`, hora: horaFormatada };
    } catch {
      return undefined;
    }
  }
  // Verifica se a data já está no formato dd/mm/yyyy
  else if (dataHora.includes("/")) {
    const [data, hora] = dataHora.split(" ");
    // Não precisamos separar dia/mes/ano, já está formatado
    const [h, m] = hora ? hora.split(":") : ["", ""];
    const dataFormatada = data;
    const horaFormatada = h && m ? `${h}:${m}` : "";
    return {
      data: hora ? `${dataFormatada} ${horaFormatada}` : dataFormatada,
      hora: horaFormatada,
    };
  }
  // Formato ISO yyyy-mm-dd
  else {
    const [data, hora] = dataHora.split(" ");
    const [ano, mes, dia] = data.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;
    const [h, m] = hora ? hora.split(":") : ["", ""];
    const horaFormatada = h && m ? `${h}:${m}` : "";
    return {
      data: hora ? `${dataFormatada} ${horaFormatada}` : dataFormatada,
      hora: horaFormatada,
    };
  }
}

/**
 * Verifica se uma data agendada já passou
 * @param dataAgendada String contendo a data agendada
 * @returns true se a data já passou, false caso contrário ou se a data for inválida
 */
export function isDataAgendadaPassada(dataAgendada: string): boolean {
  if (!dataAgendada) return false;

  try {
    let dataComparacao;
    if (dataAgendada.includes("/")) {
      // Formato dd/mm/yyyy
      const [data] = dataAgendada.split(" ");
      const [dia, mes, ano] = data.split("/");
      dataComparacao = new Date(
        parseInt(ano),
        parseInt(mes) - 1,
        parseInt(dia)
      );
    } else if (dataAgendada.includes("T")) {
      // Formato ISO com T (2025-07-28T19:07:16)
      dataComparacao = new Date(dataAgendada);
    } else {
      // Formato ISO yyyy-mm-dd
      const [data] = dataAgendada.split(" ");
      dataComparacao = new Date(data);
    }

    if (isNaN(dataComparacao.getTime())) return false;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    return dataComparacao < hoje;
  } catch {
    return false;
  }
}

/**
 * Formata uma data para exibição relativa (ex: "Há 5 minutos", "Hoje às 14:30", "Ontem às 10:15")
 * @param date Data a ser formatada
 * @returns String com a data relativa formatada
 */
export function formatRelativeDate(date: Date): string {
  if (!date || isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // Formato da hora
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const formattedTime = `${hours}:${minutes}`;

  // Menos de 1 minuto
  if (diffSeconds < 60) {
    return "Agora mesmo";
  }

  // Menos de 1 hora
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? `Há 1 minuto` : `Há ${diffMinutes} minutos`;
  }

  // Menos de 24 horas
  if (diffHours < 24) {
    if (date.getDate() === now.getDate()) {
      return `Hoje às ${formattedTime}`;
    } else {
      return `Ontem às ${formattedTime}`;
    }
  }

  // Menos de 7 dias
  if (diffDays < 7) {
    return `Há ${diffDays} ${diffDays === 1 ? "dia" : "dias"}`;
  }

  // Mais de 7 dias
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  // Se for o mesmo ano, não exibe o ano
  if (year === now.getFullYear()) {
    return `${day}/${month} às ${formattedTime}`;
  }

  // Caso contrário, exibe a data completa
  return `${day}/${month}/${year} às ${formattedTime}`;
}
