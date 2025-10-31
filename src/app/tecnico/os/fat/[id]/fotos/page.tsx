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
  ChevronLeft,
  ChevronRight,
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

const formatDate = (value?: string) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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
  const [currentFatPhotos, setCurrentFatPhotos] = useState<FATFotoItem[]>([]);
  const [otherFatPhotos, setOtherFatPhotos] = useState<FATFotoItem[]>([]);
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
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );

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
    async (targetIdOs?: number, targetFatId?: number | null) => {
      const effectiveIdOs = targetIdOs ?? idOs;
      if (!effectiveIdOs) return;

      const activeFatId = targetFatId ?? resolvedFatId ?? null;

      setLoadingPhotos(true);
      setError(null);
      try {
        const data = await fatFotosService.listar(effectiveIdOs);

        const { current, others } =
          activeFatId === null
            ? { current: data, others: [] }
            : data.reduce(
                (acc, item) => {
                  if (item.id_fat === activeFatId) acc.current.push(item);
                  else acc.others.push(item);
                  return acc;
                },
                { current: [] as FATFotoItem[], others: [] as FATFotoItem[] }
              );

        const orderedPhotos =
          activeFatId === null ? data : [...current, ...others];

        setCurrentFatPhotos(current);
        setOtherFatPhotos(others);
        setPhotos(orderedPhotos);
        setLoadingPreviews(true);
        await loadPreviews(orderedPhotos);
      } catch (err) {
        console.error(err);
        setCurrentFatPhotos([]);
        setOtherFatPhotos([]);
        setPhotos([]);
        setPhotoPreviews({});
        setError("Nǜo foi poss��vel carregar as fotos. Tente novamente.");
      } finally {
        setLoadingPhotos(false);
        setLoadingPreviews(false);
      }
    },
    [idOs, loadPreviews, resolvedFatId]
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
        await fetchPhotos(detail.id_os, detail.id_fat ?? null);
      } catch (err) {
        console.error(err);
        if (active) {
          setError("Não foi possí­vel carregar os dados da FAT.");
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
      fetchPhotos(idOs, resolvedFatId);
    }
  }, [idOs, fetchPhotos, resolvedFatId]);

  const openViewer = useCallback(
    (photoId: number) => {
      const index = photos.findIndex((item) => item.id_fat_foto === photoId);
      if (index >= 0) {
        setSelectedPhotoIndex(index);
      }
    },
    [photos]
  );

  const closeViewer = useCallback(() => setSelectedPhotoIndex(null), []);

  useEffect(() => {
    if (selectedPhotoIndex === null) return;
    if (photos.length === 0) {
      setSelectedPhotoIndex(null);
      return;
    }
    if (selectedPhotoIndex > photos.length - 1) {
      setSelectedPhotoIndex(photos.length - 1);
    }
  }, [photos, selectedPhotoIndex]);

  const selectedPhoto = useMemo(() => {
    if (selectedPhotoIndex === null) return null;
    return photos[selectedPhotoIndex] ?? null;
  }, [photos, selectedPhotoIndex]);

  const selectedPhotoUrl = useMemo(() => {
    if (!selectedPhoto) return "";
    return photoPreviews[selectedPhoto.id_fat_foto] || "";
  }, [selectedPhoto, photoPreviews]);

  const showNextPhoto = useCallback(() => {
    if (!photos.length) return;
    setSelectedPhotoIndex((prev) => {
      if (prev === null) return prev;
      const nextIndex = (prev + 1) % photos.length;
      return nextIndex;
    });
  }, [photos.length]);

  const showPreviousPhoto = useCallback(() => {
    if (!photos.length) return;
    setSelectedPhotoIndex((prev) => {
      if (prev === null) return prev;
      const nextIndex = (prev - 1 + photos.length) % photos.length;
      return nextIndex;
    });
  }, [photos.length]);

  const hasPhotos = photos.length > 0;
  const hasCurrentPhotos = currentFatPhotos.length > 0;
  const hasOtherPhotos = otherFatPhotos.length > 0;
  const hasMultiplePhotos = photos.length > 1;
  const currentPhotoPosition =
    selectedPhotoIndex !== null ? selectedPhotoIndex + 1 : 0;
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
        title="Fotos das FATs"
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
              <p className="text-base font-semibold text-slate-800 flex items-center gap-2">
                {fat?.id_os ? (
                  <span className="text-slate-700">
                    OS&nbsp;
                    <span className="text-slate-900">
                      #{fat.id_os} &nbsp;&nbsp;&nbsp;&nbsp;
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400">OS -</span>
                )}

                {fat?.id_fat ? (
                  <span className="text-slate-700">
                    FAT&nbsp;
                    <span className="text-slate-900">#{fat.id_fat}</span>
                  </span>
                ) : (
                  <span className="text-slate-400">FAT -</span>
                )}
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
                Confirme se a imagem e a descrição correspondem antes de
                salvar.
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
              <div className="space-y-6">
                {hasCurrentPhotos && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fotos desta FAT
                    </p>
                    <div className="flex flex-col gap-3">
                      {currentFatPhotos.map((photo) => {
                        const previewUrl = photoPreviews[photo.id_fat_foto];
                        return (
                          <button
                            key={photo.id_fat_foto}
                            type="button"
                            onClick={() => openViewer(photo.id_fat_foto)}
                            className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-left transition hover:border-[#7B54BE]/60 focus:outline-none focus:ring-2 focus:ring-[#7B54BE] focus:ring-offset-2"
                          >
                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              {previewUrl && !loadingPreviews ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={previewUrl}
                                  alt={photo.nome_arquivo}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : loadingPreviews ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="h-6 w-6 rounded-full border-2 border-white border-t-[#7B54BE] animate-spin" />
                                </div>
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <ImageOff className="h-6 w-6 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-700 line-clamp-2">
                                {photo.descricao || photo.nome_arquivo}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {formatDate(photo.data_cadastro)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasOtherPhotos && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Fotos de outras FATs
                    </p>
                    <div className="flex flex-col gap-3">
                      {otherFatPhotos.map((photo) => {
                        const previewUrl = photoPreviews[photo.id_fat_foto];
                        return (
                          <button
                            key={photo.id_fat_foto}
                            type="button"
                            onClick={() => openViewer(photo.id_fat_foto)}
                            className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-left transition hover:border-[#7B54BE]/60 focus:outline-none focus:ring-2 focus:ring-[#7B54BE] focus:ring-offset-2"
                          >
                            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                              {previewUrl && !loadingPreviews ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={previewUrl}
                                  alt={photo.nome_arquivo}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                />
                              ) : loadingPreviews ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="h-6 w-6 rounded-full border-2 border-white border-t-[#7B54BE] animate-spin" />
                                </div>
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <ImageOff className="h-6 w-6 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-700 line-clamp-2">
                                {photo.descricao || photo.nome_arquivo}
                              </p>
                              {photo.id_fat ? (
                                <p className="mt-1 text-xs text-slate-500">
                                  FAT {photo.id_fat}
                                </p>
                              ) : null}
                              <p className="mt-1 text-xs text-slate-500">
                                {formatDate(photo.data_cadastro)}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewer();
            }
          }}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="relative flex items-center justify-center bg-slate-950/95 px-12 py-10">
              <button
                type="button"
                onClick={showPreviousPhoto}
                disabled={!hasMultiplePhotos}
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {selectedPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedPhotoUrl}
                  alt={selectedPhoto.descricao || selectedPhoto.nome_arquivo}
                  className="max-h-[65vh] w-full max-w-[90%] rounded-xl object-contain shadow-xl"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-white">
                  <ImageOff className="h-10 w-10" />
                  Pré-visualização indisponí­vel.
                </div>
              )}

              <button
                type="button"
                onClick={showNextPhoto}
                disabled={!hasMultiplePhotos}
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-800 shadow transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1 border-t border-slate-200 px-6 py-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {hasMultiplePhotos
                    ? `Foto ${currentPhotoPosition} de ${photos.length}`
                    : "Foto única"}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {selectedPhoto.descricao || selectedPhoto.nome_arquivo}
              </p>
              <p className="text-xs text-slate-500">
                Enviada em {formatDateTime(selectedPhoto.data_cadastro)}
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
