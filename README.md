# OnJob Assistência Técnica

Aplicação web para gerenciamento de ordens de serviço de assistência técnica, desenvolvida com Next.js 15 e TypeScript.

![Logo OnJob](public/images/logo.png)

## Visão Geral

O sistema OnJob Assistência Técnica é uma plataforma completa para gerenciamento de ordens de serviço, clientes, técnicos e empresas. O projeto é dividido em dois módulos principais:

- **Administrativo**: Gerenciamento de ordens de serviço, clientes, usuários, relatórios e configurações
- **Técnico**: Interface mobile-first para técnicos em campo registrarem ocorrências, FATs e andamento dos serviços

## Tecnologias

- Next.js 15.4.6 com App Router
- React 19.1.0
- TypeScript 5
- TailwindCSS 4
- JWT Authentication
- Framer Motion

## Funcionalidades Principais

- Login e autenticação com JWT
- Dashboard personalizado para administradores e técnicos
- Gestão de ordens de serviço (criação, edição, consulta)
- Controle de ocorrências e FATs
- Gerenciamento de clientes, máquinas e peças
- Relatórios e análises

## Requisitos

- Node.js 20 ou superior
- NPM 10 ou superior

## Instalação

Clone o repositório:

```bash
git clone https://github.com/BCaceress/OnJob-Assistencia-Tecnica.git
cd OnJob-Assistencia-Tecnica
```

Instale as dependências:

```bash
npm install
```

## Execução

Para iniciar o servidor de desenvolvimento com Turbopack:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Produção

Para construir o aplicativo para produção:

```bash
npm run build
```

Para iniciar o servidor em modo produção:

```bash
npm run start
```

## Estrutura do Projeto

- `/src/api` - Serviços e comunicação com API
- `/src/app` - Rotas e páginas da aplicação (App Router)
- `/src/components` - Componentes React reutilizáveis
- `/src/context` - Contextos React para estado global
- `/src/hooks` - Custom hooks da aplicação
- `/src/types` - Definições de tipos TypeScript
- `/src/utils` - Funções utilitárias

## Versão

Versão atual: 0.20251009.1

## Licença

Propriedade - Colet Sitemas - Bruno Caceres
