# API Structure

Esta pasta contém a estrutura otimizada para comunicação com APIs.

## Arquivos Principais

- `api.ts` - Arquivo principal que contém:

  - Configurações da API
  - Funções auxiliares para headers, tokens e consultas
  - Cliente HTTP com funções para requisições GET, POST, PUT, DELETE, PATCH
  - Tratamento de erros e sessão expirada

- `index.ts` - Exporta as funções e serviços para o resto da aplicação

- `services/` - Contém os serviços específicos para cada entidade do sistema
  - Cada serviço implementa operações CRUD e funcionalidades específicas
  - Todos os serviços utilizam o cliente HTTP centralizado

## Como Usar

```typescript
// Importar o cliente API para uso direto
import api from "@/api";

// Ou importar serviços específicos
import { services } from "@/api";
const { clientesService, usuariosService } = services;

// Exemplo de uso
const data = await clientesService.getAll();
```

## Benefícios da Estrutura Otimizada

1. **Centralização** - Lógica HTTP e configuração em um único arquivo
2. **Consistência** - Tratamento de erros padronizado para todas as requisições
3. **Manutenibilidade** - Serviços específicos separados para facilitar manutenção
4. **Tipagem** - TypeScript para garantir segurança de tipos nas requisições
