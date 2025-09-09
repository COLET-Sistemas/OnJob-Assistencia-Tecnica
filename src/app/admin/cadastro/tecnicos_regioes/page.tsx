"use client";
import { Loading } from "@/components/LoadingPersonalizado";
import { TableList } from "@/components/admin/common";
import { useDataFetch } from "@/hooks";
import { useCallback } from "react";
import { usuariosRegioesService } from "@/api/services/usuariosService";
import { MapPin } from "lucide-react";
import PageHeaderBasic from "@/components/admin/ui/PageHeaderBasic";
import { VincularButton } from "@/components/admin/ui/VincularButton";
import { useRouter } from "next/navigation";

interface UsuarioComRegioes {
  id_usuario: number;
  nome_usuario: string;
  tipo: string;
  regioes: {
    id_regiao: number;
    nome_regiao: string;
  }[];
}

const CadastroUsuariosRegioes = () => {
  const router = useRouter();

  // Local type for the API row which may contain legacy fields plus optional 'tipo'
  type UsuarioRegiaoRow = {
    id_usuario: number;
    nome_usuario?: string;
    id_regiao: number | number[];
    nome_regiao?: string | string[];
    data_cadastro?: string;
    tipo?: string;
  };

  const fetchUsuariosRegioes = useCallback(async () => {
    // The API returns a flattened list of user-region rows (UsuarioRegiao[]).
    // We need to group by user and produce UsuarioComRegioes[] for the table.
    const rows = await usuariosRegioesService.getAll();

    const map = new Map<number, UsuarioComRegioes>();

    (rows as UsuarioRegiaoRow[]).forEach((row) => {
      const id = row.id_usuario;
      const nome = row.nome_usuario || "";
      // 'tipo' might not be present in the legacy typed interface; read from the row type
      const tipo = row.tipo ?? "";

      if (!map.has(id)) {
        map.set(id, {
          id_usuario: id,
          nome_usuario: nome,
          tipo: tipo,
          regioes: [],
        });
      }

      const entry = map.get(id)!;

      // id_regiao can be number or number[] according to legacy typing
      if (Array.isArray(row.id_regiao)) {
        // If names also come as array, try to align them by index
        const nomes = Array.isArray(row.nome_regiao)
          ? (row.nome_regiao as string[])
          : [];
        (row.id_regiao as number[]).forEach((rid, idx) => {
          entry.regioes.push({
            id_regiao: rid,
            nome_regiao: nomes[idx] ?? `Região ${rid}`,
          });
        });
      } else if (typeof row.id_regiao === "number") {
        const nomeCampo = Array.isArray(row.nome_regiao)
          ? (row.nome_regiao as string[])[0]
          : (row.nome_regiao as string | undefined);

        entry.regioes.push({
          id_regiao: row.id_regiao as number,
          nome_regiao: nomeCampo ?? `Região ${row.id_regiao}`,
        });
      }
    });

    return Array.from(map.values());
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
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-gray-900">
            {usuario.nome_usuario}
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              usuario.tipo === "interno"
                ? "bg-blue-50 text-blue-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {usuario.tipo === "interno" ? "Interno" : "Terceiro"}
          </span>
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
    router.push(`/admin/cadastro/tecnicos_regioes/vincular/${idUsuario}`);
  };

  const renderActions = (usuario: UsuarioComRegioes) => (
    <div className="flex gap-2">
      <VincularButton onClick={() => handleVincular(usuario.id_usuario)} />
    </div>
  );

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
