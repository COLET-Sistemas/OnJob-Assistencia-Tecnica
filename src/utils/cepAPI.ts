interface ViaCEPResponse {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento: string;
  erro?: boolean;
}

export interface CEPData {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento: string;
  erro?: boolean;
}

interface CEPAPIConfig {
  name: string;
  url: string;
  transform: (data: unknown) => CEPData;
}


export async function buscarCEP(cep: string): Promise<CEPData | null> {
  if (!cep) return null;

  // Remove caracteres não numéricos
  const cepNumerico = cep.replace(/\D/g, "");

  if (cepNumerico.length !== 8) return null;
  const apis: CEPAPIConfig[] = [
    {
      name: "ViaCEP",
      url: `https://viacep.com.br/ws/${cepNumerico}/json/`,
      transform: (data: unknown): CEPData => {
        const response = data as ViaCEPResponse;
        return {
          logradouro: response.logradouro || "",
          bairro: response.bairro || "",
          localidade: response.localidade || "",
          uf: response.uf || "",
          complemento: response.complemento || "",
          erro: response.erro,
        };
      },
    },
  ];

  let ultimoErro: Error | null = null;

  // Tenta cada API sequencialmente
  for (const api of apis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos de timeout

      const response = await fetch(api.url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        mode: "cors",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const transformedData = api.transform(data);

      // Verifica se a API retornou erro ou dados vazios
      if (
        transformedData.erro ||
        (!transformedData.logradouro && !transformedData.localidade)
      ) {
        throw new Error(`CEP não encontrado na API ${api.name}`);
      }
      return transformedData;
    } catch (error) {
      console.warn(`Falha ao buscar CEP via ${api.name}:`, error);
      ultimoErro = error as Error;
      continue; // Tenta a próxima API
    }
  }

  // Se chegou até aqui, todas as APIs falharam
  console.error("Todas as APIs de CEP falharam:", ultimoErro);
  throw new Error(
    `Não foi possível buscar o CEP ${cep} em nenhuma das APIs disponíveis.`
  );
}

/**
 * Valida se um CEP tem o formato correto
 * @param cep CEP para validar
 * @returns true se o CEP é válido
 */
export function validarCEP(cep: string): boolean {
  if (!cep) return false;

  const cepNumerico = cep.replace(/\D/g, "");
  return cepNumerico.length === 8;
}

/**
 * Formata um CEP para o padrão brasileiro (00000-000)
 * @param cep CEP para formatar
 * @returns CEP formatado
 */
export function formatarCEP(cep: string): string {
  // Remove caracteres não numéricos
  cep = cep.replace(/\D/g, "");

  // Adiciona a formatação
  if (cep.length > 5) {
    cep = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`;
  }

  return cep;
}
