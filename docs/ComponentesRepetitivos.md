# Componentes Repetitivos - Documentação

Este documento descreve os componentes repetitivos que foram extraídos para melhorar a manutenção e consistência do código no projeto Colet Assistência Técnica.

## Componentes Extraídos

### 1. ActionButton

Um componente para botões de ação consistentes em toda a aplicação, com suporte para diferentes variantes e estilos.

```tsx
import { ActionButton } from '@/components/admin/common';

<ActionButton
  href="/admin/cadastro/item/editar/1"  // Opcional: se fornecido, renderiza como Link
  onClick={() => handleClick()}         // Opcional: manipulador de eventos, caso não use href
  icon={<Edit2 size={14} />}           // Ícone a ser exibido
  label="Editar"                       // Texto do botão
  variant="primary"                    // 'primary', 'secondary' ou 'outline'
/>
```

### 2. PageHeader

Um componente para cabeçalhos de página padronizados, com suporte para título, contagem de itens e botão de ação.

```tsx
import { PageHeader } from '@/components/admin/common';

<PageHeader
  title="Lista de Itens"              // Título da página
  itemCount={items.length}            // Número de itens a mostrar no contador
  newButtonLink="/admin/novo-item"    // Link para o botão "Novo" (opcional)
  newButtonLabel="Novo Item"          // Texto do botão "Novo" (opcional)
  onNewButtonClick={handleNew}        // Alternativa a newButtonLink (opcional)
  actions={<CustomActions />}         // Componente personalizado para ações adicionais (opcional)
/>
```

### 3. TableStatusColumn

Um componente para exibir badges de status consistentes.

```tsx
import { TableStatusColumn } from '@/components/admin/common';

<TableStatusColumn 
  status="A"                          // Status a ser exibido ('A', 'I', etc.)
  mapping={{                          // Mapeamento personalizado (opcional)
    'A': { 
      label: 'Ativo', 
      className: 'bg-green-100 text-green-800'
    },
    'I': { 
      label: 'Inativo', 
      className: 'bg-red-100 text-red-800' 
    }
  }}
/>
```

### 4. TableList

Um componente de alto nível que combina vários outros componentes para criar uma tabela com cabeçalho, filtros e ações.

```tsx
import { TableList } from '@/components/admin/common';

<TableList
  title="Lista de Itens"              // Título para o cabeçalho
  items={data}                        // Dados da tabela
  keyField="id"                       // Campo único para key
  columns={columns}                   // Definição das colunas
  newItemLink="/admin/novo"           // Link para o botão "Novo"
  newItemLabel="Novo Item"            // Texto do botão "Novo"
  renderActions={(item) => (          // Renderiza ações para cada linha (opcional)
    <ActionButton 
      href={`/editar/${item.id}`} 
      icon={<Edit2 />} 
      label="Editar" 
    />
  )}
/>
```

### 5. useDataFetch (Hook)

Um hook personalizado para gerenciar o carregamento de dados, estados de loading e erros.

```tsx
import { useDataFetch } from '@/hooks';

const { 
  data,                              // Dados carregados
  loading,                           // Estado de carregamento
  error,                             // Erro, se houver
  refetch                            // Função para recarregar os dados
} = useDataFetch(
  () => api.getItems(),              // Função para buscar dados
  [dependencyValue],                 // Dependências que disparam nova busca
  initialData                        // Dados iniciais (opcional)
);
```

## Como Utilizar Estes Componentes

Veja o exemplo completo em `src/examples/RefactoredMotivosAtendimentoPage.tsx`, que mostra como reescrever uma página utilizando estes componentes reutilizáveis. Essa abordagem:

1. Reduz a duplicação de código
2. Melhora a consistência visual
3. Facilita mudanças em toda a aplicação
4. Torna o código mais legível e mais fácil de manter

## Próximos Passos

Para implementar estes componentes em todo o projeto:

1. Identifique as páginas com padrões repetitivos (especialmente páginas CRUD)
2. Refatore uma página de cada vez, testando cuidadosamente
3. Adicione novos componentes reutilizáveis conforme necessário
4. Mantenha a documentação atualizada
