# Documentação de Segurança - Middleware de Autenticação

## Visão Geral

Este documento descreve o sistema de segurança implementado no middleware de autenticação para a aplicação Colet Assistência Técnica. O middleware é responsável por proteger tanto as rotas da interface do usuário quanto as rotas da API, garantindo que apenas usuários autenticados possam acessar recursos protegidos.

## Componentes Principais

### 1. Middleware de Autenticação (`middleware.ts`)

O middleware intercepta todas as requisições para rotas protegidas e verifica a presença e validade do token JWT antes de permitir o acesso. Principais recursos:

- Verifica automaticamente rotas protegidas (`/admin/*`, `/tecnico/*`, `/api/*`)
- Permite acesso a rotas públicas definidas (`/`, `/alterar-senha`, `/dashboard-panel`)
- Fornece respostas adequadas dependendo do tipo de requisição (API ou UI)
- Enriquece requisições de API com informações do usuário através de headers

### 2. Utilitários de Token JWT (`jwtUtils.ts`)

Fornece funções para validar tokens JWT:

- Verifica estrutura do token (formato de três partes)
- Verifica presença de campos obrigatórios
- Verifica expiração do token com margem de segurança
- Verifica data de emissão do token

### 3. Utilitários de Autorização (`authUtils.ts`)

Fornece funções para verificação de permissões e autorização:

- `checkPermissions`: Verifica se o usuário tem permissões necessárias
- `getUserInfoFromRequest`: Extrai informações do usuário dos headers
- `withAuth`: HOF (Higher Order Function) para proteger rotas de API

### 4. Segurança na Camada de API (`api.ts`)

O cliente API foi reforçado com:

- Gestão segura de tokens (localStorage e cookies)
- Headers de autenticação adequados
- Tratamento robusto de erros de autenticação
- Mecanismo de detecção de token inválido e logout automático

## Fluxo de Autenticação

1. O usuário faz login e recebe um token JWT
2. O token é armazenado tanto no localStorage quanto em cookie (para acesso pelo middleware)
3. Requisições subsequentes incluem o token nos headers
4. O middleware valida o token antes de permitir acesso a recursos protegidos
5. Se o token for inválido:
   - Para requisições de UI: redireciona para a página de login
   - Para requisições de API: retorna erro 401 com mensagem apropriada

## Melhorias de Segurança Implementadas

- **Verificação de Token Robusta**: Validação mais completa de tokens JWT
- **Proteção de APIs**: Todas as chamadas de API agora passam pela verificação do middleware
- **Sincronização Cookie-LocalStorage**: Garante consistência entre os dois mecanismos de armazenamento
- **Tratamento de Erros Consistente**: Respostas de erro padronizadas para problemas de autenticação
- **Verificação de Permissões Granular**: Sistema para verificar permissões específicas por rota
- **Headers de Segurança**: Configuração adequada de cookies com flags de segurança
- **Limpeza Automática de Estado**: Mecanismo para limpar o estado do cliente quando o token expira

## Boas Práticas

1. **Tokens Curtos**: Use tokens JWT com expiração curta (máximo 24 horas)
2. **Verificações de Permissão**: Sempre verifique permissões específicas nas rotas sensíveis
3. **Logout Explícito**: Limpe tokens tanto do cliente quanto do servidor durante logout
4. **HTTPS**: Use sempre HTTPS em ambientes de produção
5. **Monitoramento**: Monitore tentativas de acesso não autorizadas
