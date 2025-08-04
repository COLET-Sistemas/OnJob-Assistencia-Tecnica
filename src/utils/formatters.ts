/**
 * Formata um CPF adicionando pontuação (XXX.XXX.XXX-XX)
 * @param cpf String contendo o CPF (somente números)
 * @returns CPF formatado ou string vazia se inválido
 */
export function formatCPF(cpf: string): string {
    if (!cpf) return '';

    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');

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
    if (!cnpj) return '';

    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) return cnpj;

    // Formato CNPJ: XX.XXX.XXX/XXXX-XX
    return cleanCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

/**
 * Identifica e formata corretamente um documento como CPF ou CNPJ baseado na quantidade de dígitos
 * @param documento String contendo o documento (CPF ou CNPJ)
 * @returns Documento formatado de acordo com seu tipo (CPF ou CNPJ)
 */
export function formatDocumento(documento: string): string {
    if (!documento) return '';

    // Remove caracteres não numéricos
    const cleanDoc = documento.replace(/\D/g, '');

    // Verifica se é CPF (11 dígitos) ou CNPJ (14 dígitos)
    if (cleanDoc.length === 11) {
        return formatCPF(cleanDoc);
    } else if (cleanDoc.length === 14) {
        return formatCNPJ(cleanDoc);
    }

    // Se não for nenhum dos dois formatos, retorna o documento original
    return documento;
}
