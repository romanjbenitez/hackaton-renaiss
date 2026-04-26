"use client";

import { useId, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type UploadedDocumentInput = {
  base64: string;
  fileName: string;
  mimeType: string;
  previewUrl: string;
  sizeLabel: string;
};

type DocumentUploaderProps = {
  label: string;
  helperText: string;
  accept?: string;
  onUpload: (document: UploadedDocumentInput) => void;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploader({ label, helperText, accept, onUpload }: DocumentUploaderProps) {
  const inputId = useId();
  const [previewName, setPreviewName] = useState<string | null>(null);

  return (
    <div className="bg-background rounded-3xl border p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-medium">{label}</h3>
          <p className="text-muted-foreground text-sm">{helperText}</p>
        </div>

        <label
          htmlFor={inputId}
          className={cn(buttonVariants({ variant: "outline" }), "cursor-pointer rounded-2xl")}
        >
          Seleccionar archivo
        </label>
      </div>

      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result;

            if (typeof result !== "string") {
              return;
            }

            setPreviewName(file.name);
            onUpload({
              base64: result,
              fileName: file.name,
              mimeType: file.type || "application/octet-stream",
              previewUrl: result,
              sizeLabel: formatBytes(file.size),
            });
          };

          reader.readAsDataURL(file);
          event.target.value = "";
        }}
      />

      {previewName ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Último archivo seleccionado: {previewName}
        </p>
      ) : null}
    </div>
  );
}
