"use client";

import { useRef, useState } from "react";

type PhotoUploaderProps = {
  defaultUrls?: string[];
};

export function PhotoUploader({ defaultUrls = [] }: PhotoUploaderProps) {
  const [urls, setUrls] = useState<string[]>(defaultUrls);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/agency/photos", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir fotos");
      setUrls((prev) => [...prev, ...(data.urls as string[])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron subir las fotos.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeUrl(url: string) {
    setUrls((prev) => prev.filter((u) => u !== url));
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="photoUrls" value={urls.join("\n")} />

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="relative">
              <img
                src={url}
                alt="Foto de propiedad"
                className="h-24 w-24 rounded-xl border object-cover"
              />
              <button
                type="button"
                onClick={() => removeUrl(url)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs text-white hover:bg-rose-600"
                aria-label="Eliminar foto"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:bg-slate-100">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <span className="text-sm font-medium text-slate-600">
          {uploading ? "Subiendo fotos..." : "Hacer clic para seleccionar fotos"}
        </span>
        <span className="text-xs text-slate-400">JPG, PNG, WEBP · hasta 10 MB por foto</span>
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  );
}
