import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
  Pencil,
  Trash2,
  X,
  Upload,
} from "lucide-react";
import type { OSDetalhadaV2 } from "@/api/services/ordensServicoService";
import {
  fatFotosService,
  type FATFotoItem,
} from "@/api/services/fatFotosService";
import { useToast } from "@/components/admin/ui/ToastContainer";

interface FotosTabProps {
  osId: number;
  fats: OSDetalhadaV2["fats"];
  onCountChange?: (count: number) => void;
}

type FotoState = FATFotoItem & {
  previewUrl: string | null;
  isEditing: boolean;
  tempDescricao: string;
};

const FotosTab: React.FC<FotosTabProps> = ({ osId, fats, onCountChange }) => {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<FotoState[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFatId, setSelectedFatId] = useState<number | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");

  const { showSuccess, showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlsRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    onCountChange?.(photos.length);
  }, [onCountChange, photos.length]);

  const fatInfoMap = useMemo(() => {
    const map = new Map<number, { dataAtendimento?: string }>();
    fats.forEach((fat) => {
      map.set(fat.id_fat, { dataAtendimento: fat.data_atendimento });
    });
    return map;
  }, [fats]);

  const loadPhotos = useCallback(async () => {
    if (!osId) {
      setPhotos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);

    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();

    try {
      const response = await fatFotosService.listar(osId);
      const getTime = (value: string) => {
        const parsed = new Date(value).getTime();
        return Number.isNaN(parsed) ? 0 : parsed;
      };

      const ordered = [...response].sort(
        (a, b) => getTime(b.data_cadastro) - getTime(a.data_cadastro)
      );

      if (ordered.length === 0) {
        setPhotos([]);
        setSelectedIndex(null);
        return;
      }

      const results = await Promise.allSettled(
        ordered.map(async (foto) => {
          try {
            const blob = await fatFotosService.visualizar(foto.id_fat_foto);
            const url = URL.createObjectURL(blob);
            return { id: foto.id_fat_foto, url };
          } catch (err) {
            console.error("Erro ao carregar imagem da FAT:", err);
            return { id: foto.id_fat_foto, url: "" };
          }
        })
      );

      const urlsMap = new Map<number, string>();
      let hadPreviewErrors = false;

      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.url) {
          urlsMap.set(result.value.id, result.value.url);
        } else {
          hadPreviewErrors = true;
        }
      });

      objectUrlsRef.current = urlsMap;

      setPhotos(
        ordered.map((foto) => ({
          ...foto,
          previewUrl: urlsMap.get(foto.id_fat_foto) ?? null,
          isEditing: false,
          tempDescricao: foto.descricao ?? "",
        }))
      );

      if (hadPreviewErrors) {
        setWarning("Algumas imagens nao puderam ser exibidas.");
      }
    } catch (err) {
      console.error("Erro ao carregar fotos da OS:", err);
      setPhotos([]);
      setSelectedIndex(null);
      const message =
        err instanceof Error
          ? err.message
          : "Nao foi possivel carregar as fotos da OS.";
      setError(message);
      showError("Erro ao carregar fotos", message);
    } finally {
      setLoading(false);
    }
  }, [osId, showError]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  useEffect(() => {
    if (!selectedFatId && fats.length > 0) {
      setSelectedFatId(fats[0].id_fat);
    }
  }, [fats, selectedFatId]);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
      if (pendingPreview) {
        URL.revokeObjectURL(pendingPreview);
      }
    };
  }, [pendingPreview]);

  const handleStartEditing = (id: number) => {
    setError(null);
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id_fat_foto === id
          ? {
              ...photo,
              isEditing: true,
              tempDescricao: photo.descricao ?? "",
            }
          : { ...photo, isEditing: false }
      )
    );
  };

  const handleDescricaoChange = (id: number, value: string) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id_fat_foto === id
          ? {
              ...photo,
              tempDescricao: value,
            }
          : photo
      )
    );
  };

  const handleCancelEditing = (id: number) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id_fat_foto === id
          ? {
              ...photo,
              isEditing: false,
              tempDescricao: photo.descricao ?? "",
            }
          : photo
      )
    );
  };

  const handleSaveDescricao = async (id: number) => {
    const currentPhoto = photos.find((item) => item.id_fat_foto === id);
    if (!currentPhoto) {
      return;
    }

    const trimmed = currentPhoto.tempDescricao.trim();
    if (!trimmed) {
      setError("Informe uma descricao para a foto.");
      return;
    }

    if (trimmed === (currentPhoto.descricao ?? "")) {
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id_fat_foto === id
            ? {
                ...photo,
                isEditing: false,
                tempDescricao: trimmed,
              }
            : photo
        )
      );
      return;
    }

    setSavingId(id);
    setError(null);

    try {
      const responseMessage = await fatFotosService.atualizarDescricao(
        id,
        trimmed
      );
      setPhotos((prev) =>
        prev.map((photo) =>
          photo.id_fat_foto === id
            ? {
                ...photo,
                descricao: trimmed,
                tempDescricao: trimmed,
                isEditing: false,
              }
            : photo
        )
      );
      showSuccess(
        "Descricao atualizada",
        responseMessage ?? "Descricao atualizada com sucesso."
      );
    } catch (err) {
      console.error("Erro ao atualizar descricao da foto:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Nao foi possivel atualizar a descricao da foto.";
      setError(message);
      showError("Erro ao atualizar descricao da foto", message);
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Tem certeza que deseja excluir a foto? Esta operacao nao pode ser desfeita"
    );

    if (!confirmDelete) {
      return;
    }

    setDeletingId(id);
    setError(null);

    try {
      const responseMessage = await fatFotosService.excluir(id);
      const url = objectUrlsRef.current.get(id);
      if (url) {
        URL.revokeObjectURL(url);
        objectUrlsRef.current.delete(id);
      }
      setPhotos((prev) => {
        const index = prev.findIndex((photo) => photo.id_fat_foto === id);
        const next = prev.filter((photo) => photo.id_fat_foto !== id);
        setSelectedIndex((current) => {
          if (current === null || index === -1) {
            return current;
          }
          if (index === current) {
            if (next.length === 0) {
              return null;
            }
            return Math.min(current, next.length - 1);
          }
          if (index < current) {
            return current - 1;
          }
          return current;
        });
        return next;
      });
      showSuccess(
        "Foto excluida",
        responseMessage ?? "Foto excluida com sucesso."
      );
    } catch (err) {
      console.error("Erro ao excluir foto:", err);
      const message =
        err instanceof Error ? err.message : "Nao foi possivel excluir a foto.";
      setError(message);
      showError("Erro ao excluir foto", message);
    } finally {
      setDeletingId(null);
    }
  };

  const openViewer = (index: number) => {
    setSelectedIndex(index);
  };

  const closeViewer = () => {
    setSelectedIndex(null);
  };

  const showNext = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null || photos.length === 0) {
        return current;
      }
      return (current + 1) % photos.length;
    });
  }, [photos.length]);

  const showPrevious = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null || photos.length === 0) {
        return current;
      }
      return (current - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  useEffect(() => {
    if (selectedIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeViewer();
      }
      if (event.key === "ArrowRight" && photos.length > 1) {
        showNext();
      }
      if (event.key === "ArrowLeft" && photos.length > 1) {
        showPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, photos.length, showNext, showPrevious]);

  const hasPhotos = photos.length > 0;
  const hasMultiplePhotos = photos.length > 1;
  const selectedPhoto =
    selectedIndex !== null && photos[selectedIndex]
      ? photos[selectedIndex]
      : null;
  const descricaoValida = descricao.trim().length > 0;

  const handleOpenPicker = () => {
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    setError(null);
    const previewUrl = URL.createObjectURL(file);
    setPendingPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setPendingFile(file);
    setDescricao("");
  };

  const handleClearSelection = () => {
    setPendingFile(null);
    setDescricao("");
    setPendingPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleUpload = async () => {
    if (uploading) return;

    if (!selectedFatId) {
      setError("Selecione uma FAT para vincular a foto.");
      return;
    }

    if (!pendingFile) {
      setError("Escolha uma imagem para enviar.");
      return;
    }

    if (!descricaoValida) {
      setError("Informe uma descricao para a foto.");
      return;
    }

    setError(null);
    setWarning(null);
    setUploading(true);

    try {
      await fatFotosService.upload(selectedFatId, pendingFile, descricao);
      handleClearSelection();
      await loadPhotos();
      showSuccess("Foto enviada", "Foto enviada com sucesso.");
    } catch (err) {
      console.error("Erro ao enviar foto:", err);
      const message =
        err instanceof Error ? err.message : "Nao foi possivel enviar a foto.";
      setError(message);
      showError("Erro ao enviar foto", message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Fotos da OS</h3>
        {hasPhotos && (
          <span className="text-sm text-gray-500">
            {photos.length} {photos.length === 1 ? "foto" : "fotos"}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={false}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">
              FAT para vincular
            </label>
            <select
              value={selectedFatId ?? ""}
              onChange={(event) =>
                setSelectedFatId(
                  event.target.value ? Number(event.target.value) : null
                )
              }
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            >
              <option value="">Selecione a FAT</option>
              {fats.map((fat) => (
                <option key={fat.id_fat} value={fat.id_fat}>
                  FAT {fat.id_fat} - {fat.data_atendimento}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleOpenPicker}
            disabled={uploading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Processando..." : "Selecionar imagem"}
          </button>
        </div>

        {pendingPreview ? (
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pendingPreview}
                    alt={pendingFile?.name || "Pre-visualizacao"}
                    className="h-full w-full object-cover"
                  />
                </div>
                {pendingFile && (
                  <p className="text-xs text-gray-600 text-center break-words max-w-[9rem]">
                    {pendingFile.name}
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-600 tracking-wide">
                    Descricao da foto*
                  </label>
                  <input
                    type="text"
                    value={descricao}
                    onChange={(event) => setDescricao(event.target.value)}
                    placeholder="Descreva o que a imagem exibe..."
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || !pendingFile || !descricaoValida}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {uploading ? "Enviando..." : "Salvar foto"}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSelection}
                    disabled={uploading}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancelar
                  </button>
                </div>

                <p className="text-xs text-gray-500">
                  Confirme a imagem e a descricao antes de salvar.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-xs text-gray-600">
            Selecione uma imagem para pre-visualizar aqui. Depois informe uma
            descricao obrigatoria e salve.
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {warning && !error && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {warning}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
        </div>
      ) : !hasPhotos ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-center">
          <ImageOff className="mb-3 h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-600">
            Nenhuma foto encontrada para esta OS.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Nenhuma foto foi registrada ate o momento.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 justify-start">
          {photos.map((foto, index) => {
            const fatInfo = foto.id_fat
              ? fatInfoMap.get(foto.id_fat)
              : undefined;
            const isSaving = savingId === foto.id_fat_foto;
            const isDeleting = deletingId === foto.id_fat_foto;
            const isSaveDisabled = isSaving || !foto.tempDescricao.trim();

            return (
              <div
                key={foto.id_fat_foto}
                className="relative flex w-full sm:w-[calc(50%-6px)] lg:w-[calc(33.333%-8px)] xl:w-[calc(25%-9px)] max-w-[280px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => openViewer(index)}
                  className="group relative block h-40 w-full overflow-hidden bg-gray-100"
                  title="Ampliar imagem"
                >
                  {foto.previewUrl ? (
                    <Image
                      src={foto.previewUrl}
                      alt={foto.descricao || foto.nome_arquivo}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      priority={index < 2}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                </button>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-semibold text-gray-800">
                      {foto.id_fat ? (
                        <>
                          FAT <span className="font-bold">#{foto.id_fat}</span>
                        </>
                      ) : (
                        "FAT nao informada"
                      )}
                    </span>
                    <span>{foto.data_cadastro}</span>
                  </div>

                  {fatInfo?.dataAtendimento && (
                    <p className="text-xs text-gray-500">
                      Atendimento: {fatInfo.dataAtendimento}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <p className="flex-1 text-sm text-gray-700">
                        {foto.descricao?.trim()
                          ? foto.descricao
                          : "Descricao nao informada"}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleStartEditing(foto.id_fat_foto)}
                        className="rounded-full p-1 text-blue-500 transition hover:bg-blue-50 hover:text-blue-600"
                        title="Editar descricao"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(foto.id_fat_foto)}
                        disabled={isDeleting}
                        className="rounded-full p-1 text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                        title="Excluir foto"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {foto.isEditing && (
                      <div className="space-y-2">
                        <textarea
                          value={foto.tempDescricao}
                          onChange={(event) =>
                            handleDescricaoChange(
                              foto.id_fat_foto,
                              event.target.value
                            )
                          }
                          rows={3}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleCancelEditing(foto.id_fat_foto)
                            }
                            className="rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleSaveDescricao(foto.id_fat_foto)
                            }
                            disabled={isSaveDisabled}
                            className="inline-flex items-center gap-1 rounded-md bg-[var(--primary)] px-3 py-1 text-sm font-medium text-white transition hover:bg-[var(--primary)]/90 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Salvar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeViewer}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeViewer}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/70 p-2 text-white transition hover:bg-black"
              title="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            {hasMultiplePhotos && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showPrevious();
                  }}
                  className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow transition hover:bg-white"
                  title="Foto anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    showNext();
                  }}
                  className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow transition hover:bg-white"
                  title="Proxima foto"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <div className="relative flex h-[70vh] items-center justify-center bg-black">
              {selectedPhoto.previewUrl ? (
                <Image
                  src={selectedPhoto.previewUrl}
                  alt={selectedPhoto.descricao || selectedPhoto.nome_arquivo}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-gray-200">
                  <ImageOff className="h-10 w-10" />
                  <span className="text-sm">
                    Pre-visualizacao indisponivel para esta imagem.
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-1 text-sm text-gray-600">
                <span className="font-semibold text-gray-800">
                  {selectedPhoto.descricao?.trim()
                    ? selectedPhoto.descricao
                    : selectedPhoto.nome_arquivo}
                </span>
                <span>
                  {selectedPhoto.id_fat
                    ? `FAT ${selectedPhoto.id_fat}`
                    : "FAT nao informada"}
                </span>
                <span>Registro: {selectedPhoto.data_cadastro}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FotosTab;
