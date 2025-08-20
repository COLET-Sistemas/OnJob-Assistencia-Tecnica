export function criptografarSenha(senha: string): string {
  if (!senha) return "";

  const key = 123;
  const hexResult = [];
  let result = "";

  hexResult.push((key >> 4).toString(16).toUpperCase());
  hexResult.push((key & 0xf).toString(16).toUpperCase());
  result += hexResult.join("");

  for (let i = 0; i < senha.length; i++) {
    const converted = senha.charCodeAt(i) ^ key;
    hexResult[0] = (converted >> 4).toString(16).toUpperCase();
    hexResult[1] = (converted & 0xf).toString(16).toUpperCase();
    result += hexResult.join("");
  }

  return result;
}
