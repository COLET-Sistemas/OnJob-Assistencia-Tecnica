"use client";

import { usuariosRegioesAPI } from "@/api/api";
import { Loading } from "@/components/Loading";
import { TableList } from "@/components/admin/common";
import { useTitle } from "@/context/TitleContext";
import { useDataFetch } from "@/hooks";
import { UsuarioRegiao } from "@/types/admin/cadastro/usuarios";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, MapPin } from "lucide-react";
import { useEffect } from "react";
import { EditButton } from "@/components/admin/ui/EditButton";

// Define a type for the grouped user with regions
interface UsuarioAgrupado extends UsuarioRegiao {
  regioes: { id_regiao: number; nome_regiao: string }[];
}

function CadastroUsuarios() {
  const { setTitle } = useTitle();

  // Configurar o título da página
  useEffect(() => {
    setTitle("Usuários Regiões");
  }, [setTitle]);

  // Função para formatar a data
  const formatarData = (dataString: string) => {
    try {
      const data = parseISO(dataString);
      return format(data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      // Returning original string if date parsing fails
      return dataString;
    }
  };

  // Usar o hook customizado para carregar os dados
  const {
    data: usuariosRegioes,
    loading,
    error,
  } = useDataFetch<UsuarioRegiao[]>(() => usuariosRegioesAPI.getAll(), []);

  // Agrupa usuários por ID para evitar repetição na listagem
  const usuariosAgrupados = usuariosRegioes
    ? usuariosRegioes.reduce(
        (
          acc: {
            [key: number]: UsuarioAgrupado;
          },
          item: UsuarioRegiao
        ) => {
          if (!acc[item.id_usuario]) {
            acc[item.id_usuario] = {
              ...item,
              regioes: [
                { id_regiao: item.id_regiao, nome_regiao: item.nome_regiao },
              ],
            };
          } else {
            acc[item.id_usuario].regioes.push({
              id_regiao: item.id_regiao,
              nome_regiao: item.nome_regiao,
            });
          }
          return acc;
        },
        {}
      )
    : {};

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando usuários..."
        size="large"
      />
    );
  }

  // Definir as colunas da tabela
  const columns = [
    {
      header: "Usuário",
      accessor: "nome_usuario" as keyof UsuarioAgrupado,
      render: (usuario: UsuarioAgrupado) => (
        <div className="text-sm font-semibold text-gray-900">
          {usuario.nome_usuario}
        </div>
      ),
    },
    {
      header: "Regiões",
      accessor: "regioes" as keyof UsuarioAgrupado,
      render: (usuario: UsuarioAgrupado) => (
        <div className="flex flex-wrap gap-2">
          {usuario.regioes.map((regiao) => (
            <span
              key={`${usuario.id_usuario}-${regiao.id_regiao}`}
              className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-[var(--secondary-yellow)]/20 text-[var(--dark-navy)] border border-[var(--secondary-yellow)]/30"
            >
              <MapPin
                size={14}
                className="mr-1 text-[var(--secondary-yellow)]"
              />
              {regiao.nome_regiao}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: "Data de Cadastro",
      accessor: "data_cadastro" as keyof UsuarioAgrupado,
      render: (usuario: UsuarioAgrupado) => (
        <div className="text-sm text-[var(--neutral-graphite)] flex items-center gap-1.5">
          <Calendar size={16} className="text-[var(--primary)]" />
          {formatarData(usuario.data_cadastro)}
        </div>
      ),
    },
  ];

  // Renderizar as ações para cada item
  const renderActions = (usuario: UsuarioAgrupado) => (
    <EditButton
      id={usuario.id_usuario}
      editRoute="/admin/cadastro/usuarios/editar"
    />
  );

  // Mostrar mensagem de erro se houver algum problema
  const errorMessage = error ? (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 m-4 rounded-lg">
      <p className="flex items-center gap-2">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        Falha ao carregar dados. Verifique sua conexão e tente novamente.
      </p>
    </div>
  ) : null;

  return (
    <>
      {errorMessage}
      <TableList
        title="Lista de Usuários Regiões"
        items={Object.values(usuariosAgrupados) as UsuarioAgrupado[]}
        keyField="id_usuario"
        columns={columns}
        renderActions={renderActions}
        newItemLink="/admin/cadastro/usuarios/novo"
        newItemLabel="Novo Usuário"
      />
    </>
  );
}

export default CadastroUsuarios;
