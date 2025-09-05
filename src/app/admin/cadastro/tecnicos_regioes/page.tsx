"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList } from "@/components/admin/common";
import { useDataFetch } from "@/hooks";
import { useCallback } from "react";
import { usuariosRegioesAPI } from "@/api/api";
import { MapPin } from "lucide-react";
import PageHeaderBasic from "@/components/admin/ui/PageHeaderBasic";
import { VincularButton } from "@/components/admin/ui/VincularButton";
import { useRouter } from "next/navigation";

interface UsuarioComRegioes {
  id_usuario: number;
  nome_usuario: string;
  regioes: {
    id_regiao: number;
    nome_regiao: string;
    data_cadastro: string;
  }[];
}

const CadastroUsuariosRegioes = () => {
  const router = useRouter();
  const fetchUsuariosRegioes = useCallback(async () => {
    return await usuariosRegioesAPI.getAll();
  }, []);

  const { data: usuariosRegioes, loading } = useDataFetch<UsuarioComRegioes[]>(
    fetchUsuariosRegioes,
    [fetchUsuariosRegioes]
  );

  if (loading) {
    return (
      <Loading
        fullScreen={true}
        preventScroll={false}
        text="Carregando técnicos x regiões..."
        size="large"
      />
    );
  }

  const columns = [
    {
      header: "Usuário",
      accessor: "nome_usuario" as keyof UsuarioComRegioes,
      render: (usuario: UsuarioComRegioes) => (
        <div className="text-sm font-semibold text-gray-900">
          {usuario.nome_usuario}
        </div>
      ),
    },
    {
      header: "Regiões",
      accessor: "regioes" as keyof UsuarioComRegioes,
      render: (usuario: UsuarioComRegioes) => (
        <div className="flex flex-wrap gap-2">
          {usuario.regioes.map((regiao) => (
            <span
              key={`${usuario.id_usuario}-${regiao.id_regiao}`}
              className="inline-flex items-center px-3 py-1 rounded-lg text-sm bg-yellow-100 text-black border border-yellow-300 shadow-sm"
            >
              <MapPin size={16} className="mr-1.5 text-yellow-600" />
              <strong className="text-gray-900">{regiao.nome_regiao}</strong>
            </span>
          ))}
        </div>
      ),
    },
  ];

  const handleVincular = (idUsuario: number) => {
    // Navegação para a página de vinculação usando o router do Next.js
    router.push(`/admin/cadastro/tecnicos_regioes/vincular/${idUsuario}`);
  };

  const renderActions = (usuario: UsuarioComRegioes) => (
    <div className="flex gap-2">
      <VincularButton onClick={() => handleVincular(usuario.id_usuario)} />
    </div>
  );

  // Sort by user name (case insensitive)
  const usuariosRegioesOrdenados = (usuariosRegioes ?? [])
    .slice()
    .sort((a, b) =>
      a.nome_usuario.localeCompare(b.nome_usuario, "pt-BR", {
        sensitivity: "base",
      })
    );

  const itemCount = usuariosRegioesOrdenados.length;

  return (
    <>
      <PageHeaderBasic
        title="Lista de Técnicos X Regiões"
        config={{
          type: "list",
          itemCount: itemCount,
        }}
      />
      <TableList
        title="Lista de Técnicos X Regiões"
        items={usuariosRegioesOrdenados}
        keyField="id_usuario"
        columns={columns}
        renderActions={renderActions}
      />
    </>
  );
};

export default CadastroUsuariosRegioes;
