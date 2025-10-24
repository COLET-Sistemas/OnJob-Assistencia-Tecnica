"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useParams } from "next/navigation";
import MobileHeader from "@/components/tecnico/MobileHeader";
import { fatService, type FATDetalhada } from "@/api/services/fatService";
import {
  fatFotosService,
  type FATFotoItem,
} from "@/api/services/fatFotosService";
import {
  Camera,
  RefreshCcw,
  UploadCloud,
  ImageOff,
  X,
} from "lucide-react";

const formatDateTime = (value?: string) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const Spinner = () => (
  <div className="flex items-center justify-center py-10">
    <div className="w-6 h-6 border-2 border-slate-200 border-t-[#7B54BE] rounded-full animate-spin" />
  </div>
);

export default function FATFotosPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [fat, setFat] = useState<FATDetalhada | null>(null);
  const [idOs, setIdOs] = useState<number | null>(null);
  const [photos, setPhotos] = useState<FATFotoItem[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<Record<number, string>>(
    {}
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingPreviews, setLoadingPreviews] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<FATFotoItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<Map<number, string>>(new Map());

  const fatIdFromRoute = useMemo(
    () => (params?.id ? Number(params.id) : null),
    [params?.id]
  );

  const resolvedFatId = useMemo(() => {
    if (fatIdFromRoute !== null && !Number.isNaN(fatIdFromRoute)) {
      return fatIdFromRoute;
    }
    if (fat?.id_fat !== undefined && fat?.id_fat !== null) {
      return fat.id_fat;
    }
    return null;
  }, [fat?.id_fat, fatIdFromRoute]);

  const descricaoValida = useMemo(
    () => descricao.trim().length > 0,
    [descricao]
  );

  useEffect(() => {
    const urlsMap = objectUrlsRef.current;
    return () => {
      urlsMap.forEach((url) => URL.revokeObjectURL(url));
      urlsMap.clear();
    };
  }, []);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => setSuccessMessage(null), 3500);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    if (!pendingPreview) return;
    return () => {
      URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const loadPreviews = useCallback(async (items: FATFotoItem[]) => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();

    if (!items.length) {
      setPhotoPreviews({});
      return;
    }

    const settled = await Promise.allSettled(
      items.map(async (item) => {
        const blob = await fatFotosService.visualizar(item.id_fat_foto);
        const url = URL.createObjectURL(blob);
        return [item.id_fat_foto, url] as const;
      })
    );

    const previews: Record<number, string> = {};
    settled.forEach((result) => {
      if (result.status === "fulfilled") {
        const [id_fat_foto, url] = result.value;
        objectUrlsRef.current.set(id_fat_foto, url);
        previews[id_fat_foto] = url;
      }
    });

    setPhotoPreviews(previews);
  }, []);

  const fetchPhotos = useCallback(
    async (targetIdOs?: number) => {
      const effectiveIdOs = targetIdOs ?? idOs;
      if (!effectiveIdOs) return;

      setLoadingPhotos(true);
      setError(null);
      try {
        const data = await fatFotosService.listar(effectiveIdOs);
        setPhotos(data);
        setLoadingPreviews(true);
        await loadPreviews(data);
      } catch (err) {
        console.error(err);
        setPhotos([]);
        setPhotoPreviews({});
        setError("Não foi possível carregar as fotos. Tente novamente.");
      } finally {
        setLoadingPhotos(false);
        setLoadingPreviews(false);
      }
    },
    [idOs, loadPreviews]
  );

  useEffect(() => {
    if (!resolvedFatId) return;
    let active = true;

    const load = async () => {
      setInitialLoading(true);
      setError(null);

      try {
        const detail = await fatService.getById(resolvedFatId, true);
        if (!active) return;

        setFat(detail);
        setIdOs(detail.id_os);
        await fetchPhotos(detail.id_os);
      } catch (err) {
        console.error(err);
        if (active) {
          setError("Não foi possível carregar os dados da FAT.");
        }
      } finally {
        if (active) {
          setInitialLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [resolvedFatId, fetchPhotos]);

  const handleBackToFat = useCallback(() => {
    if (resolvedFatId) {
      router.push(`/tecnico/os/fat/${resolvedFatId}`);
    } else {
      router.back();
    }
  }, [router, resolvedFatId]);

  const handleOpenPicker = useCallback(() => {
    setError(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = "";

      if (!file) {
        return;
      }

      setError(null);
      const previewUrl = URL.createObjectURL(file);
      setPendingPreview((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return previewUrl;
      });
      setPendingFile(file);
      setDescricao("");
    },
    []
  );

  const handleClearSelection = useCallback(() => {
    setPendingFile(null);
    setPendingPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
    setDescricao("");
  }, []);

  const handleUploadPhoto = useCallback(async () => {
    if (!pendingFile) {
      setError("Selecione uma imagem antes de salvar.");
      return;
    }

    if (!descricaoValida) {
      setError("Informe uma descrição para a foto.");
      return;
    }

    if (resolvedFatId === null) {
      setError("FAT não encontrada. Recarregue a página e tente novamente.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await fatFotosService.upload(resolvedFatId, pendingFile, descricao);
      setSuccessMessage("Foto enviada com sucesso!");
      handleClearSelection();
      await fetchPhotos();
    } catch (err) {
      console.error(err);
      setError("Erro ao enviar a foto. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }, [
    pendingFile,
    descricaoValida,
    resolvedFatId,
    descricao,
    fetchPhotos,
    handleClearSelection,
  ]);

  const handleRefresh = useCallback(() => {
    if (idOs) {
      fetchPhotos(idOs);
    }
  }, [idOs, fetchPhotos]);

  const openViewer = useCallback((photo: FATFotoItem) => {
    setSelectedPhoto(photo);
  }, []);

  const closeViewer = useCallback(() => setSelectedPhoto(null), []);

  const selectedPhotoUrl = useMemo(() => {
    if (!selectedPhoto) return "";
    return photoPreviews[selectedPhoto.id_fat_foto] || "";
  }, [selectedPhoto, photoPreviews]);

  const hasPhotos = photos.length > 0;
  const canUpload = resolvedFatId !== null;

  return (
    <main className="min-h-screen bg-gray-50">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.2s ease-out both;
        }
      `}</style>

      <MobileHeader
        title="Fotos da FAT"
        onAddClick={handleBackToFat}
        leftVariant="back"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={false}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="px-4 pt-5 pb-24 max-w-3xl mx-auto space-y-4">
        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700 animate-fadeInUp">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-sm text-emerald-700 animate-fadeInUp">
            {successMessage}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3 animate-fadeInUp">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs uppercase text-slate-500 tracking-wide">
                Ordem de Serviço
              </p>
              <p className="text-base font-semibold text-slate-800">
                {fat?.id_os ? `#${fat.id_os}` : "-"}
              </p>
              <p className="text-sm text-slate-500">
                {fat?.maquina?.descricao || "Máquina não informada"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loadingPhotos || uploading}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:border-slate-300 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <RefreshCcw className="w-4 h-4" />
                Atualizar
              </button>
              <button
                type="button"
                onClick={handleOpenPicker}
                disabled={uploading || !canUpload}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-[#7B54BE] rounded-lg shadow-sm hover:bg-[#6A47A8] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <UploadCloud className="w-4 h-4" />
                {uploading ? "Processando..." : "Selecionar imagem"}
              </button>
            </div>
          </div>

          {pendingPreview ? (
            <div className="space-y-4">
              <div className="flex justify-center sm:justify-start">
                <div className="w-28 h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {pendingPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={pendingPreview}
                      alt={pendingFile?.name || "Pré-visualização da foto"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageOff className="w-6 h-6 text-slate-400" />
                  )}
                </div>
              </div>
              {pendingFile && (
                <p className="text-xs font-medium text-slate-500 break-words text-center sm:text-left">
                  {pendingFile.name}
                </p>
              )}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Descrição da foto*
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Descreva o que a imagem exibe..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-[#7B54BE] focus:outline-none transition-all text-sm text-slate-700 placeholder-slate-400"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleUploadPhoto}
                  disabled={uploading || !descricaoValida || !pendingFile}
                  className="w-full sm:flex-1 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg shadow-sm hover:bg-emerald-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {uploading ? "Salvando..." : "Salvar foto"}
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  disabled={uploading}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Confirme se a imagem e a descrição correspondem antes de salvar.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500 leading-relaxed">
              Selecione uma imagem da galeria para pré-visualizar aqui. Após
              conferir, informe uma descrição obrigatória e salve.
            </div>
          )}
        </div>

        {initialLoading ? (
          <Spinner />
        ) : (
          <section className="space-y-3">
            {loadingPhotos && <Spinner />}

            {!loadingPhotos && !hasPhotos && (
              <div className="bg-white border border-dashed border-slate-300 text-center py-12 rounded-xl animate-fadeInUp">
                <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Nenhuma foto cadastrada
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Utilize o botão acima para enviar imagens da galeria.
                </p>
              </div>
            )}

            {hasPhotos && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo) => {
                  const previewUrl = photoPreviews[photo.id_fat_foto];
                  return (
                    <button
                      key={photo.id_fat_foto}
                      type="button"
                      onClick={() => openViewer(photo)}
                      className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7B54BE] focus:ring-offset-2 transition"
                    >
                      <div className="aspect-square bg-slate-100 flex items-center justify-center">
                        {previewUrl && !loadingPreviews ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt={photo.nome_arquivo}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        ) : loadingPreviews ? (
                          <div className="w-6 h-6 border-2 border-white border-t-[#7B54BE] rounded-full animate-spin" />
                        ) : (
                          <ImageOff className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <div className="p-2 text-left">
                        <p className="text-sm font-semibold text-slate-700 line-clamp-1">
                          {photo.descricao || photo.nome_arquivo}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDateTime(photo.data_cadastro)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="flex justify-end p-4">
            <button
              type="button"
              onClick={closeViewer}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center px-4 pb-4">
            {selectedPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedPhotoUrl}
                alt={selectedPhoto.nome_arquivo}
                className="max-h-full max-w-full object-contain rounded-lg shadow-2xl"
              />
            ) : (
              <div className="text-white text-sm flex flex-col items-center gap-3">
                <ImageOff className="w-8 h-8" />
                Pré-visualização indisponível.
              </div>
            )}
          </div>
          <div className="bg-white px-4 py-3 border-t border-slate-200 space-y-1">
            <p className="text-sm font-semibold text-slate-700">
              {selectedPhoto.descricao || selectedPhoto.nome_arquivo}
            </p>
            <p className="text-xs text-slate-500">
              Enviada em {formatDateTime(selectedPhoto.data_cadastro)}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
