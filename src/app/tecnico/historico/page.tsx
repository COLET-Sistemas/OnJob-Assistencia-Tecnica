"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/LoadingPersonalizado";
import MobileHeader from "@/components/tecnico/MobileHeader";
import { clientesService } from "@/api/services/clientesService";
import { maquinasService } from "@/api/services/maquinasService";
import { useLicenca } from "@/hooks";
import type { Cliente } from "@/types/admin/cadastro/clientes";
import type { Maquina } from "@/types/admin/cadastro/maquinas";
import { CircleCheck, CircleX } from "lucide-react";

const MIN_SEARCH_LENGTH = 3;

type SearchMode = "cliente" | "maquina";

export default function HistoricoPage() {
  const router = useRouter();
  const { licencaTipo, loading: licencaLoading } = useLicenca();
  const [searchMode, setSearchMode] = useState<SearchMode>("cliente");
  const [query, setQuery] = useState("");
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const historicoBloqueado =
    !licencaLoading && (licencaTipo === "P" || licencaTipo === "G");

  useEffect(() => {
    if (historicoBloqueado) {
      router.replace("/tecnico/dashboard");
    }
  }, [historicoBloqueado, router]);

  useEffect(() => {
    let isMounted = true;
    const trimmed = query.trim();

    if (licencaLoading || historicoBloqueado) {
      setLoading(false);
      setError("");
      setClientes([]);
      setMaquinas([]);
      return () => {
        isMounted = false;
      };
    }

    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setLoading(false);
      setError("");
      setClientes([]);
      setMaquinas([]);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);
    setError("");

    const handler = setTimeout(async () => {
      try {
        if (searchMode === "cliente") {
          const response = await clientesService.search(trimmed);
          if (!isMounted) return;
          setClientes(response?.dados ?? []);
        } else {
          const response = await maquinasService.searchByNumeroSerie(trimmed);
          if (!isMounted) return;
          setMaquinas(response?.dados ?? []);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Erro ao buscar historico:", err);
        setError(
          "Nao foi possivel buscar dados no momento. Tente novamente mais tarde."
        );
        if (searchMode === "cliente") {
          setClientes([]);
        } else {
          setMaquinas([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(handler);
    };
  }, [query, searchMode, licencaLoading, historicoBloqueado]);

  const results = searchMode === "cliente" ? clientes : maquinas;
  const hasSearched = query.trim().length >= MIN_SEARCH_LENGTH;
  const searchLabel =
    searchMode === "cliente"
      ? "Historico de clientes"
      : "Historico de maquinas";
  const placeholder =
    searchMode === "cliente"
      ? "Digite o nome do cliente (minimo 3 caracteres)"
      : "Digite o numero de serie da maquina (minimo 3 caracteres)";
  const noResultsMessage =
    hasSearched && !loading && results.length === 0
      ? searchMode === "cliente"
        ? "Nenhum cliente encontrado."
        : "Nenhuma maquina encontrada."
      : "";
  const helperMessage =
    !hasSearched && !loading && !error
      ? `Digite pelo menos ${MIN_SEARCH_LENGTH} caracteres para iniciar a busca.`
      : "";
  const feedbackMessage = error || noResultsMessage || helperMessage;

  const handleSelectCliente = (cliente: Cliente) => {
    const id = cliente.id ?? cliente.id_cliente;
    if (!id) return;
    router.push(`/tecnico/clientes_detalhes/${id}`);
  };

  const handleSelectMaquina = (maquina: Maquina) => {
    if (!maquina.id) return;
    router.push(`/tecnico/maquinas_detalhes/${maquina.id}`);
  };

  if (licencaLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <MobileHeader
          title="Historico"
          showNotifications={false}
          leftVariant="back"
          onAddClick={() => router.back()}
        />
        <div className="px-4 pb-6 pt-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <Loading text="Carregando permissoes..." fullScreen={false} />
          </div>
        </div>
      </main>
    );
  }

  if (historicoBloqueado) {
    return (
      <main className="min-h-screen bg-gray-50">
        <MobileHeader
          title="Historico"
          showNotifications={false}
          leftVariant="back"
          onAddClick={() => router.back()}
        />
        <div className="px-4 pb-6 pt-3">
          <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-6 text-sm text-amber-700 shadow-sm">
            O histórico não está disponível para o seu plano atual.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <MobileHeader
        title="Historico"
        showNotifications={false}
        leftVariant="back"
        onAddClick={() => router.back()}
      />

      <div className="px-4 pb-6 pt-3 space-y-4">
        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm border border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {searchLabel}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSearchMode("cliente");
                setQuery("");
              }}
              className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition ${
                searchMode === "cliente"
                  ? "border-[#7B54BE] bg-[#7B54BE] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#7B54BE]"
              }`}
            >
              Cliente
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchMode("maquina");
                setQuery("");
              }}
              className={`flex-1 rounded-full border px-4 py-2 text-sm font-medium transition ${
                searchMode === "maquina"
                  ? "border-[#7B54BE] bg-[#7B54BE] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-[#7B54BE]"
              }`}
            >
              Maquina
            </button>
          </div>

          <div className="relative">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#7B54BE] focus:outline-none focus:ring-1 focus:ring-[#7B54BE]"
              minLength={MIN_SEARCH_LENGTH}
              aria-label={placeholder}
            />
          </div>
        </section>

        <section className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <Loading text="Buscando resultados..." fullScreen={false} />
            </div>
          ) : feedbackMessage ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600">
              {feedbackMessage}
            </div>
          ) : (
            <div className="space-y-3">
              {searchMode === "cliente"
                ? clientes.map((cliente) => (
                    <button
                      key={
                        cliente.id ??
                        cliente.id_cliente ??
                        cliente.cnpj ??
                        cliente.nome_fantasia ??
                        "cliente-historico"
                      }
                      onClick={() => handleSelectCliente(cliente)}
                      className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-[#7B54BE] hover:bg-[#F3EFFF]"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {cliente.nome_fantasia}
                      </p>
                      {cliente.razao_social && (
                        <p className="mt-1 text-xs text-gray-600">
                          {cliente.razao_social}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-600">
                        {cliente.cidade}, {cliente.uf}
                      </p>
                    </button>
                  ))
                : maquinas.map((maquina) => (
                    <button
                      key={maquina.id}
                      onClick={() => handleSelectMaquina(maquina)}
                      className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-[#7B54BE] hover:bg-[#F3EFFF]"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">
                          {maquina.numero_serie}
                        </p>
                        <div className="flex items-center">
                          {maquina.garantia ? (
                            <CircleCheck className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                          ) : (
                            <CircleX className="w-4 h-4 flex-shrink-0 text-amber-500" />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                        {maquina.descricao}
                      </p>
                      {maquina.cliente_atual?.nome_fantasia && (
                        <p className="mt-2 text-xs text-gray-500">
                          Cliente atual: {maquina.cliente_atual.nome_fantasia}
                        </p>
                      )}
                    </button>
                  ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
